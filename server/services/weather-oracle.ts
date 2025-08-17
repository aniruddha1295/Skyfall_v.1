import { ethers } from 'ethers';
import { weatherXMService } from './weatherxm';
import RainfallIndexABI from '../../contracts/abi/RainfallIndex.json';
import dotenv from 'dotenv';

dotenv.config();

// --- CONFIGURATION ---
const RAINFALL_INDEX_CONTRACT_ADDRESS = process.env.RAINFALL_INDEX_CONTRACT_ADDRESS || '';
const WEATHER_ORACLE_PRIVATE_KEY = process.env.WEATHER_ORACLE_PRIVATE_KEY || '';
const FLOW_EVM_RPC_URL = process.env.FLOW_EVM_RPC_URL || 'https://rpc.testnet.flow.com';

// The station ID to monitor
const STATION_ID = 'wxm_dallas_001';

class WeatherOracleService {
  private provider: ethers.JsonRpcProvider;
  private oracleWallet: ethers.Wallet;
  private rainfallIndexContract: ethers.Contract;

  constructor() {
    if (!RAINFALL_INDEX_CONTRACT_ADDRESS || !WEATHER_ORACLE_PRIVATE_KEY) {
      throw new Error('Missing required environment variables for WeatherOracleService.');
    }

    this.provider = new ethers.JsonRpcProvider(FLOW_EVM_RPC_URL);
    this.oracleWallet = new ethers.Wallet(WEATHER_ORACLE_PRIVATE_KEY, this.provider);
    this.rainfallIndexContract = new ethers.Contract(
      RAINFALL_INDEX_CONTRACT_ADDRESS,
      RainfallIndexABI.abi,
      this.oracleWallet
    );

    console.log(`Weather Oracle initialized for contract: ${RAINFALL_INDEX_CONTRACT_ADDRESS}`);
    console.log(`Oracle wallet address: ${this.oracleWallet.address}`);
  }

  /**
   * Fetches the latest rainfall data from WeatherXM and pushes it to the smart contract.
   */
  public async updateLatestRainfallData(): Promise<void> {
    console.log(`Fetching latest rainfall data for station: ${STATION_ID}`);

    try {
      const latestRainfall = await weatherXMService.getLatestRainfall(STATION_ID);

      if (latestRainfall === undefined) {
        console.log('No new rainfall data available.');
        return;
      }

      console.log(`Found latest rainfall: ${latestRainfall} mm. Submitting to the contract...`);

      // Convert rainfall to the format expected by the contract (e.g., with 6 decimals)
      const rainfallFormatted = ethers.parseUnits(latestRainfall.toFixed(6), 6);

      const tx = await this.rainfallIndexContract.updateRainfallData(
        STATION_ID,
        rainfallFormatted,
        'WeatherXM-Oracle-V1'
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block: ${receipt.blockNumber}`);
      console.log('Successfully updated rainfall data on-chain.');

    } catch (error) {
      console.error('Error updating rainfall data:', error);
    }
  }

  /**
   * Starts a polling mechanism to periodically update the rainfall data.
   * @param intervalMilliseconds The interval in milliseconds to poll for new data.
   */
  public startPolling(intervalMilliseconds: number = 3600000): void { // Default: 1 hour
    console.log(`Starting weather data polling every ${intervalMilliseconds / 1000} seconds.`);
    
    // Immediately run the first update
    this.updateLatestRainfallData();

    // Set up the interval
    setInterval(() => {
      this.updateLatestRainfallData();
    }, intervalMilliseconds);
  }
}

export const weatherOracleService = new WeatherOracleService();

// Example of how to run the service
// To run this oracle, you could have a script that does:
// import { weatherOracleService } from './weather-oracle';
// weatherOracleService.startPolling();
