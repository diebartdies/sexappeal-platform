const axios = require('axios');
const FormData = require('form-data');

// Using localhost:5000 directly since we are testing internal API
// Nginx might require host headers or SSL which we want to avoid for simple tests
const API_URL = 'http://localhost:5000/api/v1';
let authToken = '';

async function runTests() {
  console.log('--- Starting SexAppeal Platform Automated Tests ---');

  try {
    // 1. Register a new professional
    console.log('\n[1] Testing Professional Registration...');
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      email: 'test_pro_auto@example.com',
      password: 'password123',
      role: 'professional',
      professionalProfile: {
        alias: 'AutoTreasure',
        quality: 'Standard',
        bio: 'Automated test profile.',
        location: { province: 'Buenos Aires', city: 'CABA', neighborhood: 'Palermo' },
        measurements: '90-60-90',
        height: '175cm',
        services: ['Massage', 'love alchemy']
      }
    });
    console.log('✓ Registration Successful:', regRes.data.message);

    // 2. Fetch verification code from DB (Simulated)
    console.log('\n[2] Retrieving Verification Code from Registration Response (Dev Mode)...');
    const code = regRes.data.verificationCode;
    console.log(`✓ Code retrieved: ${code}`);

    // 3. Verify Email
    console.log('\n[3] Testing Email Verification...');
    const verifyRes = await axios.post(`${API_URL}/auth/verify-email`, {
      email: 'test_pro_auto@example.com',
      code: code
    });
    console.log('✓ Verification Successful:', verifyRes.data.success);
    authToken = verifyRes.data.token;

    // 4. Login (Should work now)
    console.log('\n[4] Testing Login...');
    const loginEmail = 'test_pro_auto@example.com';
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: loginEmail,
      password: 'password123'
    });
    console.log(`✓ Login Successful. Logged in as: ${loginEmail}`);
    authToken = loginRes.data.token;

    // 5. Access Dashboard
    console.log('\n[5] Testing Professional Dashboard (Private)...');
    const dashRes = await axios.get(`${API_URL}/professionals/me`, {
      headers: { 'Cookie': `token=${authToken}` }
    });
    console.log('✓ Dashboard Data Received:', dashRes.data.data.professionalProfile.alias);
    console.log('  Status:', dashRes.data.data.verificationStatus);
    console.log('  Ready for Transactions:', dashRes.data.isReadyForTransactions);

    // 6. Update Profile
    console.log('\n[6] Testing Profile Update...');
    const form = new FormData();
    form.append('alias', 'AutoTreasure-Updated');
    form.append('bio', 'Updated bio for testing.');
    form.append('quality', 'Gold');
    form.append('services', 'Massage, Fantasies, love alchemy, Virtual Connection');
    form.append('whatsappNumber', '5491122334455');
    form.append('existingPhotos', '[]'); // No existing photos to keep/add for this test

    const updateRes = await axios.put(`${API_URL}/professionals/updateprofile`, form, {
      headers: { 
        ...form.getHeaders(),
        'Cookie': `token=${authToken}` 
      },
    });
    console.log('✓ Update Successful. New Alias:', updateRes.data.data.professionalProfile.alias);

    // 7. Verify Public Discovery
    // Professionals only show up if verified by admin.
    // Let's verify our user as admin first.
    console.log('\n[7] Simulating Admin Verification...');
    const userIdToVerify = dashRes.data.data._id;
    await axios.post(`${API_URL}/testing/verify-user`, { userId: userIdToVerify });
    console.log('✓ User force-verified via testing endpoint');

    console.log('\n[8] Testing Public Discovery...');
    const discoveryRes = await axios.get(`${API_URL}/professionals`);
    console.log('✓ Discovery Count:', discoveryRes.data.count);
    const found = discoveryRes.data.data.find(p => p.professionalProfile.alias === 'AutoTreasure-Updated');
    console.log('✓ User found in Public Feed:', !!found);

    // 9. Test specialty filter
    console.log('\n[9] Testing Public Discovery with Service Filter...');
    const filteredRes = await axios.get(`${API_URL}/professionals`, { params: { specialty: 'Fantasies' } });
    console.log('✓ Filtered Discovery Count:', filteredRes.data.count);
    if (filteredRes.data.count < 1) {
      throw new Error('Expected to find at least one professional with service "Fantasies"');
    }
    const foundFiltered = filteredRes.data.data.find(p => p.professionalProfile.alias === 'AutoTreasure-Updated');
    console.log('✓ User found in Filtered Feed:', !!foundFiltered);
    if (!foundFiltered) {
      throw new Error('Filtering by service "Fantasies" failed to return the correct user!');
    }

    // 10. Guest Login (18+ button simulation)
    console.log('\n[10] Testing Guest Login (18+ Button)...');
    const guestRes = await axios.post(`${API_URL}/auth/guest-login`, {});
    console.log('✓ Guest Login Successful. Token received:', !!guestRes.data.token);
    console.log('  Assigned Guest Name:', guestRes.data.user.name);

    console.log('\n--- All Tests Passed Successfully ---');

  } catch (err) {
    console.error('\n❌ Test Failed!');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Error:', err);
    }
    process.exit(1);
  }
}

runTests();
