const express = require('express');
const request = require('supertest');
const httpStatus = require('http-status');
const config = require('../../../src/config/config');
const { authLimiter } = require('../../../src/middlewares/rateLimiter');

describe('Rate limiter (anti brute-force)', () => {
  test('authLimiter blocca con 429 dopo i tentativi falliti consentiti', async () => {
    // In ambiente di test il limiter e' disattivato (skip): lo riattiviamo per verificarne la logica
    const envOriginale = config.env;
    config.env = 'development';
    const app = express();
    // Risponde 401 cosi' le richieste vengono conteggiate (skipSuccessfulRequests)
    app.use('/auth', authLimiter, (req, res) => res.status(httpStatus.UNAUTHORIZED).send());

    try {
      for (let i = 0; i < 20; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await request(app).get('/auth').expect(httpStatus.UNAUTHORIZED);
      }
      await request(app).get('/auth').expect(httpStatus.TOO_MANY_REQUESTS);
    } finally {
      config.env = envOriginale;
    }
  });
});
