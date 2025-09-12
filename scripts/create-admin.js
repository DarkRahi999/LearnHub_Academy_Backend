const bcrypt = require('bcryptjs');

// Admin account details
const adminData = {
  email: 'admin@example.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  phone: '01700000001',
  gender: 'male',
  role: 'admin',
  nationality: 'Bangladesh',
  religion: 'Islam',
  acceptTerms: true,
  avatarUrl: '/default-user.svg'
};

// Hash the password
const passwordHash = bcrypt.hashSync(adminData.password, 10);

console.log('Admin Account Details:');
console.log('Email:', adminData.email);
console.log('Password:', adminData.password);
console.log('Hashed Password:', passwordHash);
console.log('\nCopy this SQL query to your database:');
console.log(`
INSERT INTO users (email, phone, "firstName", "lastName", gender, role, nationality, religion, "acceptTerms", "avatarUrl", "passwordHash", "createdAt", "updatedAt") 
VALUES (
  '${adminData.email}',
  '${adminData.phone}',
  '${adminData.firstName}',
  '${adminData.lastName}',
  '${adminData.gender}',
  '${adminData.role}',
  '${adminData.nationality}',
  '${adminData.religion}',
  ${adminData.acceptTerms},
  '${adminData.avatarUrl}',
  '${passwordHash}',
  NOW(),
  NOW()
);
`);
