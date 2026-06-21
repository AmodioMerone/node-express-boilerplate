const express = require('express');
const request = require('supertest');
const httpStatus = require('http-status');
const { authLimiter } = require('../../../src/middlewares/rateLimiter');

describe('Rate limiter (anti brute-force)', () => {
  test('authLimiter blocca con 429 dopo i tentativi falliti consentiti', async () => {
    const app = express();
    // Risponde 401 cosi' le richieste vengono conteggiate (skipSuccessfulRequests)
    app.use('/auth', authLimiter, (req, res) => res.status(httpStatus.UNAUTHORIZED).send());

    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(app).get('/auth').expect(httpStatus.UNAUTHORIZED);
    }
    await request(app).get('/auth').expect(httpStatus.TOO_MANY_REQUESTS);
  });
});
