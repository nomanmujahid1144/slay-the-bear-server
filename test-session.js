// test-production-session.js
const axios = require('axios');

const TOKEN = 'ZNROE3XoPWGbMYck57W1GAe2VTg9';

async function testProductionStreaming() {
    console.log('🧪 Testing PRODUCTION streaming with sandbox token...\n');
    
    try {
        const response = await axios.post(
            'https://api.tradier.com/v1/markets/events/session',  // ✅ PRODUCTION
            {},
            {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Accept': 'application/json'
                }
            }
        );
        
        console.log('✅ SUCCESS! Production streaming works!');
        console.log('Status:', response.status);
        console.log('\nSession Data:');
        console.log(JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Production streaming failed:', error.response?.status, error.response?.statusText);
        console.log('Error:', error.response?.data);
    }
}

testProductionStreaming();