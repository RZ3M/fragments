const request = require('supertest');

const app = require('../../src/app');

describe('error 404', () => {
  test('requests for resourses that does not exist should show 404', () =>
    request(app).get('/nothinghere').expect(404));
});
