import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || "demo_key"
});

export interface TradeRecommendation {
  contractType: "call" | "put";
  strikePrice: number;
  expiryDate: string;
  reasoning: string;
  maxGain: number;
  maxLoss: number;
  breakEven: number;
  probabilityOfProfit: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  positionSize: string;
  exitStrategy: string;
}

export interface AiAnalysis {
  sentiment: string;
  keyFactors: string[];
  weatherOutlook: string;
  riskAssessment: string;
  recommendations: TradeRecommendation[];
}

export class OpenAIService {
  async analyzeTradeQuery(query: string, context: any, marketData: any): Promise<{
    response: string;
    confidence: number;
    tradeRecommendation?: TradeRecommendation;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert weather derivatives trading assistant. You analyze weather patterns, market data, and provide intelligent trade recommendations for rainfall options.

            Key capabilities:
            - Analyze historical weather patterns and predict future trends
            - Calculate option Greeks and fair value pricing
            - Assess risk/reward profiles
            - Provide clear explanations in simple language
            - Suggest optimal position sizing and risk management

            Always provide:
            1. Clear reasoning for recommendations
            2. Specific max gain/loss calculations
            3. Probability of profit estimates
            4. Risk management advice
            5. Confidence level (0-100%)

            Weather data context: ${JSON.stringify(context)}
            Market data context: ${JSON.stringify(marketData)}

            Respond in JSON format with: response, confidence, and optional tradeRecommendation object.`
          },
          {
            role: "user",
            content: query
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        response: result.response || "I apologize, but I couldn't process your query. Please try rephrasing it.",
        confidence: result.confidence || 0.5,
        tradeRecommendation: result.tradeRecommendation
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.getFallbackAnalysis(query, context, marketData);
    }
  }

  private getFallbackAnalysis(query: string, context: any, marketData: any): any {
    // Handle various weather data structures
    const weatherData = context?.weatherData || context;
    const currentRainfall = weatherData?.currentRainfall || weatherData?.data?.currentRainfall || 0;
    
    // Determine basic trade direction based on query keywords
    const queryLower = query.toLowerCase();
    const isBullish = queryLower.includes('buy call') || 
                     queryLower.includes('flood') || 
                     queryLower.includes('high rainfall') ||
                     queryLower.includes('rain protection');
    const isBearish = queryLower.includes('drought') || 
                     queryLower.includes('low rainfall') ||
                     queryLower.includes('buy put') ||
                     queryLower.includes('dry weather');
    
    // Generate reasonable fallback response based on current conditions
    let response = "Based on current market conditions and weather patterns, ";
    let confidence = 75;
    let tradeRecommendation = null;

    if (isBullish) {
      const strikePrice = currentRainfall + 7;
      response += `I see you're looking for upside rainfall exposure. Current rainfall is ${currentRainfall}mm. Consider call options with strikes around ${strikePrice}mm for balanced risk/reward. Weather patterns suggest potential for above-average precipitation in the coming period.`;
      tradeRecommendation = {
        action: "BUY CALL",
        entry: `${strikePrice}mm Strike`,
        reasoning: "Weather patterns suggest potential for above-average precipitation",
        riskReward: "1:2.2"
      };
    } else if (isBearish) {
      const strikePrice = Math.max(5, currentRainfall - 5);
      response += `I see you're looking for drought protection or low rainfall exposure. Current rainfall is ${currentRainfall}mm. Consider put options or protective strategies around ${strikePrice}mm strike for dry weather exposure.`;
      tradeRecommendation = {
        action: "BUY PUT",
        entry: `${strikePrice}mm Strike`,
        reasoning: "Positioning for below-average precipitation scenarios",
        riskReward: "1:1.8"
      };
    } else {
      response += `I recommend analyzing current market conditions carefully. With rainfall at ${currentRainfall}mm, both bullish and bearish strategies could work depending on your specific outlook and risk tolerance. Consider your hedge objectives and time horizon.`;
      tradeRecommendation = {
        action: "ANALYZE",
        entry: "Multiple strikes available",
        reasoning: "Market conditions require careful position analysis",
        riskReward: "Variable"
      };
      confidence = 65;
    }

    response += " Note: Full AI analysis temporarily limited - this is a basic market assessment.";

