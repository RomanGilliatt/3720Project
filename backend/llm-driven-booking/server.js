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

/// LLM PARSING ENDPOINT
app.post("/api/llm/parse", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text input" });

  try {
    const prompt = `
You are a ticket booking assistant. Be concise. If you detect event name and ticket quantity, propose booking, but do NOT update database until user confirms.

Rules:
1. If both event name and ticket quantity are detected, propose booking with JSON.
2. If missing either, ask ONLY for the missing information.
3. Keep responses under 2 sentences.
4. Include this JSON at the end if booking can be proposed:
{"event": "Event Name", "tickets": quantity}
`;

    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "llama3.2:3b",
      prompt,
      stream: false
    });

    const llmResponse = response.data.response.trim();

    // Try to extract JSON if present
    let parsedData = null;
    const jsonMatch = llmResponse.match(/\{.*\}/s);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
      }
    }

    // Return LLM response without touching DB
    res.json({
      message: llmResponse.replace(/\{.*\}/s, '').trim(),
      parsed: parsedData
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to communicate with LLM" });
  }
});

app.listen(7001, () => {
  console.log("LLM-driven booking service running on port 7001");
});
