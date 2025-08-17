import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const weatherStations = pgTable("weather_stations", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull().unique(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 6 }).notNull(),
  active: boolean("active").default(true),
});

export const weatherData = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  stationId: text("station_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  rainfall: decimal("rainfall", { precision: 6, scale: 2 }),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  windSpeed: decimal("wind_speed", { precision: 5, scale: 2 }),
  pressure: decimal("pressure", { precision: 7, scale: 2 }),
  dataHash: text("data_hash"),
  verified: boolean("verified").default(false),
});

export const optionContracts = pgTable("option_contracts", {
  id: serial("id").primaryKey(),
  contractId: text("contract_id").notNull().unique(),
  underlying: text("underlying").notNull(), // e.g., "Dallas_TX_Rainfall"
  contractType: text("contract_type").notNull(), // "call" or "put"
  strikePrice: decimal("strike_price", { precision: 6, scale: 2 }).notNull(),
  premium: decimal("premium", { precision: 8, scale: 4 }).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  totalSupply: integer("total_supply").notNull(),
  availableSupply: integer("available_supply").notNull(),
  settlementPrice: decimal("settlement_price", { precision: 6, scale: 2 }),
  isSettled: boolean("is_settled").default(false),
  Greeks: jsonb("greeks"), // {delta, gamma, theta, vega}
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPositions = pgTable("user_positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contractId: text("contract_id").notNull(),
  quantity: integer("quantity").notNull(),
  entryPrice: decimal("entry_price", { precision: 8, scale: 4 }).notNull(),
  currentValue: decimal("current_value", { precision: 8, scale: 4 }),
  pnl: decimal("pnl", { precision: 8, scale: 4 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const communityPools = pgTable("community_pools", {
  id: serial("id").primaryKey(),
  poolId: text("pool_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  underlying: text("underlying").notNull(),
  triggerCondition: text("trigger_condition").notNull(),
  totalValueLocked: decimal("total_value_locked", { precision: 12, scale: 2 }).default("0"),
  memberCount: integer("member_count").default(0),
  nextPayoutDate: timestamp("next_payout_date"),
  payoutMultiplier: decimal("payout_multiplier", { precision: 4, scale: 2 }).default("1.0"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const poolMemberships = pgTable("pool_memberships", {
  id: serial("id").primaryKey(),
  poolId: text("pool_id").notNull(),
  userId: integer("user_id").notNull(),
  stakeAmount: decimal("stake_amount", { precision: 12, scale: 2 }).notNull(),
  isEligible: boolean("is_eligible").default(true),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const governanceProposals = pgTable("governance_proposals", {
  id: serial("id").primaryKey(),
  proposalId: text("proposal_id").notNull().unique(),
  poolId: text("pool_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  proposalType: text("proposal_type").notNull(), // "threshold_change", "payout_rules", etc.
  proposedValue: text("proposed_value"),
  votesFor: integer("votes_for").default(0),
  votesAgainst: integer("votes_against").default(0),
  totalVotes: integer("total_votes").default(0),
  status: text("status").default("active"), // "active", "passed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const governanceVotes = pgTable("governance_votes", {
  id: serial("id").primaryKey(),
  proposalId: text("proposal_id").notNull(),
  userId: integer("user_id").notNull(),
  vote: text("vote").notNull(), // "for" or "against"
  votingPower: integer("voting_power").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payoutHistory = pgTable("payout_history", {
  id: serial("id").primaryKey(),
  poolId: text("pool_id"),
  contractId: text("contract_id"),
  eventDate: timestamp("event_date").notNull(),
  triggerCondition: text("trigger_condition").notNull(),
  actualValue: decimal("actual_value", { precision: 6, scale: 2 }),
  totalPayout: decimal("total_payout", { precision: 12, scale: 2 }).notNull(),
  recipientCount: integer("recipient_count").notNull(),
  distributionMethod: text("distribution_method").notNull(),
  isSettled: boolean("is_settled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInteractions = pgTable("ai_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  sessionId: text("session_id").notNull(),
  query: text("query").notNull(),
  response: text("response").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  tradeRecommendation: jsonb("trade_recommendation"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const automatedTradingRules = pgTable("automated_trading_rules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  ruleId: text("rule_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  conditions: jsonb("conditions").notNull(), // Weather conditions, price thresholds, etc.
  actions: jsonb("actions").notNull(), // Trade actions to execute
  riskLimits: jsonb("risk_limits"), // Position size, max loss, etc.
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  totalProfit: decimal("total_profit", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const automatedTradingExecutions = pgTable("automated_trading_executions", {
  id: serial("id").primaryKey(),
  ruleId: text("rule_id").notNull(),
  executionId: text("execution_id").notNull().unique(),
  triggeredBy: jsonb("triggered_by").notNull(), // What conditions triggered this
  tradeDetails: jsonb("trade_details").notNull(), // Contract, quantity, price, etc.
  result: text("result").notNull(), // success, failed, partial
  profit: decimal("profit", { precision: 12, scale: 2 }),
  aiAnalysis: jsonb("ai_analysis"), // AI reasoning for the trade
  executedAt: timestamp("executed_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertWeatherStationSchema = createInsertSchema(weatherStations).pick({
  stationId: true,
  city: true,
  state: true,
  country: true,
  latitude: true,
  longitude: true,
});

export const insertWeatherDataSchema = createInsertSchema(weatherData).pick({
  stationId: true,
  timestamp: true,
  rainfall: true,
  temperature: true,
  humidity: true,
  windSpeed: true,
  pressure: true,
  dataHash: true,
});

export const insertOptionContractSchema = createInsertSchema(optionContracts).pick({
  contractId: true,
  underlying: true,
  contractType: true,
  strikePrice: true,
  premium: true,
  expiryDate: true,
  totalSupply: true,
  availableSupply: true,
  Greeks: true,
});

export const insertCommunityPoolSchema = createInsertSchema(communityPools).pick({
  poolId: true,
  name: true,
  description: true,
  underlying: true,
  triggerCondition: true,
  nextPayoutDate: true,
  payoutMultiplier: true,
});

export const insertPoolMembershipSchema = createInsertSchema(poolMemberships).pick({
  poolId: true,
  userId: true,
  stakeAmount: true,
});

export const insertGovernanceProposalSchema = createInsertSchema(governanceProposals).pick({
  proposalId: true,
  poolId: true,
  title: true,
  description: true,
  proposalType: true,
  proposedValue: true,
  expiresAt: true,
});

export const insertAiInteractionSchema = createInsertSchema(aiInteractions).pick({
  userId: true,
  sessionId: true,
  query: true,
  response: true,
  confidence: true,
  tradeRecommendation: true,
});

export const insertAutomatedTradingRuleSchema = createInsertSchema(automatedTradingRules).pick({
  userId: true,
  ruleId: true,
  name: true,
  description: true,
  isActive: true,
  conditions: true,
  actions: true,
  riskLimits: true,
});

export const insertAutomatedTradingExecutionSchema = createInsertSchema(automatedTradingExecutions).pick({
  ruleId: true,
  executionId: true,
  triggeredBy: true,
  tradeDetails: true,
  result: true,
  profit: true,
  aiAnalysis: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type WeatherStation = typeof weatherStations.$inferSelect;
export type InsertWeatherStation = z.infer<typeof insertWeatherStationSchema>;
export type WeatherData = typeof weatherData.$inferSelect;
export type InsertWeatherData = z.infer<typeof insertWeatherDataSchema>;
export type OptionContract = typeof optionContracts.$inferSelect;
export type InsertOptionContract = z.infer<typeof insertOptionContractSchema>;
export type UserPosition = typeof userPositions.$inferSelect;
export type CommunityPool = typeof communityPools.$inferSelect;
export type InsertCommunityPool = z.infer<typeof insertCommunityPoolSchema>;
export type PoolMembership = typeof poolMemberships.$inferSelect;
export type InsertPoolMembership = z.infer<typeof insertPoolMembershipSchema>;
export type GovernanceProposal = typeof governanceProposals.$inferSelect;
export type InsertGovernanceProposal = z.infer<typeof insertGovernanceProposalSchema>;
export type GovernanceVote = typeof governanceVotes.$inferSelect;
export type PayoutHistory = typeof payoutHistory.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;
export type AutomatedTradingRule = typeof automatedTradingRules.$inferSelect;
export type InsertAutomatedTradingRule = z.infer<typeof insertAutomatedTradingRuleSchema>;
export type AutomatedTradingExecution = typeof automatedTradingExecutions.$inferSelect;
export type InsertAutomatedTradingExecution = z.infer<typeof insertAutomatedTradingExecutionSchema>;
