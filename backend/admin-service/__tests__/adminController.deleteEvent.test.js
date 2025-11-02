// Tests adminController.deleteEvent by mocking adminModel.run behavior
const pathToModel = '../models/adminModel';
const pathToController = '../controllers/adminController';

describe('Admin Controller - deleteEvent', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('deletes event successfully (this.changes > 0)', () => {
    jest.doMock(pathToModel, () => ({
      run: (sql, params, cb) => {
        cb.call({ changes: 1 });
      }
    }));

    const adminController = require(pathToController);

    const req = { params: { id: '1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    adminController.deleteEvent(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'Event deleted successfully' });
  });

  it('returns 404 when event not found (this.changes === 0)', () => {
    jest.doMock(pathToModel, () => ({
      run: (sql, params, cb) => {
        cb.call({ changes: 0 });
      }
    }));

    const adminController = require(pathToController);

    const req = { params: { id: 'nonexistent' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    adminController.deleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
  });

  it('returns 500 on DB error', () => {
    jest.doMock(pathToModel, () => ({
      run: (sql, params, cb) => {
        cb.call({}, new Error('DB error'));
      }
    }));

    const adminController = require(pathToController);

    const req = { params: { id: '1' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    adminController.deleteEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalled();
  });
});