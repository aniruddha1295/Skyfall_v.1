// test-emulator-direct.js
// Direct test of Flow emulator REST API

import fetch from 'node-fetch';

async function testEmulatorDirect() {
  console.log('🧪 Testing Flow Emulator Direct Connection...\n');

  try {
    // Test 1: Get latest block
    console.log('1. Testing latest block...');
    const blockResponse = await fetch('http://127.0.0.1:8888/v1/blocks?height=latest');
    console.log('   Status:', blockResponse.status);
    
    if (blockResponse.ok) {
      const blockData = await blockResponse.json();
      console.log('   Block Height:', blockData[0]?.height || 'Unknown');
      console.log('   ✅ Emulator is running!');
    } else {
      console.log('   ❌ Failed to get block data');
      return;
    }

    // Test 2: Get account info
    console.log('\n2. Testing account info...');
    const accountResponse = await fetch('http://127.0.0.1:8888/v1/accounts/0xf8d6e0586b0a20c7');
    console.log('   Status:', accountResponse.status);
    
    if (accountResponse.ok) {
      const accountData = await accountResponse.json();
      console.log('   Address:', accountData.address);
      console.log('   Balance:', accountData.balance);
      console.log('   Contracts:', Object.keys(accountData.contracts || {}));
      
      if (accountData.contracts && Object.keys(accountData.contracts).length > 0) {
        console.log('   ✅ Contracts are deployed!');
        
        // Check for our specific contracts
        const hasSimpleWeatherOracle = 'SimpleWeatherOracle' in accountData.contracts;
        const hasSimpleWeatherDerivatives = 'SimpleWeatherDerivatives' in accountData.contracts;
        
        console.log('   SimpleWeatherOracle:', hasSimpleWeatherOracle ? '✅' : '❌');
        console.log('   SimpleWeatherDerivatives:', hasSimpleWeatherDerivatives ? '✅' : '❌');
      } else {
        console.log('   ❌ No contracts deployed');
      }
    } else {
      console.log('   ❌ Failed to get account data');
    }

    console.log('\n🎉 Direct emulator test complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmulatorDirect();
