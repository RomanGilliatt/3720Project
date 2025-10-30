import React, { useState } from "react";
import axios from "axios";

export default function LLMBooking() {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [message, setMessage] = useState("");

  const handleParse = async () => {
    setMessage("Parsing your request...");
    try {
      const res = await axios.post("http://localhost:7001/api/llm/parse", {
        text: input
      });
      setParsed(res.data);
      setMessage(`LLM parsed your request: Event="${res.data.event}", Tickets=${res.data.tickets}`);
    } catch (err) {
      setMessage("Failed to parse request. Try again.");
      console.error(err);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setMessage("Booking your tickets...");
    try {
      const res = await axios.post("http://localhost:7001/api/llm/confirm", parsed);
      setMessage(res.data.message);
      setParsed(null);
      setInput("");
    } catch (err) {
      setMessage("Booking failed: " + err.response?.data?.error);
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "1rem", border: "1px solid #ccc", margin: "1rem 0" }}>
      <h3>LLM-Driven Ticket Booking</h3>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="e.g. Book 2 tickets for Jazz Night"
        style={{ width: "80%", marginRight: "0.5rem" }}
      />
      <button onClick={handleParse}>Parse Request</button>
      <button onClick={handleConfirm} disabled={!parsed}>Confirm Booking</button>
      <p>{message}</p>
    </div>
  );
}
