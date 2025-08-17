import { ethers } from 'ethers';

interface FlareConfig {
  rpcUrl: string;
  chainId: number;
  contractAddress?: string;
  contractRegistry: string;
  explorerUrl: string;
}

interface WindFuture {
  contractId: string;
  trader: string;
  isLong: boolean;
  strikePrice: number; // Wind speed in mph
  notionalAmount: number; // USD
  collateralAmount: number;
  collateralToken: string;
  expiryTimestamp: number;
  isSettled: boolean;
  pnl: number;
  createdAt: number;
}

interface MarketData {
  currentWindSpeed: number; // mph
  flrUsdPrice: number;
  lastUpdate: number;
}

class FlareNetworkService {
  private provider: ethers.JsonRpcProvider;
  private config: FlareConfig;
  private contract?: ethers.Contract;

  // Flare Coston2 Testnet configuration
  private static readonly COSTON2_CONFIG: FlareConfig = {
    rpcUrl: 'https://coston2-api.flare.network/ext/C/rpc',
    chainId: 114,
    contractRegistry: '0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019', // Flare Contract Registry on Coston2
    explorerUrl: 'https://coston2.testnet.flarescan.com'
  };

  // Contract ABI for WindFutures contract
  private static readonly WIND_FUTURES_ABI = [
    "function createWindFuture(bool isLong, uint256 strikePrice, uint256 notionalAmount, address collateralToken, uint256 expiryDays) external",
    "function settleFuture(bytes32 contractId) external",
    "function updateMarketData() external",
    "function getUserPositions(address user) external view returns (bytes32[])",
    "function getContract(bytes32 contractId) external view returns (tuple(bytes32 contractId, address trader, bool isLong, uint256 strikePrice, uint256 notionalAmount, uint256 collateralAmount, address collateralToken, uint256 expiryTimestamp, bool isSettled, int256 pnl, uint256 createdAt))",
    "function getAllContracts() external view returns (bytes32[])",
    "function getMarketData() external view returns (tuple(uint256 currentWindSpeed, uint256 flrUsdPrice, uint256 lastUpdate))",
    "event FutureCreated(bytes32 indexed contractId, address indexed trader, bool isLong, uint256 strikePrice, uint256 notionalAmount, uint256 collateralAmount, address collateralToken, uint256 expiryTimestamp)",
    "event FutureSettled(bytes32 indexed contractId, address indexed trader, int256 pnl, uint256 windSpeedAtExpiry)",
    "event MarketDataUpdated(uint256 windSpeed, uint256 flrUsdPrice, uint256 timestamp)"
  ];

  constructor() {
    this.config = FlareNetworkService.COSTON2_CONFIG;
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
  }

  /**
   * Initialize the contract instance
   */
  public setContractAddress(address: string): void {
    this.config.contractAddress = address;
    this.contract = new ethers.Contract(
      address,
      FlareNetworkService.WIND_FUTURES_ABI,
      this.provider
    );
  }

  /**
   * Get current network information
   */
  public async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return {
        chainId: Number(network.chainId),
        networkName: 'Flare Coston2 Testnet',
        blockNumber,
        gasPrice: gasPrice.gasPrice?.toString(),
        maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
        explorerUrl: this.config.explorerUrl
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  }

  /**
   * Get current market data from the contract
   */
  public async getMarketData(): Promise<MarketData> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const marketData = await this.contract.getMarketData();
      
