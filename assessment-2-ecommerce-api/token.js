const jwt = require('jsonwebtoken');
require ('dotenv').config();

const adminToken = jwt.sign(
  { userId: 'admin1', role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const user1Token = jwt.sign(
  { userId: 'u1', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const user2Token = jwt.sign(
  { userId: 'u2', role: 'user' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('ADMIN:', adminToken);
console.log('USER1:', user1Token);
console.log('USER2:', user2Token);
