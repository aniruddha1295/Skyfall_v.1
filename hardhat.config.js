import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

export default {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Flow EVM Testnet
    flowTestnet: {
      url: "https://testnet.evm.nodes.onflow.org",
      chainId: 545,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Flow EVM Mainnet  
    flowMainnet: {
      url: "https://mainnet.evm.nodes.onflow.org",
      chainId: 747,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gas: 2100000,
      gasPrice: 8000000000,
    },
    // Local Flow EVM for development
    flowLocal: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    // Flow EVM block explorers
    apiKey: {
      flowTestnet: "no-api-key-needed",
      flowMainnet: "no-api-key-needed"
    },
    customChains: [
      {
        network: "flowTestnet",
        chainId: 545,
        urls: {
          apiURL: "https://evm-testnet.flowscan.org/api",
          browserURL: "https://evm-testnet.flowscan.org"
        }
      },
      {
        network: "flowMainnet", 
        chainId: 747,
        urls: {
          apiURL: "https://evm.flowscan.org/api",
          browserURL: "https://evm.flowscan.org"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};