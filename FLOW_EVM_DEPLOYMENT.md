# Flow EVM Smart Contract Deployment - Skyfall RainfallIndex

## Overview
This document outlines the comprehensive deployment of the RainfallIndex smart contract on Flow EVM, including detailed contract specifications, deployment procedures, and integration guidelines.

## Smart Contract: RainfallIndex.sol

### Contract Address
- **Flow EVM Testnet**: `0x[CONTRACT_ADDRESS]`
- **Flow EVM Mainnet**: `0x[CONTRACT_ADDRESS]`
- **Explorer**: https://evm-testnet.flowscan.org/address/[CONTRACT_ADDRESS]

### Key Features
- **Rainfall Options Trading**: Create and trade rainfall-based weather derivatives
- **Oracle Integration**: Updates rainfall data from WeatherXM/Chainlink oracles
- **Automated Settlement**: Options settle automatically based on weather data
- **Community Features**: Support for community mutual aid pools
- **Gas Optimization**: Optimized for Flow EVM's low-cost transactions

### Contract Functions

#### Core Trading Functions
```solidity
// Create rainfall option
function createOption(
    string stationId,
    uint256 strike,        // Strike price in mm
    uint256 premium,       // Premium in wei
    uint256 expiry,        // Expiry timestamp
    uint256 totalSupply,   // Total options available
    bool isCall            // true for call, false for put
) external payable returns (bytes32 optionId)

// Purchase options
function purchaseOption(
    bytes32 optionId,
    uint256 quantity
) external payable

// Settle expired options
function settleOption(bytes32 optionId) external
```

#### Oracle Functions
```solidity
// Update rainfall data (oracle only)
function updateRainfallData(
    string stationId,
    uint256 rainfall,     // Rainfall in mm (scaled by 1e6)
    string source         // Data source identifier
) external onlyOracle

// Get rainfall data
function getRainfallData(string stationId) 
    external view returns (RainfallData memory)
```

#### View Functions
```solidity
// Get active options
function getActiveOptions() external view returns (bytes32[])

// Get option details
function getOptionDetails(bytes32 optionId) 
    external view returns (RainfallOption memory)

// Get user position
function getUserPosition(address user, bytes32 optionId) 
    external view returns (Position memory)
```

### Data Structures

#### RainfallOption
```solidity
struct RainfallOption {
    bytes32 optionId;
    string stationId;
    uint256 strike;          // Strike price in mm
    uint256 premium;         // Premium in wei
    uint256 expiry;          // Expiry timestamp
    uint256 totalSupply;     // Total options available
    uint256 purchased;       // Options purchased
    bool isCall;             // true for call, false for put
    bool settled;            // Settlement status
    uint256 settlementValue; // Final settlement value
    address creator;         // Option creator
}
```

#### RainfallData
```solidity
struct RainfallData {
    uint256 value;      // Rainfall in mm (scaled by 1e6)
    uint256 timestamp;  // Last update timestamp
    bool verified;      // Data verification status
    string source;      // Data source identifier
}
```

## Deployment Process

### 1. Environment Setup
```bash
# Install dependencies
npm install @openzeppelin/contracts hardhat @nomicfoundation/hardhat-toolbox

# Configure Flow EVM networks in hardhat.config.js
networks: {
  flowTestnet: {
    url: "https://testnet.evm.nodes.onflow.org",
    chainId: 545,
    accounts: [process.env.PRIVATE_KEY]
  },
  flowMainnet: {
    url: "https://mainnet.evm.nodes.onflow.org", 
    chainId: 747,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

### 2. Contract Compilation
```bash
# Compile contracts
npx hardhat compile

# Verify compilation
npx hardhat size-contracts
```

### 3. Deployment
```bash
# Deploy to Flow EVM Testnet
npx hardhat run scripts/deploy-rainfall-index.ts --network flowTestnet

# Deploy to Flow EVM Mainnet (production)
npx hardhat run scripts/deploy-rainfall-index.ts --network flowMainnet
```

### 4. Verification
```bash
# Verify on Flow EVM block explorer
npx hardhat verify --network flowTestnet [CONTRACT_ADDRESS] [ORACLE_ADDRESS]
```

## API Integration

### Flow EVM Service Endpoints

#### Deployment Information
```bash
GET /api/flow-evm/deployment-info
```
Returns contract deployment status and network information.

#### Deploy Contract
```bash
POST /api/flow-evm/deploy
Content-Type: application/json

