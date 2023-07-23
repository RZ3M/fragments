const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments', () => {
  // If the request is missing the Authorization header, it should be forbidden
  test('unauthenticated requests are denied', () => request(app).get('/v1/fragments').expect(401));

  // If the wrong username/password pair are used (no such user), it should be forbidden
  test('incorrect credentials are denied', () =>
    request(app).get('/v1/fragments').auth('invalid@email.com', 'incorrect_password').expect(401));

  // Using a valid username/password pair should give a success result with a .fragments array
  test('authenticated users get a fragments array', async () => {
    const res = await request(app).get('/v1/fragments').auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  // TODO: we'll need to add tests to check the contents of the fragments array later

  test('invalid fragment ID for the GET request should give an appropriate error', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalidID')
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('Fragment invalidID not found');
  });

  test('successful conversion of html extension to text(.txt)', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('<h2> Html </h2>')
      .set('Content-type', 'text/html');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.txt`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('<h2> Html </h2>');
  });

  test('successful conversion of markdown(.md) extension to html', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('# This is a markdown type fragment')
      .set('Content-type', 'text/markdown');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(200);
    expect(res.text).toEqual('<h1>This is a markdown type fragment</h1>\n');
  });

  test('unsuccessful conversion of text/plain extension to the unsupported extension', async () => {
    const req = await request(app)
      .post('/v1/fragments/')
      .auth('user1@email.com', 'password1')
      .send('This is a text type fragment')
      .set('Content-type', 'text/plain');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}.html`)
      .auth('user1@email.com', 'password1');
    expect(res.statusCode).toBe(415);
  });

  test('Get all fragments list of unauthenticated user (get?expand=1)', async () => {
    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('unauthenticated@email.com', 'password1');
    expect(res.statusCode).toBe(401);
  });

  test('Get fragments metadata by valid user ID', async () => {
    const req = await request(app)
      .post('/v1/fragments')
      .send('This is a testing fragment')
      .set('Content-Type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(req.body).toEqual(res.body);
  });

  test('Get fragments metadata by invalid user ID', async () => {
    const req = await request(app)
      .post('/v1/fragments')
      .send('This is a fragment')
      .set('Content-Type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const res = await request(app)
      .get(`/v1/fragments/${req.body.fragment.id}abc/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
  });
});
