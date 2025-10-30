import React, { useEffect, useState } from 'react';
import './App.css';
import LLMBooking from "./LLMBooking";

/**
 * Main app component for displaying and managing Clemson events
 * 
 * @returns rendered component
 */
function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  /**
   * Fetches events from the client service
   * 
   * @returns void
   */
  const fetchEvents = () => {
    fetch('http://localhost:6001/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      });
  };

  /**
   * Processes ticket purchase for an event
   * 
   * @param eventId ID of the event to purchase ticket for
   * @param eventName name of event for success message
   * 
   * @returns void
   */
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
    <main className="App">
      <header>
        <h1>Clemson Campus Events</h1>
      </header>
      

      {message && (<section className="message success" aria-live="polite">{message}</section>)}
      {error && (<section className="message error" aria-live="assertive">{error}</section>)} 

      <ul className="events-list">
        {events.map((event) => (
          <li key={event.id}>
            <article className="event-card">
              <h2>{event.name}</h2>
              <p>Date: {new Date(event.date).toLocaleDateString()}</p>
              <p>Available Tickets: {event.tickets_available}</p>
            
              <button 
                onClick={() => buyTicket(event.id, event.name)}
                disabled={event.tickets_available <= 0}

              //Add accessibility label to button
              aria-label={
              event.tickets_available > 0
              ? `Buy ticket for ${event.name}`
              : `${event.name} is sold out`}
            >
              {event.tickets_available > 0 ? 'Buy Ticket' : 'Sold Out'}
            </button>
          </article>
        </li>
        ))}
      </ul>
      <div>
      <h1>TigerTix</h1>
      <LLMBooking />
      {/* other components */}
    </div>
  
    </main>
  );

}

export default App;