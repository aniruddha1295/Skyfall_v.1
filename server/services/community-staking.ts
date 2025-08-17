import { ethers } from 'ethers';

export interface StakingPool {
  poolId: string;
  name: string;
  stakingToken: 'FLOW' | 'FLR';
  rewardToken: 'FLOW' | 'FLR' | 'USDF';
  network: 'flow-evm' | 'flare-coston2';
  stakingTokenAddress: string;
  rewardTokenAddress: string;
  contractAddress: string;
  totalStaked: string;
  totalRewards: string;
  apy: number;
  lockPeriod: number; // in days
  minStakeAmount: string;
  userStaked?: string;
  userRewards?: string;
  userLockEndTime?: number;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  category: 'Weather Protection' | 'Yield Farming' | 'Governance' | 'Insurance';
  active: boolean;
}

export interface StakingTransaction {
  txId: string;
  type: 'stake' | 'unstake' | 'claim';
  poolId: string;
  amount: string;
  token: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  gasUsed?: string;
}

export interface UserStakingStats {
  totalStaked: string;
  totalRewards: string;
  activeStakes: number;
  totalValue: string; // in USD
  portfolioAPY: number;
}

class CommunityStakingService {
  private flowProvider: ethers.JsonRpcProvider;
  private flareProvider: ethers.JsonRpcProvider;
  private stakingPools: Map<string, StakingPool> = new Map();

  constructor() {
    this.flowProvider = new ethers.JsonRpcProvider(
      process.env.FLOW_EVM_RPC_URL || 'https://testnet.evm.nodes.onflow.org'
    );
    this.flareProvider = new ethers.JsonRpcProvider(
      process.env.FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/bc/C/rpc'
    );

    this.initializeStakingPools();
  }

  private initializeStakingPools() {
    // Flow EVM Staking Pools
    this.stakingPools.set('flow_weather_insurance', {
      poolId: 'flow_weather_insurance',
      name: 'Weather Insurance Pool',
      stakingToken: 'FLOW',
      rewardToken: 'USDF',
      network: 'flow-evm',
      stakingTokenAddress: '0x0000000000000000000000000000000000000000', // FLOW native
      rewardTokenAddress: '0x1234567890123456789012345678901234567890', // USDF
      contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
      totalStaked: '125000.0',
      totalRewards: '8750.0',
      apy: 12.5,
      lockPeriod: 30,
      minStakeAmount: '10.0',
      description: 'Stake FLOW tokens to provide community weather insurance coverage. Earn USDF rewards.',
      riskLevel: 'Low',
      category: 'Weather Protection',
      active: true
    });

    this.stakingPools.set('flow_governance_vault', {
      poolId: 'flow_governance_vault',
      name: 'Governance Vault',
      stakingToken: 'FLOW',
      rewardToken: 'FLOW',
      network: 'flow-evm',
      stakingTokenAddress: '0x0000000000000000000000000000000000000000',
      rewardTokenAddress: '0x0000000000000000000000000000000000000000',
      contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
      totalStaked: '89500.0',
      totalRewards: '4475.0',
      apy: 8.2,
      lockPeriod: 90,
      minStakeAmount: '25.0',
      description: 'Stake FLOW for voting rights and governance rewards. Longer lock for higher APY.',
      riskLevel: 'Low',
      category: 'Governance',
      active: true
    });

    // Flare Coston2 Staking Pools
    this.stakingPools.set('flr_wind_futures', {
      poolId: 'flr_wind_futures',
      name: 'Wind Futures Liquidity Pool',
      stakingToken: 'FLR',
      rewardToken: 'FLR',
      network: 'flare-coston2',
      stakingTokenAddress: '0x0000000000000000000000000000000000000000', // FLR native
      rewardTokenAddress: '0x0000000000000000000000000000000000000000',
      contractAddress: '0xfedcba0987654321fedcba0987654321fedcba09',
      totalStaked: '2340000.0',
      totalRewards: '187200.0',
      apy: 15.8,
      lockPeriod: 14,
      minStakeAmount: '100.0',
      description: 'Provide liquidity for wind futures trading. Higher risk, higher rewards.',
      riskLevel: 'Medium',
      category: 'Yield Farming',
      active: true
    });

    this.stakingPools.set('flr_insurance_mutual', {
      poolId: 'flr_insurance_mutual',
      name: 'Community Mutual Aid',
      stakingToken: 'FLR',
      rewardToken: 'FLR',
      network: 'flare-coston2',
      stakingTokenAddress: '0x0000000000000000000000000000000000000000',
      rewardTokenAddress: '0x0000000000000000000000000000000000000000',
      contractAddress: '0x567890abcdef567890abcdef567890abcdef5678',
      totalStaked: '456000.0',
      totalRewards: '22800.0',
      apy: 11.2,
      lockPeriod: 60,
      minStakeAmount: '50.0',
      description: 'Mutual aid pool for weather-related disasters. Community-driven payouts.',
      riskLevel: 'Medium',
      category: 'Insurance',
      active: true
    });
  }

