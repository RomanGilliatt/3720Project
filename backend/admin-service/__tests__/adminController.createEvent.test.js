// Tests adminController.createEvent using a mocked adminModel
jest.mock('../models/adminModel', () => {
  return {
    create: jest.fn().mockResolvedValue({
      id: 1,
      name: 'Concert',
      date: '2025-11-02',
      tickets_available: 100
    }),
    run: jest.fn()
  };
});

const adminController = require('../controllers/adminController');

describe('Admin Controller - createEvent', () => {
  it('creates event and returns 201 with created event', async () => {
    const req = { body: { name: 'Concert', date: '2025-11-02', tickets_available: '100' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await adminController.createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Event created successfully',
        event: expect.objectContaining({ name: 'Concert', date: '2025-11-02' })
      })
    );
  });

  it('returns 400 for invalid event name', async () => {
    const req = { body: { name: '', date: '2025-11-02', tickets_available: '10' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adminController.createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 400 for invalid date format', async () => {
    const req = { body: { name: 'Show', date: 'not-a-date', tickets_available: '5' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adminController.createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('returns 400 for invalid tickets_available', async () => {
    const req = { body: { name: 'Show', date: '2025-11-02', tickets_available: '-1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adminController.createEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });
});