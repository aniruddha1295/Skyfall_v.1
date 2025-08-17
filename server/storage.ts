import { 
  users, weatherStations, weatherData, optionContracts, userPositions, 
  communityPools, poolMemberships, governanceProposals, governanceVotes, 
  payoutHistory, aiInteractions, automatedTradingRules, automatedTradingExecutions,
  type User, type InsertUser, type WeatherStation, type InsertWeatherStation,
  type WeatherData, type InsertWeatherData, type OptionContract, type InsertOptionContract,
  type UserPosition, type CommunityPool, type InsertCommunityPool,
  type PoolMembership, type InsertPoolMembership, type GovernanceProposal,
  type InsertGovernanceProposal, type GovernanceVote, type PayoutHistory,
  type AiInteraction, type InsertAiInteraction,
  type AutomatedTradingRule, type InsertAutomatedTradingRule,
  type AutomatedTradingExecution, type InsertAutomatedTradingExecution
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Weather station operations
  getWeatherStations(): Promise<WeatherStation[]>;
  getWeatherStationsByCity(city: string, state: string): Promise<WeatherStation[]>;
  createWeatherStation(station: InsertWeatherStation): Promise<WeatherStation>;
  
  // Weather data operations
  getWeatherData(stationId: string, limit?: number): Promise<WeatherData[]>;
  getWeatherDataByDateRange(stationId: string, startDate: Date, endDate: Date): Promise<WeatherData[]>;
  createWeatherData(data: InsertWeatherData): Promise<WeatherData>;
  
  // Option contract operations
  getOptionContracts(underlying?: string): Promise<OptionContract[]>;
  getOptionContract(contractId: string): Promise<OptionContract | undefined>;
  createOptionContract(contract: InsertOptionContract): Promise<OptionContract>;
  updateOptionContract(contractId: string, updates: Partial<OptionContract>): Promise<OptionContract>;
  
  // User position operations
  getUserPositions(userId: number): Promise<UserPosition[]>;
  createUserPosition(position: Omit<UserPosition, 'id' | 'createdAt'>): Promise<UserPosition>;
  
  // Community pool operations
  getCommunityPools(): Promise<CommunityPool[]>;
  getCommunityPool(poolId: string): Promise<CommunityPool | undefined>;
  createCommunityPool(pool: InsertCommunityPool): Promise<CommunityPool>;
  updateCommunityPool(poolId: string, updates: Partial<CommunityPool>): Promise<CommunityPool>;
  
  // Pool membership operations
  getPoolMemberships(poolId: string): Promise<PoolMembership[]>;
  getUserPoolMemberships(userId: number): Promise<PoolMembership[]>;
  createPoolMembership(membership: InsertPoolMembership): Promise<PoolMembership>;
  
  // Governance operations
  getGovernanceProposals(poolId: string): Promise<GovernanceProposal[]>;
  getGovernanceProposal(proposalId: string): Promise<GovernanceProposal | undefined>;
  createGovernanceProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal>;
  updateGovernanceProposal(proposalId: string, updates: Partial<GovernanceProposal>): Promise<GovernanceProposal>;
  
  // Governance vote operations
  getGovernanceVotes(proposalId: string): Promise<GovernanceVote[]>;
  createGovernanceVote(vote: Omit<GovernanceVote, 'id' | 'createdAt'>): Promise<GovernanceVote>;
  
  // Payout history operations
  getPayoutHistory(poolId?: string, contractId?: string): Promise<PayoutHistory[]>;
  createPayoutHistory(payout: Omit<PayoutHistory, 'id' | 'createdAt'>): Promise<PayoutHistory>;
  
  // AI interaction operations
  getAiInteractions(userId: number, sessionId?: string): Promise<AiInteraction[]>;
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  
  // Automated trading operations
  getAutomatedTradingRules(userId?: number): Promise<AutomatedTradingRule[]>;
  getUserAutomatedTradingRules(userId: number): Promise<AutomatedTradingRule[]>;
  getActiveAutomatedTradingRules(): Promise<AutomatedTradingRule[]>;
  getAutomatedTradingRule(ruleId: string): Promise<AutomatedTradingRule | undefined>;
  createAutomatedTradingRule(rule: InsertAutomatedTradingRule): Promise<AutomatedTradingRule>;
  updateAutomatedTradingRule(ruleId: string, updates: Partial<AutomatedTradingRule>): Promise<AutomatedTradingRule>;
  deleteAutomatedTradingRule(ruleId: string): Promise<void>;
  
  // Automated trading execution operations
  getAutomatedTradingExecutions(ruleId?: string): Promise<AutomatedTradingExecution[]>;
  getAutomatedTradingExecutionsByDateRange(ruleId: string, startDate: Date, endDate: Date): Promise<AutomatedTradingExecution[]>;
  createAutomatedTradingExecution(execution: InsertAutomatedTradingExecution): Promise<AutomatedTradingExecution>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private weatherStations: Map<string, WeatherStation> = new Map();
  private weatherData: Map<string, WeatherData[]> = new Map();
  private optionContracts: Map<string, OptionContract> = new Map();
  private userPositions: Map<number, UserPosition[]> = new Map();
  private communityPools: Map<string, CommunityPool> = new Map();
  private poolMemberships: Map<string, PoolMembership[]> = new Map();
  private governanceProposals: Map<string, GovernanceProposal[]> = new Map();
  private governanceVotes: Map<string, GovernanceVote[]> = new Map();
  private payoutHistory: PayoutHistory[] = [];
  private aiInteractions: Map<number, AiInteraction[]> = new Map();
  private automatedTradingRules: Map<string, AutomatedTradingRule> = new Map();
  private automatedTradingExecutions: Map<string, AutomatedTradingExecution[]> = new Map();
  
  private currentId: number = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize weather stations
    const stations = [
      { stationId: "wxm_dallas_001", city: "Dallas", state: "TX", country: "US", latitude: "32.7767", longitude: "-96.7970", active: true },
      { stationId: "wxm_houston_001", city: "Houston", state: "TX", country: "US", latitude: "29.7604", longitude: "-95.3698", active: true },
      { stationId: "wxm_austin_001", city: "Austin", state: "TX", country: "US", latitude: "30.2672", longitude: "-97.7431", active: true },
    ];
    
    stations.forEach(station => {
      const stationWithId = { ...station, id: this.currentId++ };
      this.weatherStations.set(station.stationId, stationWithId);
    });

    // Initialize community pools
    const pools = [
      {
        poolId: "dallas_drought_relief",
        name: "Dallas Drought Relief",
        description: "Agricultural mutual aid pool for drought protection",
        underlying: "Dallas_TX_Rainfall",
        triggerCondition: "Rainfall < 10mm for 7 consecutive days",
        totalValueLocked: "45000.00",
        memberCount: 127,
        nextPayoutDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        payoutMultiplier: "1.57",
        isActive: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        poolId: "texas_flood_protection",
        name: "Texas Flood Protection",
        description: "Emergency response fund for flood events",
        underlying: "Texas_Regional_Rainfall",
        triggerCondition: "Rainfall > 50mm in 24 hours",
        totalValueLocked: "89000.00",
        memberCount: 203,
        nextPayoutDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        payoutMultiplier: "1.42",
        isActive: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
      }
    ];

    pools.forEach(pool => {
      const poolWithId = { ...pool, id: this.currentId++ };
      this.communityPools.set(pool.poolId, poolWithId);
    });

    // Initialize option contracts
    const contracts = [
      {
        contractId: "dallas_rain_call_15mm_jan31",
        underlying: "Dallas_TX_Rainfall",
        contractType: "call",
        strikePrice: "15.00",
        premium: "1.85",
        expiryDate: new Date("2025-01-31"),
        totalSupply: 1000,
        availableSupply: 847,
        Greeks: { delta: 0.55, gamma: 0.12, theta: -0.08, vega: 0.23 },
        isSettled: false,
        createdAt: new Date()
      },
      {
        contractId: "dallas_rain_put_15mm_jan31",
        underlying: "Dallas_TX_Rainfall",
        contractType: "put",
        strikePrice: "15.00",
        premium: "1.25",
        expiryDate: new Date("2025-01-31"),
        totalSupply: 1000,
        availableSupply: 892,
        Greeks: { delta: -0.45, gamma: 0.12, theta: -0.06, vega: 0.23 },
        isSettled: false,
        createdAt: new Date()
      }
    ];

    contracts.forEach(contract => {
      const contractWithId = { ...contract, id: this.currentId++ };
      this.optionContracts.set(contract.contractId, contractWithId);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async getWeatherStations(): Promise<WeatherStation[]> {
    return Array.from(this.weatherStations.values());
  }

  async getWeatherStationsByCity(city: string, state: string): Promise<WeatherStation[]> {
    return Array.from(this.weatherStations.values()).filter(
      station => station.city.toLowerCase() === city.toLowerCase() && 
                station.state.toLowerCase() === state.toLowerCase()
    );
  }

  async createWeatherStation(station: InsertWeatherStation): Promise<WeatherStation> {
    const id = this.currentId++;
    const stationWithId: WeatherStation = { ...station, id, active: true };
    this.weatherStations.set(station.stationId, stationWithId);
    return stationWithId;
  }

  async getWeatherData(stationId: string, limit = 100): Promise<WeatherData[]> {
    const data = this.weatherData.get(stationId) || [];
    return data.slice(-limit);
  }

  async getWeatherDataByDateRange(stationId: string, startDate: Date, endDate: Date): Promise<WeatherData[]> {
    const data = this.weatherData.get(stationId) || [];
    return data.filter(d => d.timestamp >= startDate && d.timestamp <= endDate);
  }

  async createWeatherData(data: InsertWeatherData): Promise<WeatherData> {
    const id = this.currentId++;
    const weatherDataWithId: WeatherData = { 
      ...data, 
      id, 
      verified: true
    };
    
    const existingData = this.weatherData.get(data.stationId) || [];
    existingData.push(weatherDataWithId);
    this.weatherData.set(data.stationId, existingData);
    
    return weatherDataWithId;
  }

  async getOptionContracts(underlying?: string): Promise<OptionContract[]> {
    const contracts = Array.from(this.optionContracts.values());
    return underlying ? contracts.filter(c => c.underlying === underlying) : contracts;
  }

  async getOptionContract(contractId: string): Promise<OptionContract | undefined> {
    return this.optionContracts.get(contractId);
  }

  async createOptionContract(contract: InsertOptionContract): Promise<OptionContract> {
    const id = this.currentId++;
    const contractWithId: OptionContract = { 
      ...contract, 
      id, 
      isSettled: false,
      createdAt: new Date()
    };
    this.optionContracts.set(contract.contractId, contractWithId);
    return contractWithId;
  }

  async updateOptionContract(contractId: string, updates: Partial<OptionContract>): Promise<OptionContract> {
    const contract = this.optionContracts.get(contractId);
    if (!contract) throw new Error("Contract not found");
    
    const updatedContract = { ...contract, ...updates };
    this.optionContracts.set(contractId, updatedContract);
    return updatedContract;
  }

  async getUserPositions(userId: number): Promise<UserPosition[]> {
    return this.userPositions.get(userId) || [];
  }

  async createUserPosition(position: Omit<UserPosition, 'id' | 'createdAt'>): Promise<UserPosition> {
    const id = this.currentId++;
    const positionWithId: UserPosition = { 
      ...position, 
      id, 
      createdAt: new Date()
    };
    
    const existingPositions = this.userPositions.get(position.userId) || [];
    existingPositions.push(positionWithId);
    this.userPositions.set(position.userId, existingPositions);
    
    return positionWithId;
  }

  async getCommunityPools(): Promise<CommunityPool[]> {
    return Array.from(this.communityPools.values());
  }

  async getCommunityPool(poolId: string): Promise<CommunityPool | undefined> {
    return this.communityPools.get(poolId);
  }

  async createCommunityPool(pool: InsertCommunityPool): Promise<CommunityPool> {
    const id = this.currentId++;
    const poolWithId: CommunityPool = { 
      ...pool, 
      id, 
      totalValueLocked: "0",
      memberCount: 0,
      isActive: true,
      createdAt: new Date()
    };
    this.communityPools.set(pool.poolId, poolWithId);
    return poolWithId;
  }

  async updateCommunityPool(poolId: string, updates: Partial<CommunityPool>): Promise<CommunityPool> {
    const pool = this.communityPools.get(poolId);
    if (!pool) throw new Error("Pool not found");
    
    const updatedPool = { ...pool, ...updates };
    this.communityPools.set(poolId, updatedPool);
    return updatedPool;
  }

  async getPoolMemberships(poolId: string): Promise<PoolMembership[]> {
    return this.poolMemberships.get(poolId) || [];
  }

  async getUserPoolMemberships(userId: number): Promise<PoolMembership[]> {
    const allMemberships = Array.from(this.poolMemberships.values()).flat();
    return allMemberships.filter(m => m.userId === userId);
  }

  async createPoolMembership(membership: InsertPoolMembership): Promise<PoolMembership> {
    const id = this.currentId++;
    const membershipWithId: PoolMembership = { 
      ...membership, 
      id, 
      isEligible: true,
      joinedAt: new Date()
    };
    
    const existingMemberships = this.poolMemberships.get(membership.poolId) || [];
    existingMemberships.push(membershipWithId);
    this.poolMemberships.set(membership.poolId, existingMemberships);
    
    return membershipWithId;
  }

  async getGovernanceProposals(poolId: string): Promise<GovernanceProposal[]> {
    return this.governanceProposals.get(poolId) || [];
  }

  async getGovernanceProposal(proposalId: string): Promise<GovernanceProposal | undefined> {
    const allProposals = Array.from(this.governanceProposals.values()).flat();
    return allProposals.find(p => p.proposalId === proposalId);
  }

  async createGovernanceProposal(proposal: InsertGovernanceProposal): Promise<GovernanceProposal> {
    const id = this.currentId++;
    const proposalWithId: GovernanceProposal = { 
      ...proposal, 
      id, 
      votesFor: 0,
      votesAgainst: 0,
      totalVotes: 0,
      status: "active",
      createdAt: new Date()
    };
    
    const existingProposals = this.governanceProposals.get(proposal.poolId) || [];
    existingProposals.push(proposalWithId);
    this.governanceProposals.set(proposal.poolId, existingProposals);
    
    return proposalWithId;
  }

  async updateGovernanceProposal(proposalId: string, updates: Partial<GovernanceProposal>): Promise<GovernanceProposal> {
    const allProposals = Array.from(this.governanceProposals.values()).flat();
    const proposal = allProposals.find(p => p.proposalId === proposalId);
    if (!proposal) throw new Error("Proposal not found");
    
    const updatedProposal = { ...proposal, ...updates };
    const poolProposals = this.governanceProposals.get(proposal.poolId) || [];
    const index = poolProposals.findIndex(p => p.proposalId === proposalId);
    poolProposals[index] = updatedProposal;
    this.governanceProposals.set(proposal.poolId, poolProposals);
    
    return updatedProposal;
  }

  async getGovernanceVotes(proposalId: string): Promise<GovernanceVote[]> {
    return this.governanceVotes.get(proposalId) || [];
  }

  async createGovernanceVote(vote: Omit<GovernanceVote, 'id' | 'createdAt'>): Promise<GovernanceVote> {
    const id = this.currentId++;
    const voteWithId: GovernanceVote = { 
      ...vote, 
      id, 
      createdAt: new Date()
    };
    
    const existingVotes = this.governanceVotes.get(vote.proposalId) || [];
    existingVotes.push(voteWithId);
    this.governanceVotes.set(vote.proposalId, existingVotes);
    
    return voteWithId;
  }

  async getPayoutHistory(poolId?: string, contractId?: string): Promise<PayoutHistory[]> {
    let history = [...this.payoutHistory];
    
    if (poolId) {
      history = history.filter(h => h.poolId === poolId);
    }
    if (contractId) {
      history = history.filter(h => h.contractId === contractId);
    }
    
    return history.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
  }

  async createPayoutHistory(payout: Omit<PayoutHistory, 'id' | 'createdAt'>): Promise<PayoutHistory> {
    const id = this.currentId++;
    const payoutWithId: PayoutHistory = { 
      ...payout, 
      id, 
      createdAt: new Date()
    };
    
    this.payoutHistory.push(payoutWithId);
    return payoutWithId;
  }

  async getAiInteractions(userId: number, sessionId?: string): Promise<AiInteraction[]> {
    const interactions = this.aiInteractions.get(userId) || [];
    return sessionId ? interactions.filter(i => i.sessionId === sessionId) : interactions;
  }

  async createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const id = this.currentId++;
    const interactionWithId: AiInteraction = { 
      ...interaction, 
      id, 
      createdAt: new Date()
    };
    
    const existingInteractions = this.aiInteractions.get(interaction.userId || 0) || [];
    existingInteractions.push(interactionWithId);
    this.aiInteractions.set(interaction.userId || 0, existingInteractions);
    
    return interactionWithId;
  }

  // Automated Trading Methods
  async getAutomatedTradingRules(userId?: number): Promise<AutomatedTradingRule[]> {
    const allRules = Array.from(this.automatedTradingRules.values());
    if (userId) {
      return allRules.filter(rule => rule.userId === userId);
    }
    return allRules;
  }

  async getUserAutomatedTradingRules(userId: number): Promise<AutomatedTradingRule[]> {
    return Array.from(this.automatedTradingRules.values()).filter(rule => rule.userId === userId);
  }

  async getActiveAutomatedTradingRules(): Promise<AutomatedTradingRule[]> {
    return Array.from(this.automatedTradingRules.values()).filter(rule => rule.isActive);
  }

  async getAutomatedTradingRule(ruleId: string): Promise<AutomatedTradingRule | undefined> {
    return this.automatedTradingRules.get(ruleId);
  }

  async createAutomatedTradingRule(rule: InsertAutomatedTradingRule): Promise<AutomatedTradingRule> {
    const id = this.currentId++;
    const ruleWithId: AutomatedTradingRule = { 
      ...rule, 
      id,
      executionCount: 0,
      lastExecuted: null,
      totalProfit: "0",
      createdAt: new Date()
    };
    
    this.automatedTradingRules.set(rule.ruleId, ruleWithId);
    return ruleWithId;
  }

  async updateAutomatedTradingRule(ruleId: string, updates: Partial<AutomatedTradingRule>): Promise<AutomatedTradingRule> {
    const existingRule = this.automatedTradingRules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Trading rule ${ruleId} not found`);
    }
    
    const updatedRule = { ...existingRule, ...updates };
    this.automatedTradingRules.set(ruleId, updatedRule);
    return updatedRule;
  }

  async deleteAutomatedTradingRule(ruleId: string): Promise<void> {
    this.automatedTradingRules.delete(ruleId);
    this.automatedTradingExecutions.delete(ruleId);
  }

  async getAutomatedTradingExecutions(ruleId?: string): Promise<AutomatedTradingExecution[]> {
    if (ruleId) {
      return this.automatedTradingExecutions.get(ruleId) || [];
    }
    
    const allExecutions: AutomatedTradingExecution[] = [];
    for (const executions of this.automatedTradingExecutions.values()) {
      allExecutions.push(...executions);
    }
    return allExecutions.sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  async getAutomatedTradingExecutionsByDateRange(ruleId: string, startDate: Date, endDate: Date): Promise<AutomatedTradingExecution[]> {
    const executions = this.automatedTradingExecutions.get(ruleId) || [];
    return executions.filter(exec => 
      exec.executedAt >= startDate && exec.executedAt <= endDate
    ).sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());
  }

  async createAutomatedTradingExecution(execution: InsertAutomatedTradingExecution): Promise<AutomatedTradingExecution> {
    const id = this.currentId++;
    const executionWithId: AutomatedTradingExecution = { 
      ...execution, 
      id,
      executedAt: new Date()
    };
    
    const existingExecutions = this.automatedTradingExecutions.get(execution.ruleId) || [];
    existingExecutions.push(executionWithId);
    this.automatedTradingExecutions.set(execution.ruleId, existingExecutions);
    
    return executionWithId;
  }
}

export const storage = new MemStorage();
