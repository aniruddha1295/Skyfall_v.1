// test-flow-integration.js
// Simple test script to verify Flow Forte Actions integration

import fetch from 'node-fetch';

async function testFlowIntegration() {
  console.log('🧪 Testing Flow Forte Actions Integration...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Flow Health Check...');
    const healthResponse = await fetch('http://localhost:5000/api/flow-actions/health');
    const healthData = await healthResponse.json();
    
    console.log('   Status:', healthResponse.status);
    console.log('   Response:', JSON.stringify(healthData, null, 2));
    
    if (healthData.success && healthData.data.emulatorRunning) {
      console.log('   ✅ Flow emulator is running!');
    } else {
      console.log('   ❌ Flow emulator is not running');
      return;
    }

    // Test 2: Get Weather Stations
    console.log('\n2. Testing Weather Stations...');
    const stationsResponse = await fetch('http://localhost:5000/api/flow-actions/stations');
    const stationsData = await stationsResponse.json();
    
    console.log('   Status:', stationsResponse.status);
    console.log('   Stations:', stationsData.data?.stations || []);

    // Test 3: Create Weather Update Action
    console.log('\n3. Testing Weather Update Action...');
    const weatherUpdateResponse = await fetch('http://localhost:5000/api/flow-actions/weather-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationId: 'TEST_STATION_001',
        rainfall: 25.5,
        windSpeed: 15.2,
        temperature: 22.0,
        source: 'Test Script'
      })
    });
    
    const weatherUpdateData = await weatherUpdateResponse.json();
    console.log('   Status:', weatherUpdateResponse.status);
    console.log('   Response:', JSON.stringify(weatherUpdateData, null, 2));

    if (weatherUpdateData.success) {
      console.log('   ✅ Weather update action created successfully!');
      
      // Test 4: Get Weather Data
      console.log('\n4. Testing Weather Data Retrieval...');
      const weatherDataResponse = await fetch('http://localhost:5000/api/flow-actions/weather/TEST_STATION_001');
      const weatherData = await weatherDataResponse.json();
      
      console.log('   Status:', weatherDataResponse.status);
      console.log('   Weather Data:', JSON.stringify(weatherData, null, 2));
    } else {
      console.log('   ❌ Weather update action failed:', weatherUpdateData.error);
    }

    // Test 5: Create Weather Hedge Action
    console.log('\n5. Testing Weather Hedge Action...');
    const hedgeResponse = await fetch('http://localhost:5000/api/flow-actions/weather-hedge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stationId: 'TEST_STATION_001',
        optionType: 0, // Rainfall Call
        strike: 100.0,
        premium: 5.0,
        expiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalSupply: 100
      })
    });
    
    const hedgeData = await hedgeResponse.json();
    console.log('   Status:', hedgeResponse.status);
    console.log('   Response:', JSON.stringify(hedgeData, null, 2));

    if (hedgeData.success) {
      console.log('   ✅ Weather hedge action created successfully!');
      
      // Test 6: Get Active Options
      console.log('\n6. Testing Active Options...');
      const optionsResponse = await fetch('http://localhost:5000/api/flow-actions/options');
      const optionsData = await optionsResponse.json();
      
      console.log('   Status:', optionsResponse.status);
      console.log('   Active Options:', optionsData.data?.count || 0);
    } else {
      console.log('   ❌ Weather hedge action failed:', hedgeData.error);
    }

    console.log('\n🎉 Flow Forte Actions Integration Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFlowIntegration();
