const { getAllEvents, purchaseTicket } = require('../controllers/clientController');
const Event = require('../models/clientModel');

// Mock the Event model
jest.mock('../models/clientModel');

describe('Client Controller Tests', () => {
    let mockRequest;
    let mockResponse;
    let consoleErrorSpy;

    beforeEach(() => {
        mockRequest = {};
        mockResponse = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        // Spy on console.error to suppress output
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        // Restore console.error after each test
        consoleErrorSpy.mockRestore();
    });

    describe('getAllEvents()', () => {
        it('should return all events successfully', async () => {
            const mockEvents = [
                { id: 1, name: 'Event 1', date: '2025-12-01', tickets_available: 100 },
                { id: 2, name: 'Event 2', date: '2025-12-02', tickets_available: 50 }
            ];

            Event.getAll.mockResolvedValue(mockEvents);

            await getAllEvents(mockRequest, mockResponse);

            expect(mockResponse.json).toHaveBeenCalledWith(mockEvents);
        });

        it('should handle errors appropriately', async () => {
            const error = new Error('Database error');
            Event.getAll.mockRejectedValue(error);

            await getAllEvents(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });

    describe('purchaseTicket()', () => {
        it('should process ticket purchase successfully', async () => {
            const mockResult = {
                message: 'Ticket purchased successfully',
                remaining_tickets: 99
            };

            mockRequest.params = { id: '1' };
            Event.purchaseTicket.mockResolvedValue(mockResult);

            await purchaseTicket(mockRequest, mockResponse);

            expect(Event.purchaseTicket).toHaveBeenCalledWith(1);
            expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
        });

        it('should handle invalid event ID', async () => {
            mockRequest.params = { id: 'invalid' };

            await purchaseTicket(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid event ID' });
        });

        it('should handle event not found error', async () => {
            mockRequest.params = { id: '999' };
            Event.purchaseTicket.mockRejectedValue(new Error('Event not found'));

            await purchaseTicket(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Event not found' });
        });

        it('should handle no tickets available error', async () => {
            mockRequest.params = { id: '1' };
            Event.purchaseTicket.mockRejectedValue(new Error('No tickets available'));

            await purchaseTicket(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'No tickets available' });
        });

        it('should handle general errors', async () => {
            mockRequest.params = { id: '1' };
            Event.purchaseTicket.mockRejectedValue(new Error('Unknown error'));

            await purchaseTicket(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Internal server error' });
        });
    });
});