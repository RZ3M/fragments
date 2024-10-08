const request = require('supertest');
const app = require('../../src/app');

const { readFragment } = require('../../src/model/data/memory');

describe('POST /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).post('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).post('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should succeed
  test('authenticated users post a fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
  });

  // non supportived content type should give error message
  test('authenticated users post a non-supportive fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'application/pdf')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
    expect(res.body.error.message).toBe('Unsupported data type.');
  });

  // expect all properties
  test('response contains all properties', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');
    const fragment = await readFragment(res.body.fragment.ownerId, res.body.fragment.id);
    expect(res.body.fragment).toEqual(fragment);
  });

  test('post plain text content-type with charset', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain; charset=utf-8')
      .auth('user1@email.com', 'password1');
    const fragment = await readFragment(res.body.fragment.ownerId, res.body.fragment.id);
    expect(res.body.fragment).toEqual(fragment);
    expect(res.statusCode).toBe(201);
  });
});
