// src/components/Login.js
import { useState, useEffect } from 'react';

export default function Login({ setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch('http://localhost:4000/login', {
        method: 'POST',
        credentials: 'include', // important for HTTP-only cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user); // update React state for logged-in user
        setMessage('Logged in successfully!');
        setEmail('');
        setPassword('');
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Server error, try again later.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-live="polite">
      <h2>Login</h2>

      <label htmlFor="email">Email:</label>
      <input
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <label htmlFor="password">Password:</label>
      <input
        id="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit">Login</button>

      {message && <p>{message}</p>}
    </form>
  );
}
