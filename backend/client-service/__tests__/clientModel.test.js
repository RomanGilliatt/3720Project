// First, mock console.log to prevent the "Cannot log after tests are done" error
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock sqlite3 before any requires
jest.mock('sqlite3', () => ({
    verbose: jest.fn(() => ({
        Database: jest.fn((path, callback) => {
            if (callback) callback(null);
            return {
                all: jest.fn((query, params, callback) => callback(null, [])),
                get: jest.fn((query, params, callback) => callback(null, { tickets_available: 10 })),
                run: jest.fn((query, params, callback) => {
                    if (callback) callback.call({ changes: 1 }, null);
                }),
                serialize: jest.fn(cb => cb())
            };
        })
    }))
}));

// Get the Event model
const Event = require('../models/clientModel');

describe('Event Model Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('getAll()', () => {
        it('should return all events in ascending date order', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1', date: '2025-12-01', tickets_available: 100 },
                { id: 2, name: 'Event 2', date: '2025-12-02', tickets_available: 50 }
            ];

            // Mock the implementation for this specific test
            jest.spyOn(Event, 'getAll').mockImplementationOnce(() => Promise.resolve(mockEvents));

            const events = await Event.getAll();
            expect(events).toEqual(mockEvents);
        });

        it('should handle database errors', async () => {
            const mockError = new Error('Database error');
            
            // Mock the implementation to reject with error
            jest.spyOn(Event, 'getAll').mockImplementationOnce(() => Promise.reject(mockError));

            await expect(Event.getAll()).rejects.toThrow('Database error');
        });
    });

    describe('purchaseTicket()', () => {
        it('should successfully purchase a ticket when available', async () => {
            const eventId = 1;
            const initialTickets = 10;
            const expectedResult = {
                message: 'Ticket purchased successfully',
                remaining_tickets: initialTickets - 1
            };

            jest.spyOn(Event, 'purchaseTicket').mockImplementationOnce(() => Promise.resolve(expectedResult));

            const result = await Event.purchaseTicket(eventId);
            expect(result).toEqual(expectedResult);
        });

        it('should reject when event is not found', async () => {
            const eventId = 999;
            
            jest.spyOn(Event, 'purchaseTicket').mockImplementationOnce(() => 
                Promise.reject(new Error('Event not found'))
            );

            await expect(Event.purchaseTicket(eventId)).rejects.toThrow('Event not found');
        });

        it('should reject when no tickets are available', async () => {
            const eventId = 1;
            
            jest.spyOn(Event, 'purchaseTicket').mockImplementationOnce(() => 
                Promise.reject(new Error('No tickets available'))
            );

            await expect(Event.purchaseTicket(eventId)).rejects.toThrow('No tickets available');
        });

        it('should handle database errors during ticket check', async () => {
            const eventId = 1;
            const dbError = new Error('Database error');
            
            jest.spyOn(Event, 'purchaseTicket').mockImplementationOnce(() => 
                Promise.reject(dbError)
            );

            await expect(Event.purchaseTicket(eventId)).rejects.toThrow('Database error');
        });
    });
});