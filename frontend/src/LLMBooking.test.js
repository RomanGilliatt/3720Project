import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import LLMBooking from './LLMBooking';

jest.mock('axios');

beforeEach(() => {
  // Mock speechSynthesis so tests don't attempt real audio
  const mockSpeechSynthesis = {
    getVoices: jest.fn().mockReturnValue([]),
    speak: jest.fn(),
    cancel: jest.fn(),
    onvoiceschanged: null,
  };
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    writable: true,
    value: mockSpeechSynthesis,
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('send button disabled when input empty and enabled when typing; sends message and calls refreshEvents on success', async () => {
  const mockRefresh = jest.fn();

  // Arrange: parse response proposes a booking; GET and purchase are mocked
  axios.post.mockImplementation((url, body) => {
    if (url && url.includes('/api/llm/parse')) {
      return Promise.resolve({ data: { message: 'Proposed booking', parsed: { event: 'Event A', tickets: 2 } } });
    }
    if (url && url.includes('/purchase')) {
      return Promise.resolve({ data: { message: 'purchased', remaining_tickets: 3 } });
    }
    return Promise.resolve({ data: {} });
  });

  axios.get.mockResolvedValue({ data: [ { id: 1, name: 'Event A', tickets_available: 5 } ] });

  render(<LLMBooking refreshEvents={mockRefresh} />);

  const sendButton = screen.getByRole('button', { name: /Send/i });

  // At start, input empty so send should be disabled
  expect(sendButton).toBeDisabled();

  const input = screen.getByPlaceholderText(/Type your message.../i);
  fireEvent.change(input, { target: { value: 'Book 2 tickets for Event A' } });

  // Now send should be enabled
  expect(sendButton).toBeEnabled();

  // Click send to trigger parse -> proposed booking
  fireEvent.click(sendButton);

  // Wait for assistant to propose a booking
  await waitFor(() => expect(screen.getByText(/Proposed booking/i)).toBeInTheDocument());

  // Confirm booking button should appear
  const confirmBtn = await screen.findByRole('button', { name: /Confirm Booking/i });
  fireEvent.click(confirmBtn);

  // Wait for purchase and refreshEvents
  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());
});