  async getAllStakingPools(): Promise<StakingPool[]> {
    const pools = Array.from(this.stakingPools.values());
    
    // Simulate real-time updates
    for (const pool of pools) {
      await this.updatePoolMetrics(pool);
    }
    
    return pools.sort((a, b) => b.apy - a.apy);
  }

  async getStakingPool(poolId: string): Promise<StakingPool | null> {
    const pool = this.stakingPools.get(poolId);
    if (!pool) return null;
    
    await this.updatePoolMetrics(pool);
    return pool;
  }

  async getUserStakingPools(userId: string): Promise<StakingPool[]> {
    const allPools = await this.getAllStakingPools();
    
    // Simulate user stakes
    return allPools.map(pool => ({
      ...pool,
      userStaked: this.getUserStakeAmount(userId, pool.poolId),
      userRewards: this.getUserRewards(userId, pool.poolId),
      userLockEndTime: this.getUserLockEndTime(userId, pool.poolId)
    })).filter(pool => parseFloat(pool.userStaked || '0') > 0);
  }

  async stakeTokens(
    poolId: string, 
    amount: string, 
    userAddress: string
  ): Promise<StakingTransaction> {
    const pool = this.stakingPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const txId = `0x${Math.random().toString(16).substr(2, 64)}`;
    const timestamp = Date.now();

    // Simulate transaction based on network
    const transaction: StakingTransaction = {
      txId,
      type: 'stake',
      poolId,
      amount,
      token: pool.stakingToken,
      timestamp,
      status: 'pending',
      blockNumber: undefined,
      gasUsed: undefined
    };

    // Simulate network processing
    setTimeout(async () => {
      try {
        await this.processStakeTransaction(pool, amount, userAddress);
        transaction.status = 'confirmed';
        transaction.blockNumber = Math.floor(Math.random() * 1000000) + 5000000;
        transaction.gasUsed = (Math.random() * 0.01 + 0.005).toFixed(6);
      } catch (error) {
        transaction.status = 'failed';
        console.error('Staking transaction failed:', error);
      }
    }, Math.random() * 5000 + 2000); // 2-7 seconds

    return transaction;
  }

  async unstakeTokens(
    poolId: string, 
    amount: string, 
    userAddress: string
  ): Promise<StakingTransaction> {
    const pool = this.stakingPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const txId = `0x${Math.random().toString(16).substr(2, 64)}`;
    const timestamp = Date.now();

    const transaction: StakingTransaction = {
      txId,
      type: 'unstake',
      poolId,
      amount,
      token: pool.stakingToken,
      timestamp,
      status: 'pending'
    };

    // Simulate transaction processing
    setTimeout(async () => {
      try {
        await this.processUnstakeTransaction(pool, amount, userAddress);
        transaction.status = 'confirmed';
        transaction.blockNumber = Math.floor(Math.random() * 1000000) + 5000000;
        transaction.gasUsed = (Math.random() * 0.008 + 0.004).toFixed(6);
      } catch (error) {
        transaction.status = 'failed';
        console.error('Unstaking transaction failed:', error);
      }
    }, Math.random() * 4000 + 1500);

    return transaction;
  }

  async claimRewards(
    poolId: string, 
    userAddress: string
  ): Promise<StakingTransaction> {
    const pool = this.stakingPools.get(poolId);
    if (!pool) throw new Error('Pool not found');

    const rewardAmount = this.getUserRewards(userAddress, poolId);
    const txId = `0x${Math.random().toString(16).substr(2, 64)}`;

    const transaction: StakingTransaction = {
      txId,
      type: 'claim',
      poolId,
      amount: rewardAmount,
      token: pool.rewardToken,
      timestamp: Date.now(),
      status: 'pending'
    };

    // Simulate reward claim
    setTimeout(() => {
      transaction.status = 'confirmed';
      transaction.blockNumber = Math.floor(Math.random() * 1000000) + 5000000;
      transaction.gasUsed = (Math.random() * 0.005 + 0.002).toFixed(6);
    }, Math.random() * 3000 + 1000);

    return transaction;
  }

