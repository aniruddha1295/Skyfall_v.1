# Chainlink Oracle Production Setup Guide

This guide explains how to configure your weather derivatives platform for production use with actual Chainlink Oracle contracts.

## Overview

The platform now includes a fully production-ready Chainlink Oracle integration that can connect to real oracle contracts, handle actual LINK payments, and provide verified weather data from multiple sources.

## Environment Variables Required

### Blockchain Configuration
```bash
# Primary Ethereum RPC endpoint (replace with your provider)
ETHEREUM_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
# Alternative: Use Chainlink node URL
CHAINLINK_NODE_URL=https://your-chainlink-node.example.com

# Your wallet private key for signing transactions
WALLET_PRIVATE_KEY=0x1234567890abcdef...

# Smart contract addresses (obtain from your deployment)
CHAINLINK_ORACLE_ADDRESS=0x514910771AF9Ca656af840dff83E8264EcF986CA
WEATHER_ORACLE_ADDRESS=0x1234567890123456789012345678901234567890
LINK_TOKEN_ADDRESS=0x514910771AF9Ca656af840dff83E8264EcF986CA
```

### Chainlink Job IDs
Obtain these from your Chainlink node operator:
```bash
# Weather data job IDs for different metrics
CHAINLINK_RAINFALL_JOB_ID=7da2702f37fd48e5b1b9a5715e3509b6
CHAINLINK_TEMPERATURE_JOB_ID=a8356f8d92034025aa4c03ac84b00123
CHAINLINK_HUMIDITY_JOB_ID=b9467c9e03145136bb5d14bd95c01234
CHAINLINK_PRESSURE_JOB_ID=c0578d0f14256247cc6e25ce06d02345
CHAINLINK_WIND_JOB_ID=d1689e1025367358dd7f36df17e03456
CHAINLINK_BULK_WEATHER_JOB_ID=e2790f2136478469ee8047ef28f04567
```

## Production Setup Steps

### 1. Deploy Smart Contracts

Deploy the following contracts to your target network:

#### Weather Oracle Contract
```solidity
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

contract WeatherOracle is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    
    // Contract implementation here
    // See /contracts/WeatherOracle.sol for full implementation
}
```

#### Chainlink Oracle Contract
Standard Chainlink oracle contract for external API calls.

### 2. Fund Your Wallet

Your wallet needs:
- **ETH**: For transaction gas fees (minimum 0.1 ETH recommended)
- **LINK**: For oracle payments (minimum 10 LINK tokens recommended)

### 3. Configure Chainlink Node

Work with a Chainlink node operator to:
- Set up job specifications for weather data
- Configure external adapters for weather APIs
- Obtain job IDs for each weather metric

### 4. Validate Setup

Use the built-in validation tools:

```typescript
// Check oracle setup
const validation = await chainlinkWeatherService.validateOracleSetup();
console.log('Setup valid:', validation.isValid);
console.log('Issues:', validation.issues);
console.log('Recommendations:', validation.recommendations);

// Check network status
const status = await chainlinkWeatherService.getOracleNetworkStatus();
console.log('Network:', status.networkName);
console.log('LINK Balance:', status.linkBalance);
console.log('ETH Balance:', status.ethBalance);

// Estimate costs
const costs = await chainlinkWeatherService.estimateOracleRequestCost(24);
console.log('Total cost for 24 data points:', costs.totalCostUsd, 'USD');
```

## Production Features

### Real-time Weather Data
- Direct integration with Chainlink oracle networks
- Multi-source aggregation with confidence scoring
- Blockchain-verified data integrity
- Automatic fallback to simulation if oracles unavailable

### Cost Management
- Oracle request cost estimation
- Batch processing for efficiency
- Automatic cleanup of old requests
- Gas optimization for transactions

### Monitoring & Diagnostics
- Network status monitoring
- Request tracking and status
- Oracle response time metrics
- Error handling and logging

### Advanced Features
- Bulk weather data requests across multiple stations
- Smart aggregation with outlier detection
- Confidence-weighted averaging
- Historical trend analysis

## API Endpoints

The following endpoints use the production Chainlink integration:

```bash
# Get current weather data
GET /api/weather/current/{stationId}

# Get rainfall trends
GET /api/weather/trend/{stationId}

# Get aggregated multi-source data
GET /api/weather/aggregated/{stationId}

# Oracle status and monitoring
GET /api/oracle/status
GET /api/oracle/validate
GET /api/oracle/costs?dataPoints=24
```

## Error Handling

The system gracefully handles:
- Oracle node downtime (falls back to simulation)
- Network connectivity issues
- Insufficient LINK balance warnings
- Transaction failures with retry logic

## Security Considerations

### Private Key Management
- Store `WALLET_PRIVATE_KEY` securely
- Use hardware wallets for production
- Consider multi-signature wallets for high-value operations

### Smart Contract Security
- Audit all deployed contracts
- Use verified Chainlink oracle contracts
- Implement proper access controls

### Rate Limiting
- Oracle requests are rate-limited to prevent abuse
- Batch requests where possible
- Monitor oracle usage costs

## Cost Optimization

### Typical Costs (Estimates)
- LINK cost per request: ~0.1 LINK ($1.50)
- Gas cost per transaction: ~0.003 ETH ($6.00)
- Total per weather data point: ~$7.50

### Optimization Strategies
- Use bulk requests for multiple data points
- Cache frequently requested data
- Implement smart polling based on market activity
- Use confidence-based request frequencies

## Troubleshooting

### Common Issues

1. **"WALLET_PRIVATE_KEY not found, using read-only mode"**
   - Set the WALLET_PRIVATE_KEY environment variable
   - Ensure the key is valid and funded

2. **"Contract verification failed"**
   - Verify RPC endpoint is correct
   - Check contract addresses are deployed
   - Ensure network connectivity

3. **"Oracle response timeout"**
   - Check Chainlink node status
   - Verify job IDs are correct
   - Increase timeout values if needed

4. **"Insufficient LINK balance"**
   - Fund wallet with LINK tokens
   - Check LINK token contract address

### Support

For production deployment support:
- Contact your Chainlink node operator
- Review Chainlink documentation
- Test on testnets before mainnet deployment

## Migration from Simulation

The system automatically falls back to simulation mode when:
- No wallet private key is configured
- Oracle contracts are unavailable
- Network connectivity issues occur

This ensures continuous operation during transition periods.