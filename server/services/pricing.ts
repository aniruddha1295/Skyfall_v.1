export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionPrice {
  premium: number;
  Greeks: Greeks;
  fairValue: number;
  impliedVolatility: number;
}

export class PricingService {
  /**
   * Monte Carlo simulation for weather option pricing
   */
  async calculateOptionPrice(
    contractType: "call" | "put",
    strike: number,
    timeToExpiry: number, // in days
    currentValue: number,
    volatility: number,
    riskFreeRate: number = 0.05,
    simulations: number = 10000
  ): Promise<OptionPrice> {
    
    const dt = 1 / 365; // daily time step
    const drift = riskFreeRate - 0.5 * volatility * volatility;
    let payoffSum = 0;
    
    // Monte Carlo simulation
    for (let i = 0; i < simulations; i++) {
      let price = currentValue;
      
      // Simulate price path
      for (let t = 0; t < timeToExpiry; t++) {
        const randomShock = this.generateRandomNormal();
        price = price * Math.exp(drift * dt + volatility * Math.sqrt(dt) * randomShock);
      }
      
      // Calculate payoff
      let payoff = 0;
      if (contractType === "call") {
        payoff = Math.max(price - strike, 0);
      } else {
        payoff = Math.max(strike - price, 0);
      }
      
      payoffSum += payoff;
    }
    
    const premium = (payoffSum / simulations) * Math.exp(-riskFreeRate * timeToExpiry / 365);
    
    // Calculate Greeks using finite difference method
    const Greeks = this.calculateGreeks(
      contractType,
      strike,
      timeToExpiry,
      currentValue,
      volatility,
      riskFreeRate
    );
    
    return {
      premium,
      Greeks,
      fairValue: premium,
      impliedVolatility: volatility
    };
  }

  private calculateGreeks(
    contractType: "call" | "put",
    strike: number,
    timeToExpiry: number,
    currentValue: number,
    volatility: number,
    riskFreeRate: number
  ): Greeks {
    const dS = currentValue * 0.01; // 1% move for delta calculation
    const dT = 1; // 1 day for theta calculation
    const dV = volatility * 0.01; // 1% volatility move for vega
    
    // Base price
    const basePrice = this.blackScholesApproximation(
      contractType, strike, timeToExpiry, currentValue, volatility, riskFreeRate
    );
    
    // Delta calculation
    const priceUp = this.blackScholesApproximation(
      contractType, strike, timeToExpiry, currentValue + dS, volatility, riskFreeRate
    );
    const priceDown = this.blackScholesApproximation(
      contractType, strike, timeToExpiry, currentValue - dS, volatility, riskFreeRate
    );
    const delta = (priceUp - priceDown) / (2 * dS);
    
    // Gamma calculation
    const gamma = (priceUp - 2 * basePrice + priceDown) / (dS * dS);
    
    // Theta calculation
    const priceTheta = this.blackScholesApproximation(
      contractType, strike, timeToExpiry - dT, currentValue, volatility, riskFreeRate
    );
    const theta = (priceTheta - basePrice) / dT;
    
    // Vega calculation
    const priceVega = this.blackScholesApproximation(
      contractType, strike, timeToExpiry, currentValue, volatility + dV, riskFreeRate
    );
    const vega = (priceVega - basePrice) / dV;
    
    return {
      delta: parseFloat(delta.toFixed(4)),
      gamma: parseFloat(gamma.toFixed(4)),
      theta: parseFloat(theta.toFixed(4)),
      vega: parseFloat(vega.toFixed(4))
    };
  }

  private blackScholesApproximation(
    contractType: "call" | "put",
    strike: number,
    timeToExpiry: number,
    currentValue: number,
    volatility: number,
    riskFreeRate: number
  ): number {
    const T = timeToExpiry / 365;
    const d1 = (Math.log(currentValue / strike) + (riskFreeRate + 0.5 * volatility * volatility) * T) / 
              (volatility * Math.sqrt(T));
    const d2 = d1 - volatility * Math.sqrt(T);
    
    const N = (x: number) => 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    
    if (contractType === "call") {
      return currentValue * N(d1) - strike * Math.exp(-riskFreeRate * T) * N(d2);
    } else {
      return strike * Math.exp(-riskFreeRate * T) * N(-d2) - currentValue * N(-d1);
    }
  }

  private generateRandomNormal(): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  private erf(x: number): number {
    // Error function approximation
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;
    
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * Calculate implied volatility from historical rainfall data
   */
  calculateImpliedVolatility(historicalData: number[]): number {
    if (historicalData.length < 2) return 0.3; // default 30%
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      if (historicalData[i-1] > 0) {
        returns.push(Math.log(historicalData[i] / historicalData[i-1]));
      }
    }
    
    if (returns.length < 2) return 0.3;
    
    // Calculate standard deviation
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 365); // annualized
    
    return Math.max(0.1, Math.min(2.0, volatility)); // cap between 10% and 200%
  }

  /**
   * Calculate break-even points for options
   */
  calculateBreakEven(
    contractType: "call" | "put",
    strike: number,
    premium: number
  ): number {
    if (contractType === "call") {
      return strike + premium;
    } else {
      return strike - premium;
    }
  }

  /**
   * Calculate maximum profit/loss for options
   */
  calculateMaxProfitLoss(
    contractType: "call" | "put",
    strike: number,
    premium: number
  ): { maxProfit: number; maxLoss: number } {
    if (contractType === "call") {
      return {
        maxProfit: Infinity, // unlimited upside
        maxLoss: premium
      };
    } else {
      return {
        maxProfit: strike - premium,
        maxLoss: premium
      };
    }
  }

  /**
   * Estimate probability of profit based on historical data
   */
  estimateProbabilityOfProfit(
    contractType: "call" | "put",
    strike: number,
    premium: number,
    historicalData: number[]
  ): number {
    if (historicalData.length < 10) return 0.5; // default 50%
    
    const breakEven = this.calculateBreakEven(contractType, strike, premium);
    let profitable = 0;
    
    for (const value of historicalData) {
      if (contractType === "call" && value > breakEven) {
        profitable++;
      } else if (contractType === "put" && value < breakEven) {
        profitable++;
      }
    }
    
    return profitable / historicalData.length;
  }
}

export const pricingService = new PricingService();
