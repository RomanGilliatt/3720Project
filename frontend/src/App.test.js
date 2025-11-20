import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import App from './App';

afterEach(() => {
  jest.restoreAllMocks();
});

test('displays events fetched from API and allows successful purchase', async () => {
  const events = [
    { id: 1, name: 'Event A', date: '2025-11-10T00:00:00.000Z', tickets_available: 5 },
  ];

  // Mock fetch to handle multiple calls: GET /api/events, GET /me, POST purchase
  const eventsState = events.map(e => ({ ...e }));
  global.fetch = jest.fn((url, opts) => {
    if (typeof url === 'string' && url.includes('/me')) {
      return Promise.resolve({ ok: true, json: async () => ({ user: { email: 'test@user.com' } }) });
    }

    // Purchase POST: decrement local state and return purchase response
    if (opts && opts.method && opts.method.toUpperCase() === 'POST') {
      eventsState[0].tickets_available = Math.max(0, eventsState[0].tickets_available - 1);
      return Promise.resolve({ ok: true, json: async () => ({ message: 'purchased' }) });
    }

    // Default: return current events state for GET /api/events
    return Promise.resolve({ ok: true, json: async () => eventsState });
  });

  render(<App />);

  // Wait for event to appear
  await waitFor(() => expect(screen.getByText('Event A')).toBeInTheDocument());

  // Buy button should be enabled
  const buyBtn = screen.getByRole('button', { name: /Buy ticket for Event A/i });
  expect(buyBtn).toBeEnabled();

  // Click buy and expect success message
  fireEvent.click(buyBtn);

  // Wait for the purchase POST to be attempted
  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/api/events/${events[0].id}/purchase`), expect.any(Object)));
});

test('shows sold out and disables purchase button when tickets are 0', async () => {
  const events = [
    { id: 2, name: 'Sold Out Event', date: '2025-11-11T00:00:00.000Z', tickets_available: 0 },
  ];

  global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: async () => events });

  render(<App />);

  await waitFor(() => expect(screen.getByText('Sold Out Event')).toBeInTheDocument());

  // Narrow the query to the specific event card to avoid matching the heading
  const eventHeading = screen.getByText('Sold Out Event');
  const eventCard = eventHeading.closest('article');
  const matches = within(eventCard).getAllByText(/Sold Out/i);
  const soldOutBtn = matches.find(node => node.tagName === 'BUTTON') || matches[0];
  expect(soldOutBtn).toBeDisabled();
  expect(soldOutBtn).toHaveTextContent(/Sold Out/i);
});

test('displays error message when fetchEvents fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));

  render(<App />);

  await waitFor(() => expect(screen.getByText(/Failed to load events/i)).toBeInTheDocument());
});
