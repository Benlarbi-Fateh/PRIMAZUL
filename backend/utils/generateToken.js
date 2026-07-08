const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  return jwt.sign({ userId, purpose: 'access' }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateRegistrationToken = (userId) => {
  return jwt.sign({ userId, purpose: 'registration' }, process.env.JWT_SECRET, {
    expiresIn: '30m',
  });
};

module.exports = generateToken;
module.exports.generateRegistrationToken = generateRegistrationToken;
