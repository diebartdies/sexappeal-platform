const axios = require('axios');

async function testConnections() {
    console.log('===================================================');
    console.log('🔍 SexAppeal - API Connection Tester');
    console.log('===================================================\n');
    
    // 1. Test Local API
    try {
        console.log('Testing Localhost (http://localhost:5000/api/v1/professionals)...');
        const localRes = await axios.get('http://localhost:5000/api/v1/professionals', { timeout: 5000 });
        console.log(`✅ LOCAL SUCCESS: Connected! Retrieved ${localRes.data.count || 0} professionals.\n`);
    } catch (err) {
        console.log(`❌ LOCAL FAILED: Could not connect to localhost. (Make sure you ran 'node dev.js')\n`);
    }

    // 2. Test Production API
    try {
        console.log('Testing Production (https://sexappeal.drsrv.net.ar/api/v1/professionals)...');
        const prodRes = await axios.get('https://sexappeal.drsrv.net.ar/api/v1/professionals', { timeout: 5000 });
        console.log(`✅ PRODUCTION SUCCESS: Connected! Retrieved ${prodRes.data.count || 0} professionals.\n`);
    } catch (err) {
        console.log(`❌ PRODUCTION FAILED: Could not connect to the remote server. (${err.message})\n`);
    }
}

testConnections();