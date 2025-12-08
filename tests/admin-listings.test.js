const request = require('supertest');

// Mock the db module used by server.js
jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn()
}));

const db = require('../db');

// Import the app AFTER mocking db
const app = require('../server');

describe('Admin listings endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /admin/listings?status=approved returns rows', async () => {
    const sample = [{ id: 1, title: 'A', status: 'approved' }];
    db.query.mockResolvedValueOnce({ rows: sample });

    const res = await request(app).get('/admin/listings?status=approved');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(sample);
    expect(db.query).toHaveBeenCalled();
  });

  test('GET /admin/listings/approved returns rows (fallback)', async () => {
    const sample = [{ id: 2, title: 'B', status: 'approved' }];
    db.query.mockResolvedValueOnce({ rows: sample });

    const res = await request(app).get('/admin/listings/approved');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(sample);
    expect(db.query).toHaveBeenCalled();
  });

  test('DELETE /admin/listings/:id without admin session returns 403', async () => {
    const res = await request(app).delete('/admin/listings/123');
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('error');
  });
});
