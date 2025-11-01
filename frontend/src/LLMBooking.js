import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LLMBooking({ refreshEvents }) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState(null);
  const [message, setMessage] = useState("");
  const [parsing, setParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognitionInstance = new window.webkitSpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onstart = () => {
        setIsListening(true);
        playBeep();
      };

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        // Automatically trigger parsing after voice input
        handleParse(transcript);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Function to play a beep sound
  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // Start voice recognition
  const startListening = () => {
    if (recognition) {
      recognition.start();
    } else {
      setMessage("Speech recognition is not supported in your browser.");
    }
  };

  // Step 1: Parse user input with LLM
  const handleParse = async (voiceInput = null) => {
    const textToProcess = voiceInput || input;
    if (!textToProcess.trim()) return;

    setParsing(true);
    setMessage("Parsing your request...");

    try {
      const res = await axios.post("http://localhost:7001/api/llm/parse", {
        text: textToProcess
      });

      setParsed(res.data);
      const responseMessage = `LLM parsed your request: Event="${res.data.event}", Tickets=${res.data.tickets}`;
      setMessage(responseMessage);
      speak(responseMessage); // Speak the response
    } catch (err) {
      console.error(err);
      const errorMessage = "Failed to parse request. Try again.";
      setMessage(errorMessage);
      speak(errorMessage);
      setParsed(null);
    } finally {
      setParsing(false);
    }
  };

  // Step 2: Confirm booking with backend
  const handleConfirmBooking = async () => {
    if (!parsed) {
      const message = "Parse your request first.";
      setMessage(message);
      speak(message);
      return;
    }

    try {
      const res = await axios.post("http://localhost:7001/api/llm/confirm", {
        event: parsed.event,
        tickets: parsed.tickets
      });

      setMessage(res.data.message);
      speak(res.data.message);
      setParsed(null);
      setInput("");

      if (refreshEvents) refreshEvents();
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Booking failed";
      setMessage(errorMessage);
      speak(errorMessage);
      console.error(err);
    }
  };

  // Function to speak text using Web Speech API
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="llm-booking">
      <label htmlFor="booking-input">Enter your booking request</label>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "8px 0" }}>
        <input
          id="booking-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='e.g., "Book 2 tickets for Clemson Music Fest 2025"'
          style={{ flex: 1, padding: "8px" }}
        />
        <button
          onClick={startListening}
          disabled={isListening}
          style={{
            padding: "8px",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isListening ? "#ff4444" : "#4CAF50"
          }}
          aria-label={isListening ? "Listening..." : "Start voice input"}
        >
          <span role="img" aria-hidden="true">🎤</span>
        </button>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => handleParse()} disabled={parsing}>
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