      return {
        currentWindSpeed: Number(marketData.currentWindSpeed) / 100, // Convert from contract format
        flrUsdPrice: Number(ethers.formatEther(marketData.flrUsdPrice)),
        lastUpdate: Number(marketData.lastUpdate)
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      // Return mock data for development
      return {
        currentWindSpeed: 7.5, // mph
        flrUsdPrice: 0.0398, // USD
        lastUpdate: Date.now() / 1000
      };
    }
  }

  /**
   * Get user's wind futures positions
   */
  public async getUserPositions(userAddress: string): Promise<WindFuture[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const contractIds = await this.contract.getUserPositions(userAddress);
      const positions: WindFuture[] = [];

      for (const contractId of contractIds) {
        const contractData = await this.contract.getContract(contractId);
        positions.push({
          contractId: contractData.contractId,
          trader: contractData.trader,
          isLong: contractData.isLong,
          strikePrice: Number(contractData.strikePrice) / 100, // Convert from contract format
          notionalAmount: Number(ethers.formatEther(contractData.notionalAmount)),
          collateralAmount: Number(ethers.formatEther(contractData.collateralAmount)),
          collateralToken: contractData.collateralToken,
          expiryTimestamp: Number(contractData.expiryTimestamp),
          isSettled: contractData.isSettled,
          pnl: Number(ethers.formatEther(contractData.pnl)),
          createdAt: Number(contractData.createdAt)
        });
      }

      return positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  /**
   * Get all wind futures contracts
   */
  public async getAllContracts(): Promise<WindFuture[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const contractIds = await this.contract.getAllContracts();
      const contracts: WindFuture[] = [];

      for (const contractId of contractIds) {
        const contractData = await this.contract.getContract(contractId);
        contracts.push({
          contractId: contractData.contractId,
          trader: contractData.trader,
          isLong: contractData.isLong,
          strikePrice: Number(contractData.strikePrice) / 100,
          notionalAmount: Number(ethers.formatEther(contractData.notionalAmount)),
          collateralAmount: Number(ethers.formatEther(contractData.collateralAmount)),
          collateralToken: contractData.collateralToken,
          expiryTimestamp: Number(contractData.expiryTimestamp),
          isSettled: contractData.isSettled,
          pnl: Number(ethers.formatEther(contractData.pnl)),
          createdAt: Number(contractData.createdAt)
        });
      }

      return contracts;
    } catch (error) {
      console.error('Error fetching all contracts:', error);
      return [];
    }
  }

  /**
   * Get available strike prices for wind futures
   */
  public getAvailableStrikes(): number[] {
    // Available wind speed strikes from 4 mph to 24 mph in 1 mph increments
    const strikes: number[] = [];
    for (let i = 4; i <= 24; i++) {
      strikes.push(i);
    }
    return strikes;
  }

  /**
   * Get available expiry periods
   */
  public getAvailableExpiries(): { days: number; label: string }[] {
    return [
      { days: 7, label: '1 Week' },
      { days: 14, label: '2 Weeks' },
      { days: 30, label: '1 Month' }
    ];
  }

  /**
   * Estimate gas cost for creating a wind future
   */
  public async estimateCreateFutureGas(
    isLong: boolean,
    strikePrice: number,
    notionalAmount: number,
    collateralToken: string,
    expiryDays: number
  ): Promise<string> {
    if (!this.contract) {
      return '0';
    }

    try {
      const strikePriceWei = Math.floor(strikePrice * 100); // Convert to contract format
      const notionalAmountWei = ethers.parseEther(notionalAmount.toString());
      
      const gasEstimate = await this.contract.createWindFuture.estimateGas(
        isLong,
        strikePriceWei,
        notionalAmountWei,
        collateralToken,
        expiryDays
      );

      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '300000'; // Default estimate
    }
  }

  /**
   * Get transaction by hash
   */
  public async getTransaction(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        transaction: tx,
        receipt: receipt,
        explorerUrl: `${this.config.explorerUrl}/tx/${txHash}`
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Listen for contract events
   */
  public setupEventListeners(callback: (event: any) => void): void {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    // Listen for FutureCreated events
    this.contract.on('FutureCreated', (contractId, trader, isLong, strikePrice, notionalAmount, collateralAmount, collateralToken, expiryTimestamp, event) => {
      callback({
        type: 'FutureCreated',
        contractId,
        trader,
        isLong,
        strikePrice: Number(strikePrice) / 100,
        notionalAmount: ethers.formatEther(notionalAmount),
        collateralAmount: ethers.formatEther(collateralAmount),
        collateralToken,
        expiryTimestamp: Number(expiryTimestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Listen for FutureSettled events
    this.contract.on('FutureSettled', (contractId, trader, pnl, windSpeedAtExpiry, event) => {
      callback({
        type: 'FutureSettled',
        contractId,
        trader,
        pnl: ethers.formatEther(pnl),
        windSpeedAtExpiry: Number(windSpeedAtExpiry) / 100,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });

    // Listen for MarketDataUpdated events
    this.contract.on('MarketDataUpdated', (windSpeed, flrUsdPrice, timestamp, event) => {
      callback({
        type: 'MarketDataUpdated',
        windSpeed: Number(windSpeed) / 100,
        flrUsdPrice: ethers.formatEther(flrUsdPrice),
        timestamp: Number(timestamp),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    });
  }

  /**
   * Get contract deployment information
   */
  public getDeploymentInfo() {
    return {
      network: 'Flare Coston2 Testnet',
      chainId: this.config.chainId,
      rpcUrl: this.config.rpcUrl,
      explorerUrl: this.config.explorerUrl,
      contractAddress: this.config.contractAddress,
      contractRegistry: this.config.contractRegistry
    };
  }
}

export default new FlareNetworkService();