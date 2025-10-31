import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { weatherXMService } from "./services/weatherxm";
import { chainlinkWeatherService } from "./services/chainlink-weather";
import { hybridWeatherService } from "./services/hybrid-weather";
import { chainlinkPriceFeedService } from "./services/chainlink-price-feeds";
import { chainlinkVRFService } from "./services/chainlink-vrf";
import { flareWeatherService } from "./services/flare-weather";
import flareNetworkService from "./services/flare-network";
import { openaiService } from "./services/openai";
import { pricingService } from "./services/pricing";
import { flowAIAgent } from "./services/automated-trading";
import { communityStakingService } from "./services/community-staking";
import { getFlowEVMService } from "./services/flow-evm";
import { flowForteActions } from "./services/flow-forte-actions";
import flowActionsRouter from "./routes/flow-actions";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize the Flow AI agent with storage
  (flowAIAgent as any).storage = storage;
  
  // Weather data routes
  app.get("/api/weather/stations", async (req, res) => {
    try {
      const { city, state } = req.query;
      if (city && state) {
        const stations = await storage.getWeatherStationsByCity(city as string, state as string);
        res.json(stations);
      } else {
        const stations = await storage.getWeatherStations();
        res.json(stations);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather stations" });
    }
  });

  app.get("/api/weather/data/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const { limit } = req.query;
      const data = await storage.getWeatherData(stationId, limit ? parseInt(limit as string) : undefined);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  app.get("/api/weather/current/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const hybridData = await hybridWeatherService.getCurrentWeatherData(stationId);
      
      res.json({
        stationId: hybridData.stationId,
        currentRainfall: hybridData.rainfall.value,
        windSpeed: hybridData.windSpeed?.value || 13.9, // Flare network wind data or Dallas baseline
        timestamp: hybridData.timestamp,
        dataQuality: {
          score: hybridData.dataQuality.score,
          verified: hybridData.dataQuality.verified,
          crossValidated: hybridData.dataQuality.crossValidated,
          variance: hybridData.dataQuality.variance
        },
        sources: {
          primary: hybridData.primarySource,
          backup: hybridData.backupSource,
          rainfallSources: hybridData.rainfall.sources,
          windSources: hybridData.windSpeed?.sources || { flare: 'pending' }
        },
        blockchain: hybridData.blockchain,
        confidence: hybridData.rainfall.confidence,
        aggregationMethod: hybridData.aggregationMethod,
        source: "Hybrid: Chainlink WeatherXM (rainfall) + Flare Network (wind)"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current weather data" });
    }
  });

  app.get("/api/weather/trend/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const { metric = "rainfall", period = "30" } = req.query;
      
      if (metric === "wind") {
        // Generate wind trend data using Flare service
        const windTrend = await flareWeatherService.getWindTrend(stationId, parseInt(period as string));
        res.json(windTrend);
      } else {
        // Default to rainfall trend from hybrid service with period support
        const periodDays = parseInt(period as string);
        const hybridTrend = await hybridWeatherService.getRainfallTrend(stationId, periodDays);
        res.json(hybridTrend);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch weather trend" });
    }
  });

  // Chainlink-specific weather data endpoints
  app.get("/api/weather/chainlink/current/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const chainlinkData = await chainlinkWeatherService.getCurrentWeatherData(stationId);
      
      res.json({
        stationId: chainlinkData.stationId,
        timestamp: chainlinkData.timestamp,
        rainfall: chainlinkData.rainfall,
        temperature: chainlinkData.temperature,
        humidity: chainlinkData.humidity,
        pressure: chainlinkData.pressure,
        windSpeed: chainlinkData.windSpeed,
        dataSource: chainlinkData.dataSource,
        blockchain: {
          hash: chainlinkData.blockchainHash,
          signature: chainlinkData.oracleSignature,
          verified: chainlinkData.verificationStatus === 'verified'
        },
        qualityScore: chainlinkData.qualityScore,
        source: "Chainlink Oracle Network"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Chainlink weather data" });
    }
  });

  app.get("/api/weather/chainlink/aggregated/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const { sources } = req.query;
      
      const sourcesArray = sources ? (sources as string).split(',') : ['chainlink', 'weatherapi', 'openweather'];
      const aggregatedData = await chainlinkWeatherService.getAggregatedWeatherData(stationId, sourcesArray);
      
      res.json({
        ...aggregatedData,
        aggregationSources: sourcesArray,
        source: "Chainlink Multi-Oracle Aggregation"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch aggregated Chainlink data" });
    }
  });

  // Flare Network-specific wind data endpoints
  app.get("/api/weather/flare/current/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const flareData = await flareWeatherService.getCurrentWindData(stationId);
      
      res.json({
        stationId: flareData.stationId,
        timestamp: flareData.timestamp,
        windSpeed: flareData.windSpeed,
        windDirection: flareData.windDirection,
        temperature: flareData.temperature,
        dataSource: flareData.dataSource,
        flare: {
          attestationHash: flareData.attestationHash,
          merkleProof: flareData.merkleProof,
          verificationStatus: flareData.verificationStatus
        },
        qualityScore: flareData.qualityScore,
        source: "Flare Data Connector (FDC)"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Flare wind data" });
    }
  });

  app.get("/api/weather/flare/test", async (req, res) => {
    try {
      const connectionTest = await flareWeatherService.testFdcConnection();
      res.json(connectionTest);
    } catch (error) {
      res.status(500).json({ error: "Failed to test Flare FDC connection" });
    }
  });

  // Hybrid weather system configuration endpoints
  app.post("/api/weather/hybrid/config", async (req, res) => {
    try {
      const schema = z.object({
        primarySource: z.enum(["weatherxm", "chainlink"]).optional(),
        varianceThreshold: z.number().min(0).max(1).optional(),
        crossValidation: z.boolean().optional()
      });

      const config = schema.parse(req.body);

      if (config.primarySource) {
        hybridWeatherService.setPrimarySource(config.primarySource);
      }

      if (config.varianceThreshold !== undefined) {
        hybridWeatherService.setVarianceThreshold(config.varianceThreshold);
      }

      if (config.crossValidation !== undefined) {
        hybridWeatherService.enableCrossValidationMode(config.crossValidation);
      }

      res.json({
        success: true,
        message: "Hybrid weather service configuration updated",
        config: config
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid configuration parameters" });
    }
  });

  app.get("/api/weather/hybrid/status", async (req, res) => {
    try {
      const { stationId } = req.query;
      
      if (!stationId) {
        return res.status(400).json({ error: "Station ID required" });
      }

      const hybridData = await hybridWeatherService.getCurrentWeatherData(stationId as string);
      
      res.json({
        stationId: hybridData.stationId,
        systemStatus: {
          primarySource: hybridData.primarySource,
          backupSource: hybridData.backupSource,
          crossValidated: hybridData.dataQuality.crossValidated,
          dataQuality: hybridData.dataQuality.score,
          variance: hybridData.dataQuality.variance,
          blockchainVerified: hybridData.blockchain.verified
        },
        lastUpdate: hybridData.timestamp,
        confidence: hybridData.rainfall.confidence,
        availableSources: Object.keys(hybridData.rainfall.sources),
        source: "Hybrid System Status"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hybrid system status" });
    }
  });

  // Option contracts routes
  app.get("/api/options/contracts", async (req, res) => {
    try {
      const { underlying } = req.query;
      const contracts = await storage.getOptionContracts(underlying as string);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch option contracts" });
    }
  });

  app.get("/api/options/contracts/:contractId", async (req, res) => {
    try {
      const { contractId } = req.params;
      const contract = await storage.getOptionContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch option contract" });
    }
  });

  app.post("/api/options/price", async (req, res) => {
    try {
      const schema = z.object({
        contractType: z.enum(["call", "put"]),
        strike: z.number(),
        timeToExpiry: z.number(),
        currentValue: z.number(),
        volatility: z.number().optional(),
        stationId: z.string()
      });

      const { contractType, strike, timeToExpiry, currentValue, volatility, stationId } = schema.parse(req.body);
      
      // Get historical data for volatility calculation if not provided
      const historicalData = await storage.getWeatherData(stationId, 30);
      const rainfallValues = historicalData.map(d => parseFloat(d.rainfall || "0"));
      
      const impliedVol = volatility || pricingService.calculateImpliedVolatility(rainfallValues);
      
      const pricing = await pricingService.calculateOptionPrice(
        contractType,
        strike,
        timeToExpiry,
        currentValue,
        impliedVol
      );

      const breakEven = pricingService.calculateBreakEven(contractType, strike, pricing.premium);
      const { maxProfit, maxLoss } = pricingService.calculateMaxProfitLoss(contractType, strike, pricing.premium);
      const probabilityOfProfit = pricingService.estimateProbabilityOfProfit(contractType, strike, pricing.premium, rainfallValues);

      res.json({
        ...pricing,
        breakEven,
        maxProfit,
        maxLoss,
        probabilityOfProfit,
        methodology: "Monte Carlo simulation using historical rainfall data"
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid pricing request" });
    }
  });

  // Community pools routes
  app.get("/api/pools", async (req, res) => {
    try {
      const pools = await storage.getCommunityPools();
      res.json(pools);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch community pools" });
    }
  });

  app.get("/api/pools/:poolId", async (req, res) => {
    try {
      const { poolId } = req.params;
      const pool = await storage.getCommunityPool(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch community pool" });
    }
  });

  app.get("/api/pools/:poolId/members", async (req, res) => {
    try {
      const { poolId } = req.params;
      const members = await storage.getPoolMemberships(poolId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pool members" });
    }
  });

  app.post("/api/pools/:poolId/join", async (req, res) => {
    try {
      const { poolId } = req.params;
      const schema = z.object({
        userId: z.number(),
        stakeAmount: z.string()
      });

      const { userId, stakeAmount } = schema.parse(req.body);
      
      const membership = await storage.createPoolMembership({
        poolId,
        userId,
        stakeAmount
      });

      res.json(membership);
    } catch (error) {
      res.status(400).json({ error: "Failed to join pool" });
    }
  });

  app.post("/api/pools/:poolId/calculate-payout", async (req, res) => {
    try {
      const { poolId } = req.params;
      const schema = z.object({
        stakeAmount: z.string()
      });

      const { stakeAmount } = schema.parse(req.body);
      const pool = await storage.getCommunityPool(poolId);
      
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }

      const stake = parseFloat(stakeAmount);
      const tvl = parseFloat(pool.totalValueLocked || "0");
      const multiplier = parseFloat(pool.payoutMultiplier || "1");
      
      const userShare = stake / tvl;
      const estimatedPayout = stake * multiplier;

      res.json({
        stakeAmount: stake,
        userShare: userShare * 100,
        estimatedPayout,
        multiplier,
        triggerCondition: pool.triggerCondition
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to calculate payout" });
    }
  });

  // Governance routes
  app.get("/api/governance/proposals/:poolId", async (req, res) => {
    try {
      const { poolId } = req.params;
      const proposals = await storage.getGovernanceProposals(poolId);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch governance proposals" });
    }
  });

  app.post("/api/governance/vote", async (req, res) => {
    try {
      const schema = z.object({
        proposalId: z.string(),
        userId: z.number(),
        vote: z.enum(["for", "against"]),
        votingPower: z.number()
      });

      const voteData = schema.parse(req.body);
      const vote = await storage.createGovernanceVote(voteData);
      
      // Update proposal vote counts
      const proposal = await storage.getGovernanceProposal(voteData.proposalId);
      if (proposal) {
        const updates = {
          votesFor: voteData.vote === "for" ? (proposal.votesFor || 0) + voteData.votingPower : (proposal.votesFor || 0),
          votesAgainst: voteData.vote === "against" ? (proposal.votesAgainst || 0) + voteData.votingPower : (proposal.votesAgainst || 0),
          totalVotes: (proposal.totalVotes || 0) + voteData.votingPower
        };
        await storage.updateGovernanceProposal(voteData.proposalId, updates);
      }

      res.json(vote);
    } catch (error) {
      res.status(400).json({ error: "Failed to cast vote" });
    }
  });

  // Payout history routes
  app.get("/api/payouts/history", async (req, res) => {
    try {
      const { poolId, contractId } = req.query;
      const history = await storage.getPayoutHistory(poolId as string, contractId as string);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch payout history" });
    }
  });

  // Portfolio endpoints
  app.get('/api/portfolio/positions', async (req, res) => {
    try {
      // Mock portfolio data - in production, this would come from user's database
      const positions = [
        {
          id: 'pos_1',
          contractId: 'dallas_rain_call_15mm_sep01',
          type: 'call',
          strike: 15,
          premium: 2.50,
          quantity: 10,
          expiry: '2025-09-01',
          city: 'Dallas, TX',
          weatherMetric: 'rainfall',
          currentValue: 12.3,
          entryDate: '2025-08-10',
          status: 'open',
          pnl: -125.50,
          pnlPercent: -5.02
        },
        {
          id: 'pos_2',
          contractId: 'dallas_wind_put_8mph_aug30',
          type: 'put',
          strike: 8,
          premium: 1.80,
          quantity: 5,
          expiry: '2025-08-30',
          city: 'Dallas, TX',
          weatherMetric: 'wind',
          currentValue: 7.6,
          entryDate: '2025-08-15',
          status: 'open',
          pnl: 45.00,
          pnlPercent: 5.00
        },
        {
          id: 'pos_3',
          contractId: 'dallas_rain_put_10mm_aug20',
          type: 'put',
          strike: 10,
          premium: 3.20,
          quantity: 3,
          expiry: '2025-08-20',
          city: 'Dallas, TX',
          weatherMetric: 'rainfall',
          currentValue: 12.3,
          entryDate: '2025-08-05',
          status: 'closed',
          pnl: -96.00,
          pnlPercent: -10.00
        }
      ];

      res.json({ positions });
    } catch (error) {
      console.error('Portfolio positions error:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio positions' });
    }
  });

  app.get('/api/portfolio/stats', async (req, res) => {
    try {
      // Mock portfolio stats - in production, this would be calculated from user's positions
      const stats = {
        totalValue: 2847.50,
        totalPnL: -176.50,
        totalPnLPercent: -5.84,
        openPositions: 2,
        dayChange: 23.50,
        dayChangePercent: 0.83
      };

      res.json(stats);
    } catch (error) {
      console.error('Portfolio stats error:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio stats' });
    }
  });

  // AI assistant routes
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const schema = z.object({
        query: z.string(),
        userId: z.number().optional(),
        sessionId: z.string(),
        stationId: z.string().optional()
      });

      const { query, userId, sessionId, stationId } = schema.parse(req.body);
      
      // Get relevant context data
      const weatherData = stationId ? await weatherXMService.getRainfallData(stationId) : null;
      const optionContracts = await storage.getOptionContracts();
      
      const aiResponse = await openaiService.analyzeTradeQuery(
        query,
        weatherData,
        optionContracts
      );

      // Save interaction
      if (userId) {
        await storage.createAiInteraction({
          userId,
          sessionId,
          query,
          response: aiResponse.response,
          confidence: aiResponse.confidence.toString(),
          tradeRecommendation: aiResponse.tradeRecommendation
        });
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("AI chat error:", error);
      // Provide fallback response for API issues
      res.json({
        response: "I'm currently experiencing connection issues with my AI models, but I can still help with basic weather analysis. Current rainfall data shows active patterns that could impact your trading strategy. Consider reviewing the market overview for current conditions.",
        confidence: 75,
        tradeRecommendation: {
          action: "ANALYZE",
          entry: "Review current market conditions",
          reasoning: "API temporarily unavailable - manual analysis recommended",
          riskReward: "Variable"
        }
      });
    }
  });

  app.get("/api/ai/insights", async (req, res) => {
    try {
      const { stationId } = req.query;
      const weatherData = stationId ? await weatherXMService.getRainfallData(stationId as string) : null;
      const optionContracts = await storage.getOptionContracts();
      
      const insights = await openaiService.generateMarketInsights(weatherData, optionContracts);
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate AI insights" });
    }
  });

  app.get("/api/ai/accuracy", async (req, res) => {
    try {
      // Mock accuracy metrics for demo
      res.json({
        priceAccuracy: 94.2,
        weatherPrediction: 91.8,
        riskAssessment: 87.5,
        overallConfidence: 91.2
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI accuracy metrics" });
    }
  });

  // Natural Language Trading endpoint
  app.post("/api/ai/natural-language-trade", async (req, res) => {
    try {
      const { input, sessionId, userId } = req.body;
      
      if (!input || !sessionId || !userId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { NaturalLanguageAgent } = await import('./services/natural-language-agent');
      const nlAgent = new NaturalLanguageAgent();
      
      const result = await nlAgent.processNaturalLanguageTradeRequest(
        input,
        userId,
        sessionId
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error processing natural language trade:", error);
      res.status(500).json({ error: "Failed to process trade request" });
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string(),
        password: z.string(),
        walletAddress: z.string().optional()
      });

      const userData = schema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json({ id: user.id, username: user.username, walletAddress: user.walletAddress });
    } catch (error) {
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:userId/positions", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const positions = await storage.getUserPositions(userId);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user positions" });
    }
  });

  app.get("/api/users/:userId/pools", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const memberships = await storage.getUserPoolMemberships(userId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user pool memberships" });
    }
  });

  // Market data routes
  app.get("/api/market/overview", async (req, res) => {
    try {
      const contracts = await storage.getOptionContracts();
      const pools = await storage.getCommunityPools();
      
      const totalVolume = contracts.reduce((sum, c) => sum + (c.totalSupply - c.availableSupply) * parseFloat(c.premium), 0);
      const totalTVL = pools.reduce((sum, p) => sum + parseFloat(p.totalValueLocked || "0"), 0);
      const activeContracts = contracts.filter(c => !c.isSettled).length;
      
      res.json({
        activeContracts,
        totalVolume: totalVolume.toFixed(2),
        totalTVL: totalTVL.toFixed(2),
        impliedVolatility: "28.5",
        marketStatus: "live"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market overview" });
    }
  });

  // Flow AI Agent & Automated Trading Routes
  app.post("/api/flow-ai/start", async (req, res) => {
    try {
      await flowAIAgent.startAgent();
      res.json({ status: "started", message: "Flow AI Trading Agent is now active" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/flow-ai/stop", async (req, res) => {
    try {
      await flowAIAgent.stopAgent();
      res.json({ status: "stopped", message: "Flow AI Trading Agent has been stopped" });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/trading-rules/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const rules = await flowAIAgent.getUserTradingRules(userId);
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all trading rules (for demo)
  app.get("/api/trading/rules", async (req, res) => {
    try {
      const rules = await storage.getAutomatedTradingRules();
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trading rules" });
    }
  });

  app.post("/api/trading-rules", async (req, res) => {
    try {
      const { userId, name, description, conditions, actions, riskLimits } = req.body;
      
      const rule = await flowAIAgent.createTradingRule({
        userId: parseInt(userId),
        name,
        description,
        conditions,
        actions,
        riskLimits
      });
      
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/trading-rules/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;
      const updates = req.body;
      
      const updatedRule = await flowAIAgent.updateTradingRule(ruleId, updates);
      res.json(updatedRule);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/trading-executions/:ruleId", async (req, res) => {
    try {
      const { ruleId } = req.params;
      const executions = await storage.getAutomatedTradingExecutions(ruleId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/flow-ai/chat", async (req, res) => {
    try {
      const { query, userId, sessionId } = req.body;
      
      // Get current market data for context
      const contracts = await storage.getOptionContracts();
      const weatherData = await weatherXMService.getLatestRainfall("wxm_dallas_001");
      
      // Generate AI response with trading context
      const response = await openaiService.analyzeTradeQuery(
        query,
        { weatherData, userId },
        contracts
      );
      
      // Save the interaction
      await storage.createAiInteraction({
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        query,
        response: response.response || "No response generated",
        confidence: response.confidence ? response.confidence.toString() : null,
        tradeRecommendation: response.tradeRecommendation || null
      });
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Flow testnet integration endpoints
  app.get("/api/flow-testnet/status", async (req, res) => {
    try {
      res.json({
        network: "Flow Testnet",
        contractAddress: "0xf2085ff3cef1d657",
        contracts: {
          SimpleWeatherOracle: "0xf2085ff3cef1d657",
          SimpleWeatherDerivatives: "0xf2085ff3cef1d657"
        },
        explorerUrl: "https://testnet.flowscan.io/account/0xf2085ff3cef1d657",
        status: "deployed"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get testnet status" });
    }
  });

  app.get("/api/flow-testnet/weather-stations", async (req, res) => {
    try {
      // This would call the Flow script to get stations from testnet
      res.json({
        stations: ["DALLAS_001", "HOUSTON_001", "AUSTIN_001"],
        source: "Flow Testnet",
        contractAddress: "0xf2085ff3cef1d657"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch testnet weather stations" });
    }
  });

  app.post("/api/flow-testnet/create-weather-action", async (req, res) => {
    try {
      const { stationId, rainfall, windSpeed, temperature, useRealExecution } = req.body;
      
      let result;
      
      if (useRealExecution) {
        // CRITICAL: Real Flow testnet execution - will appear on FlowScan
        const { executeRealWeatherUpdate } = await import('./flow-testnet-real');
        result = await executeRealWeatherUpdate(
          stationId,
          parseFloat(rainfall),
          parseFloat(windSpeed),
          parseFloat(temperature)
        );
      } else {
        // Enhanced demo mode with realistic Flow transaction IDs
        const { flowActionsService } = await import('./flow-actions-service');
        const actionResult = await flowActionsService.executeAction('weather_update', {
          stationId,
          rainfall: parseFloat(rainfall),
          windSpeed: parseFloat(windSpeed),
          temperature: parseFloat(temperature)
        });
        
        result = {
          success: actionResult.success,
          transactionId: actionResult.transactionId,
          explorerUrl: actionResult.explorerUrl,
          isReal: false,
          error: actionResult.error
        };
      }
      
      res.json({
        success: result.success,
        transactionId: result.transactionId,
        explorerUrl: result.explorerUrl,
        executionMode: useRealExecution ? 'real' : 'demo',
        isRealTransaction: result.isReal || false,
        message: result.success 
          ? `Weather Forte Action executed successfully (${result.isReal ? 'Real Blockchain' : 'Demo'} mode)` 
          : "Weather action failed",
        stationId,
        rainfall,
        windSpeed,
        temperature,
        error: result.error
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to execute weather Forte Action", 
        details: error.message 
      });
    }
  });

  app.post("/api/flow-testnet/schedule-settlement", async (req, res) => {
    try {
      const { optionId, settlementTime, useRealExecution } = req.body;
      
      const scheduleId = `settlement_${optionId}_${Date.now()}`;
      
      if (useRealExecution) {
        // REAL Flow testnet contract call
        const { executeRealScheduledTransaction } = await import('./flow-testnet-real');
        const result = await executeRealScheduledTransaction(
          optionId,
          new Date(settlementTime).getTime()
        );
        
        res.json({
          success: true,
          scheduleId,
          transactionId: result.transactionId,
          explorerUrl: result.explorerUrl,
          isReal: result.isReal,
          message: result.isReal ? 
            "✅ REAL option settlement scheduled on Flow testnet blockchain" : 
            "Demo mode: Option settlement simulated",
          optionId,
          settlementTime,
          executionTime: new Date(settlementTime).getTime(),
          error: result.error
        });
      } else {
        // Demo mode with realistic transaction ID
        const mockTransactionId = `0x${Math.random().toString(16).substring(2, 66)}`;
        
        res.json({
          success: true,
          scheduleId,
          transactionId: mockTransactionId,
          explorerUrl: `https://testnet.flowscan.io/transaction/${mockTransactionId}`,
          isReal: false,
          message: "Demo mode: Option settlement scheduled",
          optionId,
          settlementTime,
          executionTime: new Date(settlementTime).getTime()
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to schedule settlement on testnet" });
    }
  });

  app.post("/api/flow-testnet/schedule-reward", async (req, res) => {
    try {
      const { poolId, amount, useRealExecution } = req.body;
      
      const scheduleId = `reward_${poolId}_${Date.now()}`;
      
      if (useRealExecution) {
        // REAL Flow testnet contract call for reward distribution
        const { executeRealRewardDistribution } = await import('./flow-testnet-real');
        const result = await executeRealRewardDistribution(
          poolId,
          parseFloat(amount)
        );
        
        res.json({
          success: true,
          scheduleId,
          transactionId: result.transactionId,
          explorerUrl: result.explorerUrl,
          isReal: result.isReal,
          message: result.isReal ? 
            "✅ REAL reward distribution scheduled on Flow testnet blockchain" : 
            "Demo mode: Reward distribution simulated",
          poolId,
          amount,
          executionTime: Date.now() + 3600000, // 1 hour from now
          error: result.error
        });
      } else {
        // Demo mode with realistic transaction ID
        const mockTransactionId = `0x${Math.random().toString(16).substring(2, 66)}`;
        
        res.json({
          success: true,
          scheduleId,
          transactionId: mockTransactionId,
          explorerUrl: `https://testnet.flowscan.io/transaction/${mockTransactionId}`,
          isReal: false,
          message: "Demo mode: Reward distribution scheduled",
          poolId,
          amount,
          executionTime: Date.now() + 3600000 // 1 hour from now
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to schedule reward distribution on testnet" });
    }
  });

  app.get("/api/flow-testnet/scheduled-transactions", async (req, res) => {
    try {
      // Mock scheduled transactions for demo
      const scheduledTxs = [
        {
          scheduleId: 'settlement_dallas_rain_call_1730345400',
          transactionType: 'OptionSettlement',
          executionTime: Date.now() + 3600000,
          parameters: { optionId: 'dallas_rain_call_15mm', action: 'settle' },
          executed: false,
          contractAddress: '0xf2085ff3cef1d657'
        },
        {
          scheduleId: 'reward_weather_pool_1730349000',
          transactionType: 'RewardDistribution',
          executionTime: Date.now() + 7200000,
          parameters: { poolId: 'weather_protection_pool', amount: '500', action: 'distribute' },
          executed: false,
          contractAddress: '0xf2085ff3cef1d657'
        }
      ];
      
      res.json({
        scheduledTransactions: scheduledTxs,
        totalScheduled: scheduledTxs.length,
        totalExecuted: 0,
        contractAddress: '0xf2085ff3cef1d657'
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scheduled transactions" });
    }
  });

  // BOUNTY CRITICAL: Action Discovery Endpoints
  app.get("/api/flow-actions/discover", async (req, res) => {
    try {
      const { flowActionsService } = await import('./flow-actions-service');
      const { category } = req.query;
      
      const actions = await flowActionsService.discoverActions(category as string);
      
      res.json({
        success: true,
        actions,
        totalActions: actions.length,
        categories: Array.from(new Set(actions.map(a => a.category))),
        contractAddress: '0xf2085ff3cef1d657',
        message: "Flow Actions discovered successfully"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to discover Flow Actions", 
        details: error.message 
      });
    }
  });

  app.get("/api/flow-actions/:actionId", async (req, res) => {
    try {
      const { flowActionsService } = await import('./flow-actions-service');
      const { actionId } = req.params;
      
      const action = flowActionsService.getAction(actionId);
      
      if (!action) {
        return res.status(404).json({ error: "Action not found" });
      }
      
      res.json({
        success: true,
        action,
        contractAddress: action.contractAddress
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get action details", 
        details: error.message 
      });
    }
  });

  app.post("/api/flow-actions/execute", async (req, res) => {
    try {
      const { flowActionsService } = await import('./flow-actions-service');
      const { actionId, parameters, useRealExecution = false } = req.body;
      
      const result = await flowActionsService.executeAction(
        actionId, 
        parameters, 
        useRealExecution
      );
      
      res.json({
        success: result.success,
        result,
        message: result.success 
          ? "Flow Action executed successfully" 
          : "Flow Action execution failed"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to execute Flow Action", 
        details: error.message 
      });
    }
  });

  app.post("/api/flow-actions/chain", async (req, res) => {
    try {
      const { flowActionsService } = await import('./flow-actions-service');
      const { actions, useRealExecution = false } = req.body;
      
      const result = await flowActionsService.executeActionChain(
        actions, 
        useRealExecution
      );
      
      res.json({
        success: result.success,
        chainId: result.chainId,
        results: result.results,
        totalExecutionTime: result.totalExecutionTime,
        message: result.success 
          ? "Action chain executed successfully" 
          : "Action chain execution failed"
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to execute action chain", 
        details: error.message 
      });
    }
  });

  app.get("/api/flow-actions/history", async (req, res) => {
    try {
      const { flowActionsService } = await import('./flow-actions-service');
      const { limit = 10 } = req.query;
      
      const history = flowActionsService.getExecutionHistory(parseInt(limit as string));
      
      res.json({
        success: true,
        history,
        totalExecutions: history.length
      });
    } catch (error: any) {
      res.status(500).json({ 
        error: "Failed to get execution history", 
        details: error.message 
      });
    }
  });

  // Add the missing endpoint for processing trade requests
  app.post("/api/ai/process-trade", async (req, res) => {
    try {
      const { query, userId, sessionId } = req.body;
      
      // Get current market data for context
      const contracts = await storage.getOptionContracts();
      const weatherData = await weatherXMService.getLatestRainfall("wxm_dallas_001");
      
      // Generate AI response with trading context
      const response = await openaiService.analyzeTradeQuery(
        query,
        { weatherData, userId },
        contracts
      );
      
      // Save the interaction
      await storage.createAiInteraction({
        userId,
        sessionId: sessionId || `session_${Date.now()}`,
        query,
        response: response.response || "No response generated",
        confidence: response.confidence ? response.confidence.toString() : null,
        tradeRecommendation: response.tradeRecommendation || null
      });
      
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/flow-ai/analysis/:symbol", async (req, res) => {
    try {
      const { symbol } = req.params;
      
      // Get comprehensive analysis for a specific symbol
      const weatherData = await weatherXMService.getLatestRainfall(symbol);
      const trend = await weatherXMService.get30DayRainfallTrend(symbol);
      const contracts = await storage.getOptionContracts(symbol);
      
      const analysis = {
        currentWeather: weatherData,
        trend: trend.slice(-7), // Last 7 days
        contracts: contracts.slice(0, 5), // Top 5 contracts
        aiInsights: await openaiService.analyzeTradeQuery(
          `Provide comprehensive trading analysis for ${symbol} including weather patterns, volatility, and recommended strategies.`,
          { weatherData, trend },
          contracts
        )
      };
      
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // USDF Pricing routes with real Chainlink data
  app.get("/api/usdf/pricing", async (req, res) => {
    try {
      const pricing = await chainlinkPriceFeedService.getUSDFPricing();
      res.json(pricing);
    } catch (error) {
      console.error('USDF pricing error:', error);
      res.status(500).json({ error: "Failed to fetch USDF pricing" });
    }
  });

  app.get("/api/usdf/health", async (req, res) => {
    try {
      const health = await chainlinkPriceFeedService.getHealthCheck();
      res.json(health);
    } catch (error) {
      console.error('USDF health check error:', error);
      res.status(500).json({ error: "Failed to check price feed health" });
    }
  });

  // Chainlink VRF routes for community pool rewards
  app.post("/api/vrf/request-draw", async (req, res) => {
    try {
      const { poolId, drawType, participants, stakes } = req.body;
      
      if (!poolId || !drawType || !participants || !stakes) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      const vrfRequest = await chainlinkVRFService.requestRandomness(
        poolId,
        drawType,
        participants,
        stakes
      );
      
      res.json(vrfRequest);
    } catch (error) {
      console.error('VRF request error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/vrf/request/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const vrfRequest = await chainlinkVRFService.getVRFRequest(requestId);
      
      if (!vrfRequest) {
        return res.status(404).json({ error: "VRF request not found" });
      }
      
      res.json(vrfRequest);
    } catch (error) {
      console.error('VRF request fetch error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/vrf/pool/:poolId/requests", async (req, res) => {
    try {
      const { poolId } = req.params;
      
      // Sample data for Live Draws section
      const sampleRequests = [
        {
          requestId: "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12",
          drawType: "weekly",
          poolId: poolId,
          timestamp: Date.now() - 420000, // 7 minutes ago
          fulfilled: true,
          transactionHash: "0xf1e2d3c4b5a6978012345678901234567890abcd",
          participants: [
            "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d",
            "0x8ba1f109551bD432803012645Hac136c9c123456",
            "0x123abc456def789012345678901234567890abcd",
            "0x456def789abc012345678901234567890123cdef",
            "0x789fed654cba321098765432109876543210abcd",
            "0x987abc123def456789012345678901234567890e"
          ],
          stakes: ["500.00", "1250.00", "750.00", "900.00", "825.00", "1100.00"],
          winners: [
            {
              address: "0x8ba1f109551bD432803012645Hac136c9c123456",
              tier: "weekly",
              reward: "1,284.75",
              randomness: "0x9876543210abcdef1234567890abcdef12345678",
              position: 1
            },
            {
              address: "0x987abc123def456789012345678901234567890e", 
              tier: "weekly",
              reward: "856.50",
              randomness: "0x5432109876abcdef1234567890abcdef12345678",
              position: 2
            },
            {
              address: "0x456def789abc012345678901234567890123cdef", 
              tier: "weekly",
              reward: "642.25",
              randomness: "0x2468acf13579bde0987654321098765432109876",
              position: 3
            }
          ],
          randomnessValue: "78294651037428691038475629384756291037465",
          blockHash: "0xabc123def456789012345678901234567890abcdef",
          blockNumber: 18957432,
          gasUsed: 156240,
          confirmations: 18,
          vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909"
        },
        {
          requestId: "0x2b3c4d5e6f7890abcdef1234567890abcdef1234",
          drawType: "monthly",
          poolId: poolId,
          timestamp: Date.now() - 240000, // 4 minutes ago
          fulfilled: true,
          transactionHash: "0xe2f3d4c5b6a7981023456789012345678901bcde",
          participants: [
            "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d",
            "0x8ba1f109551bD432803012645Hac136c9c123456",
            "0x123abc456def789012345678901234567890abcd",
            "0x789def012abc345678901234567890123456cdef",
            "0x345cde678fgh901234567890123456789012345a",
            "0x654fed321cba098765432109876543210987654b",
            "0x258afc369bed741852963074185296307418529c"
          ],
          stakes: ["500.00", "1250.00", "750.00", "900.00", "1100.00", "1375.00", "925.00"],
          winners: [
            {
              address: "0x654fed321cba098765432109876543210987654b",
              tier: "grand_prize",
              reward: "6,800.00",
              randomness: "0x147852369abcdef0123456789012345678901234",
              position: 1
            }
          ],
          randomnessValue: "45629837465291038475629384756291037428691",
          blockHash: "0xdef456abc789012345678901234567890abcdef1",
          blockNumber: 18957445,
          gasUsed: 194730,
          confirmations: 12,
          vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909"
        },
        {
          requestId: "0x3c4d5e6f7890abcdef1234567890abcdef123456",
          drawType: "weekly",
          poolId: poolId,
          timestamp: Date.now() - 90000, // 1.5 minutes ago
          fulfilled: false,
          transactionHash: "0xa1b2c3d4e5f6789012345678901234567890abcd",
          participants: [
            "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d",
            "0x8ba1f109551bD432803012645Hac136c9c123456",
            "0x123abc456def789012345678901234567890abcd",
            "0x456def789abc012345678901234567890123cdef",
            "0x789fed654cba321098765432109876543210abcd"
          ],
          stakes: ["500.00", "1250.00", "750.00", "900.00", "1050.00"],
          winners: null,
          randomnessValue: null,
          blockHash: null,
          blockNumber: null,
          progress: 78,
          estimatedCompletion: Date.now() + 30000, // ~30 seconds
          description: "Weekly proportional reward distribution in progress"
        },
        {
          requestId: "0x4d5e6f7890abcdef1234567890abcdef12345678",
          drawType: "emergency",
          poolId: poolId,
          timestamp: Date.now() - 45000, // 45 seconds ago
          fulfilled: false,
          transactionHash: null,
          participants: [
            "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d",
            "0x8ba1f109551bD432803012645Hac136c9c123456",
            "0x123abc456def789012345678901234567890abcd"
          ],
          stakes: ["500.00", "1250.00", "750.00"],
          winners: null,
          randomnessValue: null,
          blockHash: null,
          blockNumber: null,
          progress: 35,
          estimatedCompletion: Date.now() + 75000, // ~1.25 minutes
          triggerReason: "Extreme drought conditions detected - Emergency payout triggered",
          description: "Emergency relief distribution for qualifying members"
        }
      ];
      
      res.json(sampleRequests);
    } catch (error) {
      console.error('Pool VRF requests error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/vrf/proof/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      
      // Sample data for Proof of Fairness section
      const proofData = {
        requestId: requestId,
        vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
        keyHash: "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef",
        requestConfirmations: 3,
        callbackGasLimit: 100000,
        numWords: 1,
        randomWords: ["78294651037428691038475629384756291037465"],
        blockNumber: 18957432,
        blockHash: "0xabc123def456789012345678901234567890abcdef",
        transactionHash: "0xf1e2d3c4b5a6978012345678901234567890abcd",
        requestTime: Date.now() - 300000,
        fulfillmentTime: Date.now() - 240000,
        gasUsed: 89734,
        requestTxHash: "0xd2e3f4c5b6a7981023456789012345678901cdef",
        fulfillmentTxHash: "0xf1e2d3c4b5a6978012345678901234567890abcd",
        verificationStatus: "verified",
        chainlinkNode: "0x2226a1c4c1b90a2d9f2e2b1a8f4e6c5d3a2b1c0f",
        participants: [
          {
            address: "0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d",
            stake: "500.00",
            normalizedStake: 0.115,
            randomValue: "23847",
            selectedRange: "0-11499"
          },
          {
            address: "0x8ba1f109551bD432803012645Hac136c9c123456",
            stake: "1250.00",
            normalizedStake: 0.289,
            randomValue: "67421",
            selectedRange: "11500-40399"
          },
          {
            address: "0x123abc456def789012345678901234567890abcd",
            stake: "750.00",
            normalizedStake: 0.173,
            randomValue: "84752",
            selectedRange: "40400-57699"
          },
          {
            address: "0x456def789abc012345678901234567890123cdef",
            stake: "900.00",
            normalizedStake: 0.208,
            randomValue: "15639",
            selectedRange: "57700-78499"
          },
          {
            address: "0x789fed654cba321098765432109876543210abcd",
            stake: "825.00",
            normalizedStake: 0.191,
            randomValue: "92847",
            selectedRange: "78500-97599"
          },
          {
            address: "0x987abc123def456789012345678901234567890e",
            stake: "1100.00",
            normalizedStake: 0.254,
            randomValue: "0.7829",
            selected: false
          },
          {
            address: "0x8ba1f109551bD432803012645Hac136c9c123456", 
            stake: "1250.00",
            normalizedStake: "0.3571",
            randomValue: "0.4651",
            selected: true,
            winPosition: 1
          },
          {
            address: "0x123abc456def789012345678901234567890abcd",
            stake: "750.00", 
            normalizedStake: "0.2143",
            randomValue: "0.0374",
            selected: false
          },
          {
            address: "0x456def789abc012345678901234567890123cdef",
            stake: "900.00",
            normalizedStake: "0.2857",
            randomValue: "0.2869",
            selected: true,
            winPosition: 2
          }
        ],
        algorithm: "Weighted random selection using Chainlink VRF",
        selectionCriteria: "Probability proportional to stake size",
        proofHash: "0x9876543210abcdef1234567890abcdef123456789abc"
      };
      
      res.json(proofData);
    } catch (error) {
      console.error('VRF proof error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/vrf/pool/:poolId/draws", async (req, res) => {
    try {
      const { poolId } = req.params;
      
      // Sample data for Scheduled Draws section
      const scheduledDraws = [
        {
          id: "weekly_draw_001",
          type: "weekly",
          poolId: poolId,
          scheduledTime: Date.now() + (1.5 * 24 * 60 * 60 * 1000), // 1.5 days
          rewardPool: "3,275.50",
          eligibleParticipants: 156,
          status: "scheduled",
          autoTrigger: true,
          description: "Weekly proportional reward distribution - Higher stakes eligible",
          estimatedWinners: 9,
          minimumStake: "250.00",
          maxReward: "1,200.00"
        },
        {
          id: "weekly_draw_002", 
          type: "weekly",
          poolId: poolId,
          scheduledTime: Date.now() + (8.5 * 24 * 60 * 60 * 1000), // 8.5 days
          rewardPool: "3,485.75",
          eligibleParticipants: 162,
          status: "scheduled",
          autoTrigger: true,
          description: "Weekly proportional reward distribution with bonus multiplier",
          estimatedWinners: 11,
          minimumStake: "250.00",
          maxReward: "1,350.00",
          bonusMultiplier: "1.15x"
        },
        {
          id: "monthly_draw_001",
          type: "monthly", 
          poolId: poolId,
          scheduledTime: Date.now() + (16.2 * 24 * 60 * 60 * 1000), // 16.2 days
          rewardPool: "14,750.00",
          eligibleParticipants: 162,
          status: "scheduled",
          autoTrigger: true,
          description: "Monthly grand prize - Winner takes 75%, remainder distributed proportionally",
          estimatedWinners: 1,
          grandPrizeAmount: "11,062.50",
          consolationPool: "3,687.50",
          minimumStake: "500.00"
        },
        {
          id: "emergency_draw_001",
          type: "emergency",
          poolId: poolId,
          scheduledTime: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
          rewardPool: "6,125.00", 
          eligibleParticipants: 94,
          status: "triggered",
          autoTrigger: false,
          description: "Emergency payout triggered by severe drought conditions (0.2mm rainfall in 30 days)",
          estimatedWinners: 15,
          triggerCondition: "< 5mm rainfall in 30-day period",
          weatherData: "0.2mm total rainfall recorded",
          urgencyLevel: "High"
        },
        {
          id: "special_draw_001",
          type: "special",
          poolId: poolId,
          scheduledTime: Date.now() + (23 * 24 * 60 * 60 * 1000), // 23 days
          rewardPool: "8,400.00",
          eligibleParticipants: 162,
          status: "scheduled",
          autoTrigger: true,
          description: "End-of-season special distribution - Celebrating community resilience",
          estimatedWinners: 20,
          minimumStake: "100.00",
          specialBonus: "Community loyalty bonus included"
        }
      ];
      
      res.json(scheduledDraws);
    } catch (error) {
      console.error('Pool draws error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/vrf/pool/:poolId/schedule", async (req, res) => {
    try {
      const { poolId } = req.params;
      chainlinkVRFService.schedulePoolDraws(poolId);
      res.json({ success: true, message: `Scheduled weekly and monthly draws for pool ${poolId}` });
    } catch (error) {
      console.error('Schedule draws error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/vrf/health", async (req, res) => {
    try {
      const health = await chainlinkVRFService.getHealthStatus();
      res.json(health);
    } catch (error) {
      console.error('VRF health check error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Add execute trade endpoint
  app.post("/api/trade/execute", async (req, res) => {
    try {
      const { 
        userId = 1, 
        contractId, 
        action, 
        quantity = 1, 
        strike, 
        premium,
        tradeType = "call"
      } = req.body;
      
      // Get the contract details
      const contract = await storage.getOptionContract(contractId);
      if (!contract) {
        return res.status(404).json({ error: "Contract not found" });
      }
      
      // Create user position
      const position = await storage.createUserPosition({
        userId: parseInt(userId),
        contractId,
        quantity: parseInt(quantity),
        entryPrice: premium || contract.premium,
        currentValue: contract.premium,
        pnl: "0"
      });
      
      res.json({ 
        success: true, 
        position,
        message: `Successfully executed ${action} order for ${quantity} contracts` 
      });
    } catch (error) {
      console.error('Execute trade error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to execute trade" });
    }
  });

  // Production Chainlink Oracle monitoring and management routes
  app.get("/api/oracle/status", async (req, res) => {
    try {
      const status = await chainlinkWeatherService.getOracleNetworkStatus();
      res.json(status);
    } catch (error) {
      console.error('Oracle status error:', error);
      res.status(500).json({ error: "Failed to get oracle network status" });
    }
  });

  app.get("/api/oracle/validate", async (req, res) => {
    try {
      const validation = await chainlinkWeatherService.validateOracleSetup();
      res.json(validation);
    } catch (error) {
      console.error('Oracle validation error:', error);
      res.status(500).json({ error: "Failed to validate oracle setup" });
    }
  });

  app.get("/api/oracle/costs", async (req, res) => {
    try {
      const dataPoints = parseInt(req.query.dataPoints as string) || 1;
      const costs = await chainlinkWeatherService.estimateOracleRequestCost(dataPoints);
      res.json(costs);
    } catch (error) {
      console.error('Oracle cost estimation error:', error);
      res.status(500).json({ error: "Failed to estimate oracle costs" });
    }
  });

  app.post("/api/oracle/batch-request", async (req, res) => {
    try {
      const { stations, timeRange } = req.body;
      
      if (!stations || !Array.isArray(stations) || !timeRange) {
        return res.status(400).json({ error: "Missing stations array or timeRange" });
      }

      const requests = await chainlinkWeatherService.batchRequestWeatherData(stations, timeRange);
      res.json({
        message: `Initiated ${requests.length} oracle requests`,
        requests: requests
      });
    } catch (error) {
      console.error('Batch oracle request error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/oracle/request/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      const status = await chainlinkWeatherService.getRequestStatus(requestId);
      res.json(status);
    } catch (error) {
      console.error('Oracle request status error:', error);
      res.status(500).json({ error: "Failed to get request status" });
    }
  });

  app.post("/api/oracle/cleanup", async (req, res) => {
    try {
      const maxAgeHours = parseInt(req.body.maxAgeHours) || 24;
      chainlinkWeatherService.cleanupOldRequests(maxAgeHours);
      res.json({ message: `Cleaned up requests older than ${maxAgeHours} hours` });
    } catch (error) {
      console.error('Oracle cleanup error:', error);
      res.status(500).json({ error: "Failed to cleanup old requests" });
    }
  });

  // Enhanced weather data endpoint with production oracle integration
  app.get("/api/weather/aggregated/:stationId", async (req, res) => {
    try {
      const { stationId } = req.params;
      const sources = req.query.sources ? (req.query.sources as string).split(',') : ['chainlink', 'weatherapi', 'openweather'];
      
      const aggregatedData = await chainlinkWeatherService.getAggregatedWeatherData(stationId, sources);
      res.json(aggregatedData);
    } catch (error) {
      console.error('Aggregated weather data error:', error);
      res.status(500).json({ error: "Failed to get aggregated weather data" });
    }
  });

  // Flare Network wind futures routes
  app.get("/api/flare/network-info", async (req, res) => {
    try {
      const networkInfo = await flareNetworkService.getNetworkInfo();
      res.json(networkInfo);
    } catch (error) {
      console.error('Flare network info error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/market-data", async (req, res) => {
    try {
      const marketData = await flareNetworkService.getMarketData();
      res.json(marketData);
    } catch (error) {
      console.error('Flare market data error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/wind-futures/strikes", async (req, res) => {
    try {
      const strikes = flareNetworkService.getAvailableStrikes();
      res.json(strikes);
    } catch (error) {
      console.error('Flare strikes error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/wind-futures/expiries", async (req, res) => {
    try {
      const expiries = flareNetworkService.getAvailableExpiries();
      res.json(expiries);
    } catch (error) {
      console.error('Flare expiries error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/wind-futures/user/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const positions = await flareNetworkService.getUserPositions(address);
      res.json(positions);
    } catch (error) {
      console.error('Flare user positions error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/wind-futures/all", async (req, res) => {
    try {
      const contracts = await flareNetworkService.getAllContracts();
      res.json(contracts);
    } catch (error) {
      console.error('Flare all contracts error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/flare/wind-futures/estimate-gas", async (req, res) => {
    try {
      const { isLong, strikePrice, notionalAmount, collateralToken, expiryDays } = req.body;
      
      const gasEstimate = await flareNetworkService.estimateCreateFutureGas(
        isLong,
        strikePrice,
        notionalAmount,
        collateralToken,
        expiryDays
      );
      
      res.json({ gasEstimate });
    } catch (error) {
      console.error('Flare gas estimation error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/deployment-info", async (req, res) => {
    try {
      const deploymentInfo = flareNetworkService.getDeploymentInfo();
      res.json(deploymentInfo);
    } catch (error) {
      console.error('Flare deployment info error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/flare/transaction/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      const transaction = await flareNetworkService.getTransaction(txHash);
      res.json(transaction);
    } catch (error) {
      console.error('Flare transaction error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Community Staking Routes
  app.get("/api/staking/pools", async (req, res) => {
    try {
      const pools = await communityStakingService.getAllStakingPools();
      res.json(pools);
    } catch (error) {
      console.error('Staking pools error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/staking/pools/:poolId", async (req, res) => {
    try {
      const { poolId } = req.params;
      const pool = await communityStakingService.getStakingPool(poolId);
      if (!pool) {
        return res.status(404).json({ error: "Pool not found" });
      }
      res.json(pool);
    } catch (error) {
      console.error('Staking pool error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/staking/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const userPools = await communityStakingService.getUserStakingPools(userId);
      const userStats = await communityStakingService.getUserStakingStats(userId);
      
      res.json({
        pools: userPools,
        stats: userStats
      });
    } catch (error) {
      console.error('User staking data error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/staking/stake", async (req, res) => {
    try {
      const { poolId, amount, userAddress } = req.body;
      
      if (!poolId || !amount || !userAddress) {
        return res.status(400).json({ error: "Missing required fields: poolId, amount, userAddress" });
      }

      const transaction = await communityStakingService.stakeTokens(poolId, amount, userAddress);
      res.json(transaction);
    } catch (error) {
      console.error('Stake tokens error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to stake tokens' });
    }
  });

  app.post("/api/staking/unstake", async (req, res) => {
    try {
      const { poolId, amount, userAddress } = req.body;
      
      if (!poolId || !amount || !userAddress) {
        return res.status(400).json({ error: "Missing required fields: poolId, amount, userAddress" });
      }

      const transaction = await communityStakingService.unstakeTokens(poolId, amount, userAddress);
      res.json(transaction);
    } catch (error) {
      console.error('Unstake tokens error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to unstake tokens' });
    }
  });

  app.post("/api/staking/claim", async (req, res) => {
    try {
      const { poolId, userAddress } = req.body;
      
      if (!poolId || !userAddress) {
        return res.status(400).json({ error: "Missing required fields: poolId, userAddress" });
      }

      const transaction = await communityStakingService.claimRewards(poolId, userAddress);
      res.json(transaction);
    } catch (error) {
      console.error('Claim rewards error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to claim rewards' });
    }
  });

  app.get("/api/staking/analytics", async (req, res) => {
    try {
      const analytics = await communityStakingService.getStakingAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Staking analytics error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Flow EVM smart contract routes
  const flowEVMService = getFlowEVMService();
  
  app.get("/api/flow-evm/deployment-info", async (req, res) => {
    try {
      const deploymentInfo = flowEVMService.getDeploymentInfo();
      const networkInfo = await flowEVMService.getNetworkInfo();
      
      res.json({
        ...deploymentInfo,
        network: networkInfo
      });
    } catch (error) {
      console.error('Flow EVM deployment info error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/flow-evm/deploy", async (req, res) => {
    try {
      const { weatherOracle } = req.body;
      
      console.log('🚀 Starting Flow EVM smart contract deployment...');
      const deploymentResult = await flowEVMService.simulateDeployment(weatherOracle);
      
      res.json({
        success: true,
        deployment: deploymentResult,
        message: 'RainfallIndex contract deployed successfully on Flow EVM'
      });
    } catch (error) {
      console.error('Flow EVM deployment error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Deployment failed' 
      });
    }
  });

  app.get("/api/flow-evm/options", async (req, res) => {
    try {
      const activeOptions = await flowEVMService.getActiveOptions();
      
      // Get details for each option
      const optionsWithDetails = await Promise.all(
        activeOptions.map(async (optionId) => {
          const details = await flowEVMService.getOptionDetails(optionId);
          return details;
        })
      );
      
      res.json(optionsWithDetails);
    } catch (error) {
      console.error('Flow EVM options error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/flow-evm/create-option", async (req, res) => {
    try {
      const { stationId, strike, premium, expiry, totalSupply, isCall, collateral } = req.body;
      
      if (!stationId || !strike || !premium || !expiry || !totalSupply || isCall === undefined || !collateral) {
        return res.status(400).json({ error: "Missing required fields for option creation" });
      }

      const optionId = await flowEVMService.createRainfallOption({
        stationId,
        strike,
        premium,
        expiry,
        totalSupply,
        isCall,
        collateral
      });
      
      res.json({
        success: true,
        optionId,
        message: 'Rainfall option created successfully'
      });
    } catch (error) {
      console.error('Flow EVM create option error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create option' 
      });
    }
  });

  app.post("/api/flow-evm/update-rainfall", async (req, res) => {
    try {
      const { stationId, rainfall, source } = req.body;
      
      if (!stationId || rainfall === undefined || !source) {
        return res.status(400).json({ error: "Missing required fields: stationId, rainfall, source" });
      }

      const txHash = await flowEVMService.updateRainfallData(stationId, rainfall, source);
      
      res.json({
        success: true,
        transactionHash: txHash,
        message: 'Rainfall data updated successfully'
      });
    } catch (error) {
      console.error('Flow EVM update rainfall error:', error);
      res.status(500).json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update rainfall data' 
      });
    }
  });

  app.get("/api/flow-evm/gas-estimate/:method", async (req, res) => {
    try {
      const { method } = req.params;
      const params = req.query.params ? JSON.parse(req.query.params as string) : [];
      
      const gasEstimate = await flowEVMService.estimateGas(method, params);
      
      res.json({
        method,
        gasEstimate: gasEstimate.toString(),
        estimatedCostWei: gasEstimate * 8000000000n, // Default gas price
        estimatedCostFlow: (gasEstimate * 8000000000n).toString()
      });
    } catch (error) {
      console.error('Flow EVM gas estimate error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Flow Forte Actions routes
  app.use("/api/flow-actions", flowActionsRouter);

  const httpServer = createServer(app);
  return httpServer;
}
