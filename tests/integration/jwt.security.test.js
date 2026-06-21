const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { userOne, insertUsers } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');

setupTestDB();

describe('Sicurezza dei token JWT', () => {
  const protectedUrl = () => `/v1/users/${userOne._id}`;

  beforeEach(async () => {
    await insertUsers([userOne]);
  });

  test('accetta un access token valido sulla propria risorsa', async () => {
    await request(app).get(protectedUrl()).set('Authorization', `Bearer ${userOneAccessToken}`).expect(httpStatus.OK);
  });

  test('rifiuta un token con algoritmo none (non firmato)', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: userOne._id, type: 'access' })).toString('base64url');
    const forged = `${header}.${payload}.`;
    await request(app).get(protectedUrl()).set('Authorization', `Bearer ${forged}`).expect(httpStatus.UNAUTHORIZED);
  });

  test('rifiuta un token con payload manomesso', async () => {
    const parts = userOneAccessToken.split('.');
    const tampered = `${parts[0]}.${parts[1]}x.${parts[2]}`;
    await request(app).get(protectedUrl()).set('Authorization', `Bearer ${tampered}`).expect(httpStatus.UNAUTHORIZED);
  });
});
