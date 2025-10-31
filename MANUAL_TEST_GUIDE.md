# Manual Testing Guide - Flow Forte Actions

## 🧪 **Test 1: Health Check (Verify Real Connection)**

**Request:**
```
GET http://localhost:5000/api/flow-actions/health
```

**Expected Response (REAL blockchain):**
```json
{
  "success": true,
  "data": {
    "emulatorRunning": true,
    "contractsDeployed": true,
    "blockHeight": 5  // Should be > 0
  },
  "message": "Flow emulator is running and contracts are deployed"
}
```

**❌ Mock Response (fake):**
```json
{
  "success": false,
  "data": {
    "emulatorRunning": false,
    "contractsDeployed": false,
    "blockHeight": 0
  }
}
```

---

## 🧪 **Test 2: Create Weather Action (Real Blockchain Transaction)**

**Request:**
```
POST http://localhost:5000/api/flow-actions/weather-update
Content-Type: application/json

{
  "stationId": "REAL_TEST_001",
  "rainfall": 25.5,
  "windSpeed": 15.2,
  "temperature": 22.0,
  "source": "Manual_Test"
}
```

**Expected Response (REAL blockchain):**
```json
{
  "success": true,
  "data": {
    "actionId": "weather_REAL_TEST_001_1698765432",
    "transactionId": "a1b2c3d4e5f6789...",  // 64-character hex string
    "stationId": "REAL_TEST_001",
    "timestamp": "2025-10-29T00:00:00.000Z"
  },
  "message": "Weather update Forte Action executed successfully"
}
```

**🔍 Key Indicators of REAL blockchain:**
- ✅ `transactionId` exists and is 64+ characters
- ✅ `success: true`
- ✅ Response takes 2-5 seconds (blockchain processing time)

**❌ Mock Response (fake):**
```json
{
  "success": false,
  "error": "Flow emulator not running"
}
```

---

## 🧪 **Test 3: Verify Data Stored on Blockchain**

**Request:**
```
GET http://localhost:5000/api/flow-actions/weather/REAL_TEST_001
```

**Expected Response (REAL blockchain):**
```json
{
  "success": true,
  "data": {
    "stationId": "REAL_TEST_001",
    "rainfall": 25.5,
    "windSpeed": 15.2,
    "temperature": 22.0,
    "timestamp": "2025-10-29T00:00:00.000Z",
    "source": "Manual_Test"
  },
  "message": "Weather data retrieved from Flow blockchain"
}
```

**🔍 Key Indicators of REAL blockchain:**
- ✅ Data matches exactly what you stored
- ✅ Has blockchain timestamp
- ✅ Retrieved from actual contract storage

---

## 🧪 **Test 4: Create Weather Hedge (Derivatives Contract)**

**Request:**
```
POST http://localhost:5000/api/flow-actions/weather-hedge
Content-Type: application/json

{
  "stationId": "REAL_TEST_001",
  "optionType": 0,
  "strike": 100.0,
  "premium": 5.0,
  "expiry": 1730160000000,
  "totalSupply": 10
}
```

**Expected Response (REAL blockchain):**
```json
{
  "success": true,
  "data": {
    "actionId": "hedge_REAL_TEST_001_1698765432",
    "transactionId": "x9y8z7w6v5u4321...",  // Another real TX ID
    "optionDetails": {
      "stationId": "REAL_TEST_001",
      "optionType": 0,
      "strike": 100,
      "premium": 5,
      "expiry": 1730160000000,
      "totalSupply": 10
    }
  },
  "message": "Weather hedge Forte Action executed successfully"
}
```

---

## 🧪 **Test 5: Verify Options on Blockchain**

**Request:**
```
GET http://localhost:5000/api/flow-actions/options
```

**Expected Response (REAL blockchain):**
```json
{
  "success": true,
  "data": {
    "options": [
      {
        "optionId": "option_123456789",
        "stationId": "REAL_TEST_001",
        "optionType": 0,
        "optionTypeName": "RainfallCall",
        "strike": 100,
        "premium": 5,
        "expiry": "2025-10-29T00:00:00.000Z",
        "totalSupply": 10,
        "creator": "0xf8d6e0586b0a20c7",
        "createdDate": "2025-10-29T00:00:00.000Z"
      }
    ],
    "count": 1
  },
  "message": "Retrieved 1 active weather options"
}
```

---

## 🔍 **How to Verify It's REAL (Not Mock)**

### **✅ Signs of REAL Blockchain Integration:**

1. **Transaction IDs**: 64-character hex strings (e.g., `a1b2c3d4e5f6...`)
2. **Processing Time**: 2-5 seconds per request (blockchain is slower than mock)
3. **Data Persistence**: Data you store can be retrieved later
4. **Block Height**: Increases with each transaction
5. **Contract Address**: References real deployed contracts (`0xf8d6e0586b0a20c7`)

### **❌ Signs of Mock/Fake Integration:**

1. **No Transaction IDs**: Missing or fake IDs
2. **Instant Responses**: < 1 second (too fast for blockchain)
3. **No Data Persistence**: Can't retrieve stored data
4. **Static Block Height**: Always 0 or same number
5. **Generic Errors**: "Not implemented" or placeholder messages

---

## 🚀 **Advanced Verification: Direct Flow CLI**

**Test the contracts directly with Flow CLI:**

```bash
# 1. Check if data is really stored
flow scripts execute cadence/scripts/test_contract.cdc --network emulator

# 2. Check account state
flow accounts get 0xf8d6e0586b0a20c7 --network emulator

# 3. Check latest block (should increase after transactions)
flow blocks get latest --network emulator
```

---

## 📊 **Performance Benchmarks**

**Real Blockchain vs Mock:**

| Operation | Real Blockchain | Mock Response |
|-----------|----------------|---------------|
| Health Check | 500-1000ms | < 100ms |
| Weather Update | 2000-5000ms | < 200ms |
| Data Retrieval | 1000-2000ms | < 100ms |
| Hedge Creation | 3000-6000ms | < 200ms |

**If your responses are taking 2+ seconds, that's GOOD - it means real blockchain!**

---

## 🎯 **Success Criteria**

**Your integration is REAL if:**
- ✅ All 8 Postman tests pass
- ✅ Transaction IDs are generated
- ✅ Data persists between requests
- ✅ Block height increases
- ✅ Responses take 2+ seconds
- ✅ Flow CLI shows contract activity

**Your integration is MOCK if:**
- ❌ No transaction IDs
- ❌ Instant responses
- ❌ Data doesn't persist
- ❌ Block height stays 0
- ❌ Generic error messages
