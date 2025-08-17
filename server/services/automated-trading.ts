import { IStorage } from "../storage";
import { weatherXMService } from "./weatherxm";
import { openaiService } from "./openai";
import { pricingService } from "./pricing";
import type { AutomatedTradingRule, AutomatedTradingExecution, OptionContract } from "../../shared/schema";

// Flow AI Agent with automated trading capabilities
export interface FlowAICondition {
  type: "weather" | "price" | "time" | "technical" | "volatility";
  operator: "gt" | "lt" | "eq" | "gte" | "lte" | "between";
  value: number | string | [number, number];
  stationId?: string;
  timeframe?: string;
}

export interface FlowAIAction {
  type: "buy_call" | "buy_put" | "sell_call" | "sell_put" | "close_position";
  contractType: "call" | "put";
  underlying?: string;
  strikePrice?: number;
  expiryDays?: number;
  quantity: number;
  maxPremium?: number;
}

export interface FlowAIRiskLimits {
  maxPositionSize: number;
  maxDailyTrades: number;
  maxLossPerTrade: number;
  maxTotalLoss: number;
  stopLossPercentage?: number;
  takeProfitPercentage?: number;
}

export class FlowAITradingAgent {
  private storage: IStorage;
  private isRunning: boolean = false;
  private executionInterval: NodeJS.Timeout | null = null;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async startAgent(): Promise<void> {
    if (this.isRunning) return;
    
    console.log("🤖 Flow AI Trading Agent starting...");
    this.isRunning = true;
    
    // Check conditions every 30 seconds
    this.executionInterval = setInterval(async () => {
      await this.checkAndExecuteRules();
    }, 30000);
  }

  async stopAgent(): Promise<void> {
    if (!this.isRunning) return;
    
    console.log("🛑 Flow AI Trading Agent stopping...");
    this.isRunning = false;
    
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
  }

  async createTradingRule(rule: {
    userId: number;
    name: string;
    description?: string;
    conditions: FlowAICondition[];
    actions: FlowAIAction[];
    riskLimits: FlowAIRiskLimits;
  }): Promise<AutomatedTradingRule> {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const tradingRule = await this.storage.createAutomatedTradingRule({
      userId: rule.userId,
      ruleId,
      name: rule.name,
      description: rule.description || "",
      isActive: true,
      conditions: rule.conditions,
      actions: rule.actions,
      riskLimits: rule.riskLimits
    });

    console.log(`✅ Created trading rule: ${rule.name} (${ruleId})`);
    return tradingRule;
  }

  async updateTradingRule(ruleId: string, updates: Partial<AutomatedTradingRule>): Promise<AutomatedTradingRule> {
    return await this.storage.updateAutomatedTradingRule(ruleId, updates);
  }

  async getUserTradingRules(userId: number): Promise<AutomatedTradingRule[]> {
    return await this.storage.getUserAutomatedTradingRules(userId);
  }

  private async checkAndExecuteRules(): Promise<void> {
    try {
      const activeRules = await this.storage.getActiveAutomatedTradingRules();
      
      for (const rule of activeRules) {
        await this.evaluateRule(rule);
      }
    } catch (error) {
      console.error("Error checking trading rules:", error);
    }
  }

