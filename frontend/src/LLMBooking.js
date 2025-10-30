import React, { useState } from "react";
import axios from "axios";

export default function LLMBooking({ refreshEvents }) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [message, setMessage] = useState("");
  const [parsing, setParsing] = useState(false);

  // Step 1: Parse user input with LLM
  const handleParse = async () => {
    if (!input.trim()) return;

    setParsing(true);
    setMessage("Parsing your request...");

    try {
      const res = await axios.post("http://localhost:7001/api/llm/parse", {
        text: input
      });

      setParsed(res.data);
      setMessage(`LLM parsed your request: Event="${res.data.event}", Tickets=${res.data.tickets}`);
    } catch (err) {
      console.error(err);
      setMessage("Failed to parse request. Try again.");
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  // Step 2: Confirm booking with backend
  const handleConfirmBooking = async () => {
    if (!parsed) {
      setMessage("Parse your request first.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:7001/api/llm/confirm", {
        event: parsed.event,
        tickets: parsed.tickets
      });

      setMessage(res.data.message);
      setParsed(null);
      setInput("");

      // Refresh the main event list in App.js
      if (refreshEvents) refreshEvents();
    } catch (err) {
      setMessage(err.response?.data?.error || "Booking failed");
      console.error(err);
    }
  };

  return (
    <div className="llm-booking">
      <label htmlFor="booking-input">Enter your booking request</label>
      <input
        id="booking-input"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='e.g., "Book 2 tickets for Clemson Music Fest 2025"'
        style={{ width: "100%", padding: "8px", margin: "8px 0" }}
      />
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={handleParse} disabled={parsing}>
          Parse Request
        </button>
        <button onClick={handleConfirmBooking} disabled={parsing || !parsed}>
          Confirm Booking
        </button>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
}

