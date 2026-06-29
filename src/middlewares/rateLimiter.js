const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  // Disattivato durante i test automatici per non interferire con le suite
  skip: () => config.env === 'test',
});

module.exports = {
  authLimiter,
};
