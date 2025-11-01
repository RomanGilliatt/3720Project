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
    // Ask the local Ollama model to provide a conversational response
    const prompt = `
You are a helpful ticket booking assistant. Analyze the user's request and respond conversationally.
If they want to book tickets, look for event name and quantity, then propose a booking (don't actually book).
Include the extracted information in your response if relevant.

Current request: "${text}"

Respond naturally, but if you detect a booking intent, include this JSON at the end of your response:
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
        // Verify event exists if booking intent detected
        if (parsedData.event && parsedData.tickets) {
          const db = await dbPromise;
          const existing = await db.get(
            "SELECT * FROM events WHERE LOWER(name) LIKE LOWER(?)",
            [`%${parsedData.event}%`]
          );
          
          if (existing) {
            parsedData.eventId = existing.id;
            parsedData.availableTickets = existing.tickets_available;
          }
        }
      } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
      }
    }

    // Return both the conversational response and parsed data
    res.json({
      message: llmResponse.replace(/\{.*\}/s, '').trim(), // Remove JSON from display message
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
