const axios = require('axios');

const API_BASE_URL = 'http://localhost:8001/api';

async function testSuperAdmin() {
  try {
    console.log('Testing Super Admin login...');
    
    // Test login
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'superadmin@example.com',
      password: 'SuperAdmin123!'
    });
    
    console.log('Login successful!');
    console.log('Token:', loginResponse.data.access_token);
    console.log('User:', loginResponse.data.user);
    
    const token = loginResponse.data.access_token;
    
    // Test profile endpoint
    console.log('\nTesting profile endpoint...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Profile response:', profileResponse.data);
    
    // Test role info endpoint
    console.log('\nTesting role info endpoint...');
    const roleInfoResponse = await axios.get(`${API_BASE_URL}/auth/role-info`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Role info response:', roleInfoResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSuperAdmin();