  async getUserStakingStats(userId: string): Promise<UserStakingStats> {
    const userPools = await this.getUserStakingPools(userId);
    
    const totalStaked = userPools.reduce((sum, pool) => 
      sum + parseFloat(pool.userStaked || '0'), 0
    );

    const totalRewards = userPools.reduce((sum, pool) => 
      sum + parseFloat(pool.userRewards || '0'), 0
    );

    const weightedAPY = userPools.reduce((sum, pool) => {
      const staked = parseFloat(pool.userStaked || '0');
      return sum + (pool.apy * staked);
    }, 0) / (totalStaked || 1);

    // Estimate USD value (mock conversion)
    const flowPrice = 0.3988; // From USDF pricing
    const flrPrice = 0.0285; // Mock FLR price
    
    const totalValue = userPools.reduce((sum, pool) => {
      const staked = parseFloat(pool.userStaked || '0');
      const price = pool.stakingToken === 'FLOW' ? flowPrice : flrPrice;
      return sum + (staked * price);
    }, 0);

    return {
      totalStaked: totalStaked.toFixed(2),
      totalRewards: totalRewards.toFixed(6),
      activeStakes: userPools.length,
      totalValue: totalValue.toFixed(2),
      portfolioAPY: weightedAPY
    };
  }

  private async updatePoolMetrics(pool: StakingPool): Promise<void> {
    // Simulate real-time pool updates
    const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
    pool.apy = Math.max(0, pool.apy * (1 + variation));
    
    // Update total staked with small variations
    const currentStaked = parseFloat(pool.totalStaked);
    const stakingVariation = (Math.random() - 0.5) * 0.005; // ±0.25% variation
    pool.totalStaked = (currentStaked * (1 + stakingVariation)).toFixed(2);
    
    // Update rewards
    const currentRewards = parseFloat(pool.totalRewards);
    const rewardGrowth = pool.apy / (365 * 24 * 60); // Per minute growth
    pool.totalRewards = (currentRewards + (currentStaked * rewardGrowth / 100)).toFixed(6);
  }

  private getUserStakeAmount(userId: string, poolId: string): string {
    // Simulate user stakes based on pool and user
    const hash = this.simpleHash(userId + poolId);
    const pools = ['flow_weather_insurance', 'flr_wind_futures', 'flow_governance_vault'];
    
    if (pools.includes(poolId) && hash % 3 === 0) {
      const baseAmount = poolId.includes('flow') ? 50 : 500;
      return (baseAmount + (hash % 1000)).toFixed(2);
    }
    return '0';
  }

  private getUserRewards(userId: string, poolId: string): string {
    const staked = parseFloat(this.getUserStakeAmount(userId, poolId));
    if (staked === 0) return '0';
    
    const pool = this.stakingPools.get(poolId);
    if (!pool) return '0';
    
    // Simulate accumulated rewards (assuming 30 days staking)
    const dailyReward = (staked * pool.apy / 100) / 365;
    const accumulatedRewards = dailyReward * 30;
    
    return accumulatedRewards.toFixed(6);
  }

  private getUserLockEndTime(userId: string, poolId: string): number {
    const staked = parseFloat(this.getUserStakeAmount(userId, poolId));
    if (staked === 0) return 0;
    
    const pool = this.stakingPools.get(poolId);
    if (!pool) return 0;
    
    // Simulate lock end time (random between now and lock period)
    const now = Date.now();
    const randomDays = Math.random() * pool.lockPeriod;
    return now + (randomDays * 24 * 60 * 60 * 1000);
  }

  private async processStakeTransaction(pool: StakingPool, amount: string, userAddress: string): Promise<void> {
    // Simulate blockchain interaction
    const currentStaked = parseFloat(pool.totalStaked);
    pool.totalStaked = (currentStaked + parseFloat(amount)).toFixed(2);
    
    console.log(`✅ Staked ${amount} ${pool.stakingToken} in ${pool.name} for ${userAddress}`);
  }

  private async processUnstakeTransaction(pool: StakingPool, amount: string, userAddress: string): Promise<void> {
    const currentStaked = parseFloat(pool.totalStaked);
    pool.totalStaked = Math.max(0, currentStaked - parseFloat(amount)).toFixed(2);
    
    console.log(`📤 Unstaked ${amount} ${pool.stakingToken} from ${pool.name} for ${userAddress}`);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  async getStakingAnalytics() {
    const pools = Array.from(this.stakingPools.values());
    
    const totalValueLocked = pools.reduce((sum, pool) => {
      const staked = parseFloat(pool.totalStaked);
      const price = pool.stakingToken === 'FLOW' ? 0.3988 : 0.0285;
      return sum + (staked * price);
    }, 0);

    const averageAPY = pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length;

    return {
      totalValueLocked: totalValueLocked.toFixed(2),
      totalPools: pools.length,
      activePools: pools.filter(p => p.active).length,
      averageAPY: averageAPY.toFixed(1),
      topPool: pools.sort((a, b) => b.apy - a.apy)[0],
      networkDistribution: {
        flow: pools.filter(p => p.network === 'flow-evm').length,
        flare: pools.filter(p => p.network === 'flare-coston2').length
      }
    };
  }
}

export const communityStakingService = new CommunityStakingService();