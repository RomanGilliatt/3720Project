import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';

afterEach(() => {
  jest.restoreAllMocks();
});

test('displays events fetched from API and allows successful purchase', async () => {
  const events = [
    { id: 1, name: 'Event A', date: '2025-11-10T00:00:00.000Z', tickets_available: 5 },
  ];

  // First call: fetch events. Second call: purchase endpoint.
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => events })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'purchased' }) });

  render(<App />);

  // Wait for event to appear
  await waitFor(() => expect(screen.getByText('Event A')).toBeInTheDocument());

  // Buy button should be enabled
  const buyBtn = screen.getByRole('button', { name: /Buy ticket for Event A/i });
  expect(buyBtn).toBeEnabled();

  // Click buy and expect success message
  fireEvent.click(buyBtn);

  await waitFor(() => expect(screen.getByText(/Successfully purchased ticket for: Event A/i)).toBeInTheDocument());
});

test('shows sold out and disables purchase button when tickets are 0', async () => {
  const events = [
    { id: 2, name: 'Sold Out Event', date: '2025-11-11T00:00:00.000Z', tickets_available: 0 },
  ];

  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => events });

  render(<App />);

  await waitFor(() => expect(screen.getByText('Sold Out Event')).toBeInTheDocument());

  const soldOutBtn = screen.getByRole('button', { name: /Sold Out Event is sold out/i });
  expect(soldOutBtn).toBeDisabled();
  expect(soldOutBtn).toHaveTextContent(/Sold Out/i);
});

test('displays error message when fetchEvents fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

  render(<App />);

  await waitFor(() => expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument());
});
