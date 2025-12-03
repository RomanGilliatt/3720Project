import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function LLMBooking({ refreshEvents }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null); 
  const messagesEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);

  app.use(cors({
  origin: [
    'https://frontend-lac-one-73.vercel.app',
    'https://frontend-git-main-tiger-tix1.vercel.app',
    'https://frontend-4mj8x9uek-tiger-tix1.vercel.app'
  ],
  credentials: true
}));


  // --- Speech synthesis ---
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      const preferred = voices.find(v => v.lang.startsWith("en") && 
        (v.name.includes("Daniel") || v.name.includes("Samantha") || v.name.includes("Google"))
      ) || voices[0];
      setSelectedVoice(preferred);
    };
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = text => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.volume = speechVolume;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  // --- Speech recognition ---
  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) return;
    const recognitionInstance = new window.webkitSpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = "en-US";

    recognitionInstance.onstart = () => {
      setIsListening(true);
      playBeep();
    };

    recognitionInstance.onresult = e => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };

    recognitionInstance.onerror = e => {
      console.error("Speech recognition error:", e.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => setIsListening(false);

    setRecognition(recognitionInstance);
  }, []);

  const startListening = () => {
    if (recognition) recognition.start();
    else addMessage("system", "Speech recognition not supported in this browser.");
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  // --- Chat helper ---
  const addMessage = (type, text, data = null) => {
    setMessages(prev => [...prev, { type, text, data, timestamp: new Date() }]);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

// Send user message to LLM
const handleSendMessage = async (voiceInput = null) => {
  const text = input.trim() || voiceInput;
  if (!text) return;

  setIsProcessing(true);
  addMessage("user", text);
  setInput("");

  try {
    const res = await axios.post(`${process.env.REACT_APP_LLM_URL}/api/llm/parse`, { text });
    const { message, parsed } = res.data;

    // Extract tickets and event name from user text if missing
    let eventName = parsed?.event;
    let tickets = parsed?.tickets;

    // Try to parse missing pieces from text
    if (!eventName) {
      const eventMatch = text.match(/for\s+(.+)/i);
      if (eventMatch) eventName = eventMatch[1].trim();
    }

    if (!tickets) {
      const ticketMatch = text.match(/(\d+)\s*tickets?/i);
      if (ticketMatch) tickets = parseInt(ticketMatch[1], 10);
    }

    // If both event and tickets are present → propose booking
    if (eventName && tickets) {
      const eventsRes = await axios.get(`${process.env.REACT_APP_CLIENT_URL}/api/events`);
      const event = eventsRes.data.find(
        e => e.name.toLowerCase() === eventName.toLowerCase()
      );

      if (event) {
        const booking = {
          event: event.name,
          tickets,
        };
        setPendingBooking(booking);

        addMessage(
          "assistant",
          `Proposed booking: ${booking.tickets} ticket(s) for "${booking.event}". Click "Confirm Booking" to finalize.`
        );
      } else {
        addMessage("system", `Event "${eventName}" not found.`);
      }
    } else {
      // Only ask for missing info once
      if (!eventName && !tickets)
        addMessage("assistant", "Please provide the event name and number of tickets you'd like to book.");
      else if (!eventName)
        addMessage("assistant", "Please provide the event name.");
      else if (!tickets)
        addMessage("assistant", "Please provide the number of tickets you'd like to book.");
    }
  } catch (err) {
    console.error(err);
    addMessage("system", "Sorry, I couldn't process your request. Please try again.");
  } finally {
    setIsProcessing(false);
  }
};

// Confirm the pending booking by calling client service
const confirmBooking = async () => {
  if (!pendingBooking) return;
  setIsProcessing(true);

  try {
    const eventsRes = await axios.get(`${process.env.REACT_APP_CLIENT_URL}/api/events`);
    const event = eventsRes.data.find(
      e => e.name.toLowerCase() === pendingBooking.event.toLowerCase()
    );

    if (!event) {
      addMessage("system", `Event "${pendingBooking.event}" not found.`);
      setPendingBooking(null);
      return;
    }

    const purchaseRes = await axios.post(
      `${process.env.REACT_APP_CLIENT_URL}/${event.id}/purchase`,
      { tickets: pendingBooking.tickets }
    );

    const remainingTickets =
      purchaseRes.data.remaining_tickets ??
      event.tickets_available - pendingBooking.tickets;

    addMessage(
      "assistant",
      `Successfully booked ${pendingBooking.tickets} ticket(s) for "${event.name}". ${remainingTickets} tickets remaining.`
    );

    speak(purchaseRes.data.message || `Booking confirmed.`);

    if (refreshEvents) refreshEvents();
  } catch (err) {
    console.error(err);
    addMessage("system", "Failed to confirm booking.");
    speak("Failed to confirm booking.");
  } finally {
    setPendingBooking(null);
    setIsProcessing(false);
  }
};



  return (
    <div className="llm-booking">
      {/* Accessibility */}
      <div style={{ padding: 12, marginBottom: 16, background: "#f5f5f5", borderRadius: 4 }}>
        <h3>Accessibility Settings</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label>Voice: </label>
            <select
              value={selectedVoice?.name || ""}
              onChange={e => {
                const voice = availableVoices.find(v => v.name === e.target.value);
                setSelectedVoice(voice);
              }}
              style={{ width: "100%" }}
            >
              {availableVoices.map(v => (
                <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
              ))}
            </select>
          </div>
          <div>
            <label>Volume: {Math.round(speechVolume * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={e => setSpeechVolume(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ height: 400, overflowY: "auto", border: "1px solid #ccc", borderRadius: 4, padding: 16, marginBottom: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 12, textAlign: msg.type === "user" ? "right" : "left" }}>
            <div style={{
              display: "inline-block",
              backgroundColor: msg.type === "user" ? "#007bff" : msg.type === "system" ? "#dc3545" : "#28a745",
              color: "white",
              padding: "8px 12px",
              borderRadius: 12,
              maxWidth: "80%"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input & buttons */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          style={{ flex: 1, padding: 8 }}
          disabled={isProcessing}
        />
        <button onClick={handleSendMessage} disabled={isProcessing || !input.trim()} style={{ padding: "8px 16px" }}>Send</button>
        <button onClick={startListening} disabled={isListening || isProcessing} style={{
          padding: 8, borderRadius: "50%", width: 40, height: 40,
          backgroundColor: isListening ? "#ff4444" : "#4CAF50"
        }} />
        {isSpeaking && <button onClick={stopSpeaking} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: 4 }}>Stop Speech</button>}
        {pendingBooking && <button onClick={confirmBooking} disabled={isProcessing} style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: 4 }}>Confirm Booking</button>}
      </div>
    </div>
  );
}
