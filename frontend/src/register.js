// src/components/Register.js
import { useState } from 'react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await fetch(`${process.env.REACT_APP_AUTH_URL}/register`, {
        method: 'POST',
        credentials: 'include', // important for HTTP-only cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Registered successfully! You can now log in.');
        setEmail('');
        setPassword('');
      } else {
        setMessage(data.error || 'Registration failed');
      }
    } catch (err) {
      setMessage('Server error, try again later.');
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-live="polite">
      <h2>Register</h2>

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

      <button type="submit">Register</button>

      {message && <p>{message}</p>}
    </form>
  );
}
