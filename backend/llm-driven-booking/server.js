// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const PORT = process.env.PORT || 3000;

const app = express();
//app.use(cors());
app.use(bodyParser.json());

const allowedOrigins = [
  'https://frontend-lac-one-73.vercel.app',
  'https://frontend-git-main-tiger-tix1.vercel.app',
  'https://frontend-4mj8x9uek-tiger-tix1.vercel.app'
];

// Use cors globally
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },credentials: true, // allows cookies
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Connect to shared SQLite database
const dbPromise = open({
  filename: "../shared-db/database.sqlite",
  driver: sqlite3.Database
});

/// LLM PARSING ENDPOINT (FIXED)
app.post("/api/llm/parse", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text input" });

  try {
    // Include user's text in the prompt
    const prompt = `
You are a ticket booking assistant. Be concise. If you detect event name and ticket quantity, propose booking, but do NOT update database until user confirms.

Rules:
1. If both event name and ticket quantity are detected, propose booking with JSON.
2. If missing either, ask ONLY for the missing information.
3. Keep responses under 2 sentences.
4. Include this JSON at the end if booking can be proposed:
{"event": "Event Name", "tickets": quantity}

User message: "${text}"
`;
    const OLLAMA_API_KEY = process.env.LLM_KEY;

    if (!OLLAMA_API_KEY) {
      console.error("Error: OLLAMA_API_KEY is not set!");
      //process.exit(1);
    }

    const response = await axios.post(
    "https://api.ollama.com/v1/generate", //Ollama cloud API endpoint
    {
      model: "llama3.2:3b",
      prompt: prompt
    },
    {
      headers: {
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    const llmResponse = response.data.response.trim();

    //Extract JSON safely
    let parsedData = null;
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
      }
    }

    // Clean final message
    const message = llmResponse.replace(/\{[\s\S]*\}/, "").trim();

    res.json({
      message: message || "(No message returned)",
      parsed: parsedData
    });

  } catch (err) {
  console.error("LLM ERROR FULL DETAILS:", {
    message: err.message,
    code: err.code,
    status: err.response?.status,
    headers: err.response?.headers,
    data: err.response?.data
  });

  return res.status(500).json({
    error: "LLM request failed",
    details: err.response?.data || err.message || err
  });
}
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