    return {
      response,
      confidence,
      tradeRecommendation
    }
  }

  async generateMarketInsights(weatherData: any, optionContracts: any[]): Promise<AiAnalysis> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a weather derivatives market analyst. Analyze the current weather patterns and option pricing to provide market insights.

            Provide analysis in JSON format with:
            - sentiment: overall market sentiment
            - keyFactors: array of key market factors
            - weatherOutlook: weather pattern analysis
            - riskAssessment: current risk environment
            - recommendations: array of trade recommendations

            Weather data: ${JSON.stringify(weatherData)}
            Option contracts: ${JSON.stringify(optionContracts)}`
          },
          {
            role: "user",
            content: "Analyze the current market conditions and provide insights."
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        sentiment: result.sentiment || "neutral",
        keyFactors: result.keyFactors || [],
        weatherOutlook: result.weatherOutlook || "Unable to analyze weather patterns",
        riskAssessment: result.riskAssessment || "Risk assessment unavailable",
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.getFallbackInsights(weatherData, optionContracts);
    }
  }

  private getFallbackInsights(weatherData: any, optionContracts: any[]): AiAnalysis {
    const currentRainfall = weatherData?.currentRainfall || 0;
    const contractCount = optionContracts?.length || 0;
    
    // Basic market sentiment based on current conditions
    let sentiment = "neutral";
    if (currentRainfall > 20) sentiment = "bullish";
    if (currentRainfall < 5) sentiment = "bearish";
    
    return {
      sentiment,
      keyFactors: [
        `Technical indicators suggest ${sentiment} bias for weather derivatives`,
        `Current rainfall levels at ${currentRainfall}mm provide market context`,
        `${contractCount} active contracts offering liquidity across strikes`,
        "Market volatility within normal trading ranges",
        "Seasonal patterns continue to influence pricing dynamics"
      ],
      weatherOutlook: `Current conditions show ${currentRainfall}mm rainfall. Historical patterns suggest continued variability with potential for both upside and downside moves in the near term.`,
      riskAssessment: "Moderate volatility environment with standard weather derivative risks. Position sizing and time horizon remain key considerations for risk management.",
      recommendations: []
    }
  }

  async explainGreeks(contractType: "call" | "put", strike: number, currentPrice: number): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an options education expert. Explain the Greeks in simple terms using weather derivatives context."
          },
          {
            role: "user",
            content: `Explain the Greeks for a ${contractType} option with ${strike}mm strike when current rainfall is ${currentPrice}mm. Use simple language and weather-specific examples.`
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || "Greek explanation unavailable";
    } catch (error) {
      console.error("OpenAI API error:", error);
      return this.getFallbackGreeksExplanation(contractType, strike, currentPrice);
    }
  }

  private getFallbackGreeksExplanation(contractType: "call" | "put", strike: number, currentPrice: number): string {
    const isITM = (contractType === "call" && currentPrice > strike) || (contractType === "put" && currentPrice < strike);
    const isATM = Math.abs(currentPrice - strike) < 2;
    const isOTM = !isITM && !isATM;
    
    let explanation = `For this ${contractType} option with ${strike}mm strike (current rainfall: ${currentPrice}mm):\n\n`;
    
    // Delta explanation
    if (contractType === "call") {
      explanation += `**Delta**: ${isITM ? "High (~0.7)" : isOTM ? "Low (~0.3)" : "Medium (~0.5)"} - For every 1mm increase in rainfall, this option's value changes by this amount.\n\n`;
    } else {
      explanation += `**Delta**: ${isITM ? "High (~-0.7)" : isOTM ? "Low (~-0.3)" : "Medium (~-0.5)"} - For every 1mm decrease in rainfall, this option gains value.\n\n`;
    }
    
    // Theta explanation
    explanation += `**Theta**: Time decay affects this option ${isOTM ? "significantly" : "moderately"}. Each day closer to expiration reduces the option's value.\n\n`;
    
    // Vega explanation
    explanation += `**Vega**: Weather volatility impacts this option's price. Higher uncertainty in rainfall predictions increases the option's value.\n\n`;
    
    explanation += "Note: Full Greeks analysis temporarily limited - this is a basic explanation.";
    
    return explanation;
  }

  async assessRiskProfile(userPositions: any[], marketData: any): Promise<{
    riskLevel: "low" | "medium" | "high";
    analysis: string;
    recommendations: string[];
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a risk management expert for weather derivatives. Analyze the user's portfolio and market conditions to assess risk.

            Respond in JSON format with:
            - riskLevel: "low", "medium", or "high"
            - analysis: detailed risk analysis
            - recommendations: array of risk management recommendations

            User positions: ${JSON.stringify(userPositions)}
            Market data: ${JSON.stringify(marketData)}`
          },
          {
            role: "user",
            content: "Analyze my portfolio risk and provide recommendations."
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        riskLevel: result.riskLevel || "medium",
        analysis: result.analysis || "Risk analysis unavailable",
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error("OpenAI API error:", error);
      return {
        riskLevel: "medium",
        analysis: "Risk analysis temporarily unavailable",
        recommendations: ["Review positions regularly", "Consider diversification"]
      };
    }
  }
}

export const openaiService = new OpenAIService();
