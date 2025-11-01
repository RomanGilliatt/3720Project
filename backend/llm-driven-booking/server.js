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
You are a ticket booking assistant. Be concise and direct. If you detect event and ticket quantity information, proceed with booking.

Rules:
1. If the user's message contains both an event name and ticket quantity, book the tickets
2. If the message is missing event name OR ticket quantity, ask for ONLY the missing information
3. Keep responses under 2 sentences when possible

Current request: "${text}"

If you detect booking intent, include this JSON at the end of your response:
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
        // Verify event exists and process booking if intent detected
        if (parsedData.event && parsedData.tickets) {
          const db = await dbPromise;
          
          // Start transaction
          await db.exec("BEGIN TRANSACTION");
          
          try {
            // Find the event
            const existing = await db.get(
              "SELECT * FROM events WHERE LOWER(name) LIKE LOWER(?)",
              [`%${parsedData.event}%`]
            );
            
            if (!existing) {
              throw new Error("Event not found");
            }

            // Check ticket availability
            if (existing.tickets_available < parsedData.tickets) {
              throw new Error(`Only ${existing.tickets_available} tickets available`);
            }

            // Update ticket count
            const newCount = existing.tickets_available - parsedData.tickets;
            await db.run(
              "UPDATE events SET tickets_available = ? WHERE id = ?",
              [newCount, existing.id]
            );

            // Commit transaction
            await db.exec("COMMIT");

            // Return success response
            return res.json({
              message: `Successfully booked ${parsedData.tickets} tickets for ${existing.name}. You have confirmation #${Date.now()}. There are ${newCount} tickets remaining.`,
              parsed: {
                ...parsedData,
                eventId: existing.id,
                remainingTickets: newCount,
                success: true
              }
            });

          } catch (error) {
            // Rollback transaction on error
            await db.exec("ROLLBACK");
            return res.json({
              message: `Booking failed: ${error.message}`,
              parsed: {
                ...parsedData,
                success: false,
                error: error.message
              }
            });
          }
        }
      } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
      }
    }

    // Return response for non-booking messages
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
