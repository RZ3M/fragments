const request = require('supertest');
const app = require('../../src/app');

describe('GET /fragments/:id', () => {
  test('authenticated users fragment with valid id', async () => {
    const data = Buffer.from('fragment');
    const req = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(data);
    const id = req.body.fragment.id;
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(200);
    // expect(getRes).toBe(data.toString());
  });

  test('authenticated users get error with invalid id', async () => {
    const id = 10;
    const getRes = await request(app)
      .get(`/v1/fragments/${id}`)
      .auth('user1@email.com', 'password1');
    expect(getRes.statusCode).toBe(404);
  });
});
