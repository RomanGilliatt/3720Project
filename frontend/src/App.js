import React, { useEffect, useState } from 'react';
import './App.css';
import LLMBooking from "./LLMBooking";
import Register from './register';
import Login from './login';

/**
 * Main app component for displaying and managing Clemson events
 */
function App() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null); // track logged-in user

  // Fetch events and current user on initial load
  useEffect(() => {
    fetchEvents();
    fetchCurrentUser();
  }, []);

  /**
   * Fetches events from the backend
   */
  const fetchEvents = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_CLIENT_URL}/api/events`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
      setTimeout(() => setError(null), 3000);
    }
  };

  /**
   * Fetches the currently logged-in user
   */
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_AUTH_URL}/me`, {
        credentials: 'include', // include HTTP-only JWT cookie
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
  };

  /**
   * Processes ticket purchase for an event
   * Requires user to be logged in
   */
  const buyTicket = async (eventId, eventName) => {
    if (!user) {
      setError('You must be logged in to buy tickets.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_CLIENT_URL}/api/events/${eventId}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Successfully purchased ticket for: ${eventName}`);
        fetchEvents();
      } else {
        setError(data.error || 'Failed to purchase ticket');
      }
    } catch (err) {
      console.error('Error purchasing ticket:', err);
      setError('Failed to purchase ticket. Please try again later.');
    }

    setTimeout(() => { setMessage(null); setError(null); }, 3000);
  };

  /**
   * Logs out the current user
   */
  const handleLogout = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_AUTH_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) setUser(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <main className="App">
      <header>
        <h1>Clemson Campus Events</h1>
      </header>

      {/* Show messages */}
      {message && (<section className="message success" aria-live="polite">{message}</section>)}
      {error && (<section className="message error" aria-live="assertive">{error}</section>)}

      {/* Authentication forms or logged-in user info */}
      {user ? (
        <div>
          <p>Logged in as {user.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="auth-forms">
          <Register />
          <Login setUser={setUser} />
        </div>
      )}

      {/* Event list */}
      <ul className="events-list">
        {events.map(event => (
          <li key={event.id}>
            <article className="event-card">
              <h2>{event.name}</h2>
              <p>Date: {new Date(event.date).toLocaleDateString()}</p>
              <p>Available Tickets: {event.tickets_available}</p>
              <button
                onClick={() => buyTicket(event.id, event.name)}
                disabled={event.tickets_available <= 0 || !user} // disable if sold out or not logged in
                aria-label={
                  !user
                    ? 'Login required to buy ticket'
                    : event.tickets_available > 0
                    ? `Buy ticket for ${event.name}`
                    : `${event.name} is sold out`
                }
              >
                {event.tickets_available <= 0
                  ? 'Sold Out'
                  : !user
                  ? 'Login to Buy'
                  : 'Buy Ticket'}
              </button>
            </article>
          </li>
        ))}
      </ul>

      {/* LLMBooking component */}
      <div>
        <h1>TigerTix</h1>
        <LLMBooking refreshEvents={fetchEvents} />
      </div>
    </main>
  );
}

export default App;
