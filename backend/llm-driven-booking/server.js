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
    // Updated prompt to be more direct and decisive
    const prompt = `
You are a ticket booking assistant. Be concise and direct. If you detect event and ticket quantity information, provide a clear booking proposal without asking additional questions.

Rules:
1. If the user's message contains both an event name and ticket quantity, provide a direct booking proposal
2. If the message is missing event name OR ticket quantity, ask for ONLY the missing information
3. Do not ask about seating, ticket types, or additional preferences
4. Keep responses under 2 sentences when possible
5. Don't ask for confirmation if all information is provided

Current request: "${text}"

If you detect booking intent, include this JSON at the end of your response:
{"event": "Event Name", "tickets": quantity}

Example good responses:
- "I can help you book 2 tickets for Clemson Music Fest 2025. {"event": "Clemson Music Fest 2025", "tickets": 2}"
- "How many tickets would you like to book for Clemson Music Fest 2025?"
- "Which event would you like to book 2 tickets for?"
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
            // Add availability check response
            const canBook = existing.tickets_available >= parsedData.tickets;
            const availabilityMsg = canBook 
              ? `There are ${existing.tickets_available} tickets available for this event.`
              : `Sorry, only ${existing.tickets_available} tickets are available for this event.`;
            return res.json({
              message: `${llmResponse.replace(/\{.*\}/s, '').trim()} ${availabilityMsg}`,
              parsed: parsedData
            });
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
