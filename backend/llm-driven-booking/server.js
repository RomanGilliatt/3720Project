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
  'https://frontend-4mj8x9uek-tiger-tix1.vercel.app',
  'https://frontend-7s1e4cx01-tiger-tix1.vercel.app/'
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

// ===== LLM Parsing Endpoint =====
app.post("/api/llm/parse", async (req, res) => {
  console.log("==== Incoming /api/llm/parse Request ====");
  console.log("Body:", req.body);

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text input" });

  // Read API key
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  console.log("LLM_KEY set?:", GROQ_API_KEY ? "YES" : "NO");

  if (!GROQ_API_KEY) {
    console.error("ERROR: LLM_KEY is not set on Render!");
    return res.status(500).json({ error: "Server missing LLM_KEY env variable" });
  }

  try {
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

    console.log("Sending request to Groq...");

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Groq response received:", response.data);

    const llmResponse = response.data.choices[0].message.content.trim();

    // Extract JSON safely
    let parsedData = null;
    const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse JSON from LLM response:", e);
      }
    }

    const message = llmResponse.replace(/\{[\s\S]*\}/, "").trim();

    res.json({ message: message || "(No message returned)", parsed: parsedData });

  } catch (err) {
    console.error("LLM ERROR FULL DETAILS:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      headers: err.response?.headers,
      data: err.response?.data
    });

    res.status(500).json({
      error: "LLM request failed",
      details: err.response?.data || err.message || err
    });
  }
});

// ===== Start server =====
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
