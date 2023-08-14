const request = require('supertest');
const hash = require('../../src/hash');
const app = require('../../src/app');
const { readFragmentData } = require('../../src/model/data');

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () => request(app).put('/v1/fragments').expect(401));

  test('authenticated user successfully updates fragment data', async () => {
    const post = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const update = await request(app)
      .put(`/v1/fragments/${post.body.fragment.id}`)
      .send('this is an updated testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    expect(update.status).toBe(200);
    const fragment = await readFragmentData(hash('user1@email.com'), update.body.fragment.id);

    const req = await request(app)
      .get(`/v1/fragments/${update.body.fragment.id}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(req.body.toString()).toBe(fragment.toString());
  });

  test('fail to update due to different fragment types', async () => {
    const post = await request(app)
      .post('/v1/fragments')
      .send('this is a testing fragment')
      .set('Content-type', 'text/plain')
      .auth('user1@email.com', 'password1');

    const update = await request(app)
      .put(`/v1/fragments/${post.body.fragment.id}`)
      .send('this is a failed updated testing fragment')
      .set('Content-type', 'text/markdown')
      .auth('user1@email.com', 'password1');

    expect(update.status).toBe(400);

    const req = await request(app)
      .get(`/v1/fragments/${post.body.fragment.id}`)
      .auth('user1@email.com', 'password1')
      .responseType('blob');

    expect(req.body.toString()).toBe('this is a testing fragment');
  });

  test('fail to update a fragment data with invalid ID', async () => {
    const res = await request(app)
      .put('/v1/fragments/invalidID')
      .auth('user1@email.com', 'password1')
      .send('this is fragment 1 update')
      .set('Content-type', 'text/markdown');

    expect(res.status).toBe(404);
  });
});
