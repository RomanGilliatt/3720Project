import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('http://localhost:6001/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      });
  };

  const buyTicket = async (eventId, eventName) => {
    try {
      const response = await fetch(`http://localhost:6001/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Successfully purchased ticket for: ${eventName}`);
        // Refresh events list to show updated ticket count
        fetchEvents();
      } else {
        setError(data.error || 'Failed to purchase ticket');
      }
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setError('Failed to purchase ticket. Please try again later.');
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 3000);
  };

  return (
    <div className="App">
      <h1>Clemson Campus Events</h1>
      
      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <div className="events-list">
        {events.map((event) => (
          <div key={event.id} className="event-card">
            <h2>{event.name}</h2>
            <p>Date: {new Date(event.date).toLocaleDateString()}</p>
            <p>Available Tickets: {event.tickets_available}</p>
            <button 
              onClick={() => buyTicket(event.id, event.name)}
              disabled={event.tickets_available <= 0}
            >
              {event.tickets_available > 0 ? 'Buy Ticket' : 'Sold Out'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;