  private async evaluateRule(rule: AutomatedTradingRule): Promise<void> {
    try {
      const conditions = rule.conditions as FlowAICondition[];
      const actions = rule.actions as FlowAIAction[];
      const riskLimits = rule.riskLimits as FlowAIRiskLimits;

      // Check if conditions are met
      const conditionResults = await Promise.all(
        conditions.map(condition => this.evaluateCondition(condition))
      );

      const allConditionsMet = conditionResults.every(result => result.met);

      if (allConditionsMet) {
        console.log(`🎯 Rule "${rule.name}" conditions met, executing actions...`);
        
        // Get AI analysis before execution
        const aiAnalysis = await this.getAIAnalysisForExecution(rule, conditionResults);
        
        // Check risk limits
        const riskCheck = await this.checkRiskLimits(rule, riskLimits);
        if (!riskCheck.allowed) {
          console.log(`⚠️ Rule "${rule.name}" blocked by risk limits: ${riskCheck.reason}`);
          return;
        }

        // Execute actions
        for (const action of actions) {
          await this.executeAction(rule, action, aiAnalysis, conditionResults);
        }

        // Update rule execution stats
        await this.storage.updateAutomatedTradingRule(rule.ruleId, {
          executionCount: (rule.executionCount || 0) + 1,
          lastExecuted: new Date()
        });
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
    }
  }

  private async evaluateCondition(condition: FlowAICondition): Promise<{ met: boolean; value: any; analysis: string }> {
    switch (condition.type) {
      case "weather":
        return await this.evaluateWeatherCondition(condition);
      case "price":
        return await this.evaluatePriceCondition(condition);
      case "volatility":
        return await this.evaluateVolatilityCondition(condition);
      case "time":
        return this.evaluateTimeCondition(condition);
      default:
        return { met: false, value: null, analysis: "Unknown condition type" };
    }
  }

  private async evaluateWeatherCondition(condition: FlowAICondition): Promise<{ met: boolean; value: any; analysis: string }> {
    try {
      const stationId = condition.stationId || "wxm_dallas_001";
      const currentRainfall = await weatherXMService.getLatestRainfall(stationId);
      
      const met = this.compareValues(currentRainfall, condition.operator, condition.value);
      
      return {
        met,
        value: currentRainfall,
        analysis: `Current rainfall: ${currentRainfall}mm, condition: ${condition.operator} ${condition.value}`
      };
    } catch (error) {
      return { met: false, value: null, analysis: `Weather data unavailable: ${error.message}` };
    }
  }

  private async evaluatePriceCondition(condition: FlowAICondition): Promise<{ met: boolean; value: any; analysis: string }> {
    try {
      // Get current option prices for comparison
      const contracts = await this.storage.getOptionContracts();
      const relevantContract = contracts.find(c => c.underlying === condition.value);
      
      if (!relevantContract) {
        return { met: false, value: null, analysis: "Contract not found" };
      }

      const currentPremium = parseFloat(relevantContract.premium);
      const met = this.compareValues(currentPremium, condition.operator, condition.value);
      
      return {
        met,
        value: currentPremium,
        analysis: `Current premium: $${currentPremium}, condition: ${condition.operator} $${condition.value}`
      };
    } catch (error) {
      return { met: false, value: null, analysis: `Price data unavailable: ${error.message}` };
    }
  }

  private async evaluateVolatilityCondition(condition: FlowAICondition): Promise<{ met: boolean; value: any; analysis: string }> {
    try {
      const stationId = condition.stationId || "wxm_dallas_001";
      const trendData = await weatherXMService.get30DayRainfallTrend(stationId);
      const rainfallValues = trendData.map(d => d.rainfall);
      const impliedVol = pricingService.calculateImpliedVolatility(rainfallValues);
      
      const met = this.compareValues(impliedVol, condition.operator, condition.value);
      
      return {
        met,
        value: impliedVol,
        analysis: `Current implied volatility: ${impliedVol.toFixed(2)}%, condition: ${condition.operator} ${condition.value}%`
      };
    } catch (error) {
      return { met: false, value: null, analysis: `Volatility calculation failed: ${error.message}` };
    }
  }

  private evaluateTimeCondition(condition: FlowAICondition): { met: boolean; value: any; analysis: string } {
    const now = new Date();
    let met = false;
    let analysis = "";

    if (typeof condition.value === "string") {
      // Time-based conditions like "market_open", "before_expiry", etc.
      switch (condition.value) {
        case "market_open":
          const hour = now.getHours();
          met = hour >= 9 && hour < 16; // Market hours
          analysis = `Current time: ${hour}:00, market open: ${met}`;
          break;
        case "weekend":
          met = now.getDay() === 0 || now.getDay() === 6;
          analysis = `Is weekend: ${met}`;
          break;
        default:
          analysis = "Unknown time condition";
      }
    }

    return { met, value: now, analysis };
  }

  private compareValues(actual: number, operator: string, expected: any): boolean {
    switch (operator) {
      case "gt": return actual > expected;
      case "lt": return actual < expected;
      case "eq": return actual === expected;
      case "gte": return actual >= expected;
      case "lte": return actual <= expected;
      case "between":
        if (Array.isArray(expected) && expected.length === 2) {
          return actual >= expected[0] && actual <= expected[1];
        }
        return false;
      default: return false;
    }
  }

  private async getAIAnalysisForExecution(
    rule: AutomatedTradingRule, 
    conditionResults: any[]
  ): Promise<any> {
    try {
      const analysisQuery = `
        Analyze the following automated trading rule execution:
        Rule: ${rule.name}
        Conditions met: ${conditionResults.map(c => c.analysis).join("; ")}
        
        Provide analysis on:
        1. Market timing assessment
        2. Risk evaluation
        3. Expected outcome
        4. Confidence level (0-100%)
      `;

      const aiResponse = await openaiService.analyzeTradeQuery(
        analysisQuery,
        { conditions: conditionResults },
        await this.storage.getOptionContracts()
      );

      return aiResponse;
    } catch (error) {
      console.error("AI analysis failed:", error);
      return {
        response: "AI analysis unavailable",
        confidence: 0.5,
        reasoning: "Automated execution without AI analysis"
      };
    }
  }

  private async checkRiskLimits(rule: AutomatedTradingRule, limits: FlowAIRiskLimits): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Check daily trade count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayExecutions = await this.storage.getAutomatedTradingExecutionsByDateRange(
        rule.ruleId,
        today,
        new Date()
      );

      if (todayExecutions.length >= limits.maxDailyTrades) {
        return { allowed: false, reason: "Daily trade limit exceeded" };
      }

      // Check total losses
      const totalProfit = parseFloat(rule.totalProfit || "0");
      if (totalProfit <= -limits.maxTotalLoss) {
        return { allowed: false, reason: "Maximum total loss reached" };
      }

      return { allowed: true };
    } catch (error) {
      console.error("Risk check failed:", error);
      return { allowed: false, reason: "Risk check failed" };
    }
  }

  private async executeAction(
    rule: AutomatedTradingRule,
    action: FlowAIAction,
    aiAnalysis: any,
    triggerConditions: any[]
  ): Promise<void> {
    try {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Find or create contract for the action
      const contracts = await this.storage.getOptionContracts();
      let targetContract = contracts.find(c => 
        c.contractType === action.contractType &&
        c.underlying === action.underlying
      );

      if (!targetContract && action.type.includes("buy")) {
        // Create new contract if buying and none exists
        targetContract = await this.createContractForAction(action);
      }

      if (!targetContract) {
        console.log(`❌ No suitable contract found for action: ${action.type}`);
        return;
      }

      // Calculate trade details
      const tradeDetails = {
        contractId: targetContract.contractId,
        action: action.type,
        quantity: action.quantity,
        premium: parseFloat(targetContract.premium),
        totalCost: action.quantity * parseFloat(targetContract.premium),
        timestamp: new Date().toISOString()
      };

      // Execute the trade (in a real system, this would interact with smart contracts)
      const result = await this.simulateTradeExecution(targetContract, action);

      // Record execution
      await this.storage.createAutomatedTradingExecution({
        ruleId: rule.ruleId,
        executionId,
        triggeredBy: triggerConditions,
        tradeDetails,
        result: result.success ? "success" : "failed",
        profit: result.profit,
        aiAnalysis
      });

      // Update rule total profit
      const newTotalProfit = parseFloat(rule.totalProfit || "0") + (result.profit || 0);
      await this.storage.updateAutomatedTradingRule(rule.ruleId, {
        totalProfit: newTotalProfit.toString()
      });

      console.log(`✅ Executed trade: ${action.type} ${action.quantity}x ${targetContract.contractId} for ${tradeDetails.totalCost}`);
    } catch (error) {
      console.error("Trade execution failed:", error);
    }
  }

  private async createContractForAction(action: FlowAIAction): Promise<any> {
    // In a real system, this would create a new option contract
    // For now, we'll create a mock contract
    const contractId = `${action.underlying}_${action.contractType}_${action.strikePrice}mm_${Date.now()}`;
    
    return await this.storage.createOptionContract({
      contractId,
      underlying: action.underlying || "dallas_rain",
      contractType: action.contractType,
      strikePrice: (action.strikePrice || 15).toString(),
      premium: (action.maxPremium || 2.5).toString(),
      expiryDate: new Date(Date.now() + (action.expiryDays || 30) * 24 * 60 * 60 * 1000),
      totalSupply: 1000,
      availableSupply: 1000,
      Greeks: {
        delta: 0.5,
        gamma: 0.1,
        theta: -0.05,
        vega: 0.2
      }
    });
  }

  private async simulateTradeExecution(contract: any, action: FlowAIAction): Promise<{ success: boolean; profit?: number }> {
    // Simulate trade execution with realistic outcomes
    const successRate = 0.85; // 85% success rate for simulation
    const success = Math.random() < successRate;
    
    if (success) {
      // Calculate simulated profit/loss
      const premium = parseFloat(contract.premium);
      const quantity = action.quantity;
      
      // Simple P&L simulation
      let profit = 0;
      if (action.type.includes("buy")) {
        profit = -premium * quantity; // Cost of buying
      } else {
        profit = premium * quantity; // Income from selling
      }
      
      return { success: true, profit };
    } else {
      return { success: false };
    }
  }
}

// Export singleton instance
export const flowAIAgent = new FlowAITradingAgent(null as any); // Will be initialized in routes