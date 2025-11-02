// Validates that createEvent uses the model's create when inputs valid
const mockCreate = jest.fn().mockResolvedValue({
  id: 42,
  name: 'LLM Show',
  date: '2025-12-01',
  tickets_available: 50
});

jest.mock('../models/adminModel', () => {
  return {
    create: mockCreate,
    run: jest.fn()
  };
});

const adminController = require('../controllers/adminController');

describe('Admin Controller - createEvent (LLM-style test)', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  it('calls Event.create when valid input provided', async () => {
    const req = { body: { name: 'LLM Show', date: '2025-12-01', tickets_available: '50' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adminController.createEvent(req, res);

    expect(mockCreate).toHaveBeenCalledWith({
      name: 'LLM Show',
      date: '2025-12-01',
      tickets_available: 50
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it('does not call Event.create when missing fields', async () => {
    const req = { body: { name: '', date: '', tickets_available: '' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await adminController.createEvent(req, res);

    expect(mockCreate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});