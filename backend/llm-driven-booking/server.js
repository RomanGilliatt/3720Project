// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to shared SQLite database
const dbPromise = open({
  filename: "../shared-db/database.sqlite",
  driver: sqlite3.Database
});

// LLM PARSING ENDPOINT
app.post("/api/llm/parse", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text input" });

  try {
    // Ask the local Ollama model to extract structured info
    const prompt = `
You are a ticket booking assistant. Extract the event name, ticket quantity, and intent from this sentence.
Respond in JSON ONLY, like:
{"event": "Jazz Night", "tickets": 2, "intent": "book"}

User input: "${text}"
`;

    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b",
      prompt,
      stream: false
    });

    const raw = response.data.response.trim();

    // Try parsing the LLM output as JSON
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(400).json({
        error: "Could not parse LLM output",
        raw
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to communicate with LLM" });
  }
});

// BOOKING CONFIRMATION ENDPOINT
app.post("/api/llm/confirm", async (req, res) => {
  const { event, tickets } = req.body;
  if (!event || !tickets)
    return res.status(400).json({ error: "Missing event or ticket count" });

  const db = await dbPromise;
  try {
    await db.exec("BEGIN TRANSACTION");

    // Find event
    const existing = await db.get("SELECT * FROM events WHERE name = ?", event);
    if (!existing)
      throw new Error("Event not found");

    if (existing.available_tickets < tickets)
      throw new Error("Not enough tickets available");

    // Update tickets
    const newCount = existing.available_tickets - tickets;
    await db.run("UPDATE events SET available_tickets = ? WHERE id = ?", newCount, existing.id);

    await db.exec("COMMIT");

    res.json({
      success: true,
      message: `Booked ${tickets} ticket(s) for ${event}.`
    });
  } catch (err) {
    await (await dbPromise).exec("ROLLBACK");
    res.status(400).json({ error: err.message });
  }
});

app.listen(7001, () => {
  console.log("LLM-driven booking service running on port 7001");
});
