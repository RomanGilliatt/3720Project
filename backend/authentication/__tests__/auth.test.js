// Set JWT secret before requiring modules that read it
process.env.JWT_SECRET = 'test-secret';

jest.mock('../models/userModel'); // mock DB access

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');
const { authenticateToken } = require('../middleware/authMiddleware');

describe('Authentication: middleware and routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('authenticateToken should attach decoded user and call next with valid token', () => {
    const payload = { id: 1, email: 'a@b.com' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    const req = { cookies: { token } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.email).toBe(payload.email);
  });

  test('authenticateToken should return 401 when token missing', () => {
    const req = { cookies: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token, please log in' });
    expect(next).not.toHaveBeenCalled();
  });

  test('authenticateToken should return 401 when token invalid', () => {
    const req = { cookies: { token: 'bad-token' } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  describe('routes integration', () => {
    let app;

    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use(cookieParser());
      // mount auth routes (the module uses controllers which rely on mocked User)
      app.use('/', authRoutes);
    });

    test('POST /login should set cookie and return user when credentials valid', async () => {
      const password = 'secret123';
      const passwordHash = await bcrypt.hash(password, 8);

      // Mock findByEmail to return a user record with passwordHash
      User.findByEmail.mockResolvedValue({ id: 42, email: 'test@example.com', passwordHash });

      const res = await request(app)
        .post('/login')
        .send({ email: 'test@example.com', password })
        .expect(200);

      // Expect Set-Cookie header with token
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('test@example.com');
    });

    test('GET /me should return 401 without token and 200 with token', async () => {
      // without cookie
      await request(app).get('/me').expect(401);

      // create token and call with cookie
      const token = jwt.sign({ id: 7, email: 'me@x.com' }, process.env.JWT_SECRET);
      const res = await request(app).get('/me').set('Cookie', `token=${token}`).expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('me@x.com');
    });
  });
});
