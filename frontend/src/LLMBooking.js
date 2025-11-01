import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LLMBooking({ refreshEvents }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
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
        // Automatically send message after voice input
        handleSendMessage(transcript);
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
      addMessage("system", "Speech recognition is not supported in your browser.");
    }
  };

  const addMessage = (type, text, data = null) => {
    setMessages(prev => [...prev, { type, text, data, timestamp: new Date() }]);
  };

  const handleSendMessage = async (voiceInput = null) => {
    const textToSend = voiceInput || input;
    if (!textToSend.trim()) return;

    setIsProcessing(true);
    addMessage("user", textToSend);
    setInput("");

    try {
      const res = await axios.post("http://localhost:7001/api/llm/parse", {
        text: textToSend
      });

      addMessage("assistant", res.data.message, res.data.parsed);
      
      // If booking was successful, refresh the events list
      if (res.data.parsed?.success) {
        if (refreshEvents) {
          refreshEvents();
        }
      }

      // Speak the response if speech synthesis is available
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(res.data.message);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      addMessage("system", "Sorry, I couldn't process your request. Please try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="llm-booking">
      <div className="chat-messages" style={{
        height: "400px",
        overflowY: "auto",
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "16px",
        marginBottom: "16px"
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: "12px",
            textAlign: msg.type === "user" ? "right" : "left"
          }}>
            <div style={{
              display: "inline-block",
              backgroundColor: msg.type === "user" ? "#007bff" : msg.type === "system" ? "#dc3545" : "#28a745",
              color: "white",
              padding: "8px 12px",
              borderRadius: "12px",
              maxWidth: "80%"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "8px" }}
          disabled={isProcessing}
        />
        <button
          onClick={startListening}
          disabled={isListening || isProcessing}
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
        >
          <span role="img" aria-hidden="true">🎤</span>
        </button>
        <button
          onClick={() => handleSendMessage()}
          disabled={isProcessing || !input.trim()}
          style={{ padding: "8px 16px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

