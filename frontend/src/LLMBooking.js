import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function LLMBooking({ refreshEvents }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize speech synthesis and voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      // Try to find and set a clear English voice as default
      const preferredVoice = voices.find(
        voice => 
          voice.lang.startsWith('en') && 
          (voice.name.includes('Daniel') || // Premium Windows voice
           voice.name.includes('Samantha') || // Premium macOS voice
           voice.name.includes('Google'))  // Clear Google voice
      ) || voices[0];
      setSelectedVoice(preferredVoice);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // Cancel any ongoing speech when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Enhanced speak function with SSML-like processing
  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Process text for better speech synthesis
    const processedText = text
      .replace(/{".*"}/, '') // Remove JSON
      .replace(/([.!?])\s+/g, '$1\n\n') // Add pauses after sentences
      .replace(/[:,]\s+/g, '$0\n') // Add slight pauses after colons and commas
      .trim();

    const utterance = new SpeechSynthesisUtterance(processedText);
    
    // Configure speech parameters
    utterance.voice = selectedVoice;
    utterance.volume = speechVolume;

    // Add event handlers
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Function to stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

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
      speak(res.data.message);
    } catch (err) {
      const errorMessage = "Sorry, I couldn't process your request. Please try again.";
      addMessage("system", errorMessage);
      speak(errorMessage);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="llm-booking">
      {/* Accessibility Controls */}
      <div className="accessibility-controls" style={{
        padding: "12px",
        marginBottom: "16px",
        background: "#f5f5f5",
        borderRadius: "4px"
      }}>
        <h3>Accessibility Settings</h3>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <label htmlFor="voice-select">Voice: </label>
            <select
              id="voice-select"
              value={selectedVoice?.name || ""}
              onChange={(e) => {
                const voice = availableVoices.find(v => v.name === e.target.value);
                setSelectedVoice(voice);
              }}
              style={{ width: "100%" }}
            >
              {availableVoices.map(voice => (
                <option key={voice.name} value={voice.name}>
                  {`${voice.name} (${voice.lang})`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="volume">Volume: {Math.round(speechVolume * 100)}%</label>
            <input
              type="range"
              id="volume"
              min="0"
              max="1"
              step="0.1"
              value={speechVolume}
              onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Controls */}
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          style={{ flex: 1, padding: "8px" }}
          disabled={isProcessing}
          aria-label="Message input"
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
          aria-label={isListening ? "Listening..." : "Start voice input"}
        >
          <span role="img" aria-hidden="true">🎤</span>
        </button>

        <button
          onClick={() => handleSendMessage()}
          disabled={isProcessing || !input.trim()}
          style={{ padding: "8px 16px" }}
          aria-label="Send message"
        >
          Send
        </button>

        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px"
            }}
            aria-label="Stop speaking"
          >
            Stop Speech
          </button>
        )}
      </div>
    </div>
  );
}

