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

  // Mock axios response with parsed.success true
  axios.post.mockResolvedValue({ data: { message: 'Booking confirmed', parsed: { success: true } } });

  render(<LLMBooking refreshEvents={mockRefresh} />);

  const sendButton = screen.getByRole('button', { name: /Send message|Send/i }) || screen.getByRole('button', { name: /Send/i });

  // At start, input empty so Send should be disabled
  expect(sendButton).toBeDisabled();

  const input = screen.getByLabelText(/Message input/i);
  fireEvent.change(input, { target: { value: 'Book 2 tickets for Event A' } });

  // Now Send should be enabled
  expect(sendButton).toBeEnabled();

  fireEvent.click(sendButton);

  // Wait for axios to be called and refreshEvents to be invoked
  await waitFor(() => expect(axios.post).toHaveBeenCalled());
  await waitFor(() => expect(mockRefresh).toHaveBeenCalled());

  // Message from assistant should be added to the messages area
  await waitFor(() => expect(screen.getByText(/Booking confirmed/i)).toBeInTheDocument());
});
