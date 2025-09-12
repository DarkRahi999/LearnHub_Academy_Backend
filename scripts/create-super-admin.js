const bcrypt = require('bcryptjs');

// Super Admin account details
const superAdminData = {
  email: 'superadmin@example.com',
  password: 'SuperAdmin123!',
  firstName: 'Super',
  lastName: 'Admin',
  phone: '01700000000',
  gender: 'male',
  role: 'super_admin',
  nationality: 'Bangladesh',
  religion: 'Islam',
  acceptTerms: true,
  avatarUrl: '/default-user.svg'
};

// Hash the password
const passwordHash = bcrypt.hashSync(superAdminData.password, 10);

console.log('Super Admin Account Details:');
console.log('Email:', superAdminData.email);
console.log('Password:', superAdminData.password);
console.log('Hashed Password:', passwordHash);
console.log('\nCopy this SQL query to your database:');
console.log(`
INSERT INTO users (email, phone, "firstName", "lastName", gender, role, nationality, religion, "acceptTerms", "avatarUrl", "passwordHash", "createdAt", "updatedAt") 
VALUES (
  '${superAdminData.email}',
  '${superAdminData.phone}',
  '${superAdminData.firstName}',
  '${superAdminData.lastName}',
  '${superAdminData.gender}',
  '${superAdminData.role}',
  '${superAdminData.nationality}',
  '${superAdminData.religion}',
  ${superAdminData.acceptTerms},
  '${superAdminData.avatarUrl}',
  '${passwordHash}',
  NOW(),
  NOW()
);
`);