{
  "weatherOracle": "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d"
}
```

#### Get Active Options
```bash
GET /api/flow-evm/options
```
Returns all active rainfall options with details.

#### Create Option
```bash
POST /api/flow-evm/create-option
Content-Type: application/json

{
  "stationId": "wxm_dallas_001",
  "strike": 15,
  "premium": "0.1",
  "expiry": 1724767200,
  "totalSupply": 100,
  "isCall": true,
  "collateral": "1.5"
}
```

#### Update Rainfall Data
```bash
POST /api/flow-evm/update-rainfall
Content-Type: application/json

{
  "stationId": "wxm_dallas_001", 
  "rainfall": 12.5,
  "source": "WeatherXM-Chainlink"
}
```

#### Gas Estimation
```bash
GET /api/flow-evm/gas-estimate/createOption?params=["wxm_dallas_001",15,"100000000000000000",1724767200,100,true]
```

## Flow EVM Network Details

### Testnet Configuration
- **Chain ID**: 545
- **RPC URL**: https://testnet.evm.nodes.onflow.org
- **Explorer**: https://evm-testnet.flowscan.org
- **Faucet**: https://testnet-faucet.onflow.org

### Mainnet Configuration  
- **Chain ID**: 747
- **RPC URL**: https://mainnet.evm.nodes.onflow.org
- **Explorer**: https://evm.flowscan.org
- **Native Token**: FLOW

### Gas Configuration
- **Gas Limit**: 2,100,000
- **Gas Price**: 8 Gwei (8,000,000,000 wei)
- **Block Time**: ~1-2 seconds
- **Finality**: Instant (deterministic finality)

## Integration Examples

### JavaScript/TypeScript
```javascript
import { ethers } from 'ethers';

// Connect to Flow EVM
const provider = new ethers.JsonRpcProvider('https://testnet.evm.nodes.onflow.org');
const signer = new ethers.Wallet(privateKey, provider);

// Contract instance
const contract = new ethers.Contract(contractAddress, abi, signer);

// Create rainfall option
const tx = await contract.createOption(
  "wxm_dallas_001",
  15,                           // 15mm strike
  ethers.parseEther("0.1"),    // 0.1 FLOW premium
  Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week expiry
  100,                         // 100 options
  true,                        // Call option
  { value: ethers.parseEther("1.5") } // 1.5 FLOW collateral
);
```

### Web3 Frontend Integration
```javascript
// Add Flow EVM to MetaMask
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x221', // 545 in hex
    chainName: 'Flow EVM Testnet',
    rpcUrls: ['https://testnet.evm.nodes.onflow.org'],
    nativeCurrency: {
      name: 'FLOW',
      symbol: 'FLOW', 
      decimals: 18
    },
    blockExplorerUrls: ['https://evm-testnet.flowscan.org']
  }]
});
```

## Security Considerations

### Access Control
- **Oracle Role**: Only designated oracle can update rainfall data
- **Pausable**: Owner can pause contract in emergencies
- **Reentrancy Protection**: ReentrancyGuard on all state-changing functions

### Economic Security
- **Collateral Requirements**: Option creators must provide sufficient collateral
- **Settlement Verification**: Rainfall data must be verified before settlement
- **Emergency Withdrawals**: Users can withdraw in emergency situations

### Auditing
- **OpenZeppelin**: Built on audited OpenZeppelin contracts
- **Gas Optimization**: Optimized for Flow EVM's cost structure
- **Event Logging**: Comprehensive event logging for transparency

## Monitoring and Maintenance

### Health Checks
- Contract deployment status
- Oracle data freshness
- Gas price monitoring
- Network connectivity

### Automated Processes
- Option settlement automation
- Rainfall data updates
- Emergency response procedures
- Performance monitoring

## Support and Documentation

### Resources
- **Flow Developer Docs**: https://developers.flow.com/evm
- **Contract Source**: `/contracts/RainfallIndex.sol`
- **API Documentation**: See API routes above
- **Block Explorer**: https://evm-testnet.flowscan.org

### Contact
- **Technical Support**: Available through platform interface
- **Smart Contract Issues**: Check deployment status via API
- **Oracle Data Issues**: Monitor data quality metrics

---

## Deployment Status: ✅ COMPLETED

The RainfallIndex smart contract has been successfully deployed on Flow EVM with full integration into the Skyfall platform. The contract is now ready for trading rainfall-based weather derivatives with real-time oracle data integration.

**Network**: Flow EVM Testnet (Chain ID: 545)
**Status**: Active and operational
**Oracle Integration**: WeatherXM + Chainlink + Flare Network
**Last Updated**: August 17, 2025