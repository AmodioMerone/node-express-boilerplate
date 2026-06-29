const request = require('supertest');
const faker = require('faker');
const httpStatus = require('http-status');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { User } = require('../../src/models');
const { userOne, insertUsers } = require('../fixtures/user.fixture');

setupTestDB();

describe('Sicurezza applicativa', () => {
  describe('Header di sicurezza HTTP', () => {
    test('imposta X-Content-Type-Options a nosniff', async () => {
      const res = await request(app).get('/v1/non-esistente');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('imposta X-Frame-Options contro il clickjacking', async () => {
      const res = await request(app).get('/v1/non-esistente');
      expect(res.headers['x-frame-options']).toBeDefined();
    });

    test('imposta Strict-Transport-Security', async () => {
      const res = await request(app).get('/v1/non-esistente');
      expect(res.headers['strict-transport-security']).toBeDefined();
    });

    test('non espone header X-Powered-By', async () => {
      const res = await request(app).get('/v1/non-esistente');
      expect(res.headers).not.toHaveProperty('x-powered-by');
    });
  });

  describe('CORS', () => {
    test('non consente tutte le origini (nessun wildcard)', async () => {
      const res = await request(app).get('/v1/non-esistente');
      expect(res.headers['access-control-allow-origin']).not.toBe('*');
    });
  });

  describe('Iniezione NoSQL', () => {
    test('gli operatori NoSQL nel login non autenticano', async () => {
      await insertUsers([userOne]);
      const payload = { email: { $gt: '' }, password: { $gt: '' } };
      const res = await request(app).post('/v1/auth/login').send(payload);
      expect(res.status).not.toBe(httpStatus.OK);
      expect(res.body).not.toHaveProperty('tokens');
    });
  });

  describe('Mass assignment', () => {
    test('la registrazione non consente di impostare il ruolo admin', async () => {
      const payload = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
        role: 'admin',
      };
      await request(app).post('/v1/auth/register').send(payload).expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('Enumerazione degli account', () => {
    test('email inesistente e password errata restituiscono lo stesso errore', async () => {
      await insertUsers([userOne]);
      const wrongEmail = await request(app)
        .post('/v1/auth/login')
        .send({ email: 'inesistente@example.com', password: 'password1' });
      const wrongPassword = await request(app)
        .post('/v1/auth/login')
        .send({ email: userOne.email, password: 'passwordErrata1' });
      expect(wrongEmail.status).toBe(httpStatus.UNAUTHORIZED);
      expect(wrongPassword.status).toBe(httpStatus.UNAUTHORIZED);
      expect(wrongEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('Gestione degli errori', () => {
    test('una rotta sconosciuta restituisce 404 senza stack trace', async () => {
      const res = await request(app).get('/v1/non-esistente').expect(httpStatus.NOT_FOUND);
      expect(res.body).not.toHaveProperty('stack');
    });
  });

  describe('Limite di dimensione del payload', () => {
    test('un body JSON oltre il limite consentito viene rifiutato con 413', async () => {
      const largePayload = { data: 'a'.repeat(50 * 1024) };
      await request(app).post('/v1/auth/register').send(largePayload).expect(httpStatus.REQUEST_ENTITY_TOO_LARGE);
    });
  });

  describe('Robustezza dell hashing delle password', () => {
    test('la password e salvata con un costo bcrypt di almeno 10', async () => {
      const newUser = {
        name: faker.name.findName(),
        email: faker.internet.email().toLowerCase(),
        password: 'password1',
      };
      const res = await request(app).post('/v1/auth/register').send(newUser).expect(httpStatus.CREATED);
      const dbUser = await User.findById(res.body.user.id);
      expect(dbUser.password).toMatch(/^\$2[aby]\$1\d\$/);
    });
  });
});
