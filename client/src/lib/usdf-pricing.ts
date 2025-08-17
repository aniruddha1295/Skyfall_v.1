// USDF (Flow USD) pricing integration with Chainlink price feeds
import { useState, useEffect } from 'react';

// Flow EVM testnet USDF contract address (mock for development)
export const USDF_CONTRACT_ADDRESS = "0x231cc703f59e1f123e4a76b4d1d5a8e2c4e4e5f6";

// Chainlink price feed addresses on Flow EVM (mock addresses for development)
const PRICE_FEEDS = {
  ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  FLOW_USD: "0x68d0f6d5c78d2c4c8a1c3e3b2a0b5f4e3d2c1b0a",
  USDF_USD: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"
};

export interface USDFPricing {
  ethToUsdf: number;
  flowToUsdf: number;
  usdfToUsd: number;
  lastUpdated: Date;
}

export interface CurrencyToggle {
  showUsdf: boolean;
  primaryCurrency: 'ETH' | 'FLOW' | 'USDF';
}

class USDFPriceService {
  private static instance: USDFPriceService;
  private pricing: USDFPricing = {
    ethToUsdf: 3250.50, // Mock rate: 1 ETH = 3250.50 USDF
    flowToUsdf: 0.85,   // Mock rate: 1 FLOW = 0.85 USDF
    usdfToUsd: 1.002,   // Mock rate: 1 USDF = 1.002 USD (slight premium)
    lastUpdated: new Date()
  };
  private listeners: Set<(pricing: USDFPricing) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPriceUpdates();
  }

  static getInstance(): USDFPriceService {
    if (!USDFPriceService.instance) {
      USDFPriceService.instance = new USDFPriceService();
    }
    return USDFPriceService.instance;
  }

  private startPriceUpdates() {
    // Update prices every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.fetchLatestPrices();
    }, 30000);
    
    // Initial fetch
    this.fetchLatestPrices();
  }

  private async fetchLatestPrices() {
    try {
      // Fetch real USDF pricing from Chainlink price feeds
      const response = await fetch('/api/usdf/pricing');
      if (response.ok) {
        const chainlinkPricing = await response.json();
        this.pricing = {
          ethToUsdf: chainlinkPricing.ethToUsdf,
          flowToUsdf: chainlinkPricing.flowToUsdf,
          usdfToUsd: chainlinkPricing.usdfToUsd,
          lastUpdated: new Date(chainlinkPricing.lastUpdated)
        };
      } else {
        // Fallback to previous pricing if API fails
        console.warn('Failed to fetch Chainlink USDF pricing, using cached data');
      }

      // Notify all listeners
      this.listeners.forEach(callback => callback(this.pricing));
    } catch (error) {
      console.warn('Failed to fetch USDF prices from Chainlink:', error);
      // Keep using existing pricing in case of network errors
    }
  }

  getPricing(): USDFPricing {
    return { ...this.pricing };
  }

  subscribe(callback: (pricing: USDFPricing) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current pricing
    callback(this.getPricing());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Convert ETH amount to USDF
  ethToUsdf(ethAmount: number): number {
    return ethAmount * this.pricing.ethToUsdf;
  }

  // Convert FLOW amount to USDF
  flowToUsdf(flowAmount: number): number {
    return flowAmount * this.pricing.flowToUsdf;
  }

  // Convert USDF amount to USD
  usdfToUsd(usdfAmount: number): number {
    return usdfAmount * this.pricing.usdfToUsd;
  }

  // Convert any amount to USDF based on currency
  convertToUsdf(amount: number, fromCurrency: 'ETH' | 'FLOW' | 'USD'): number {
    switch (fromCurrency) {
      case 'ETH':
        return this.ethToUsdf(amount);
      case 'FLOW':
        return this.flowToUsdf(amount);
      case 'USD':
        return amount / this.pricing.usdfToUsd;
      default:
        return amount;
    }
  }

  // Convert USDF to any currency
  convertFromUsdf(usdfAmount: number, toCurrency: 'ETH' | 'FLOW' | 'USD'): number {
    switch (toCurrency) {
      case 'ETH':
        return usdfAmount / this.pricing.ethToUsdf;
      case 'FLOW':
        return usdfAmount / this.pricing.flowToUsdf;
      case 'USD':
        return this.usdfToUsd(usdfAmount);
      default:
        return usdfAmount;
    }
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners.clear();
  }
}

// React hook for USDF pricing
export function useUSDFPricing() {
  const [pricing, setPricing] = useState<USDFPricing>({
    ethToUsdf: 0,
    flowToUsdf: 0,
    usdfToUsd: 0,
    lastUpdated: new Date()
  });

  useEffect(() => {
    const service = USDFPriceService.getInstance();
    const unsubscribe = service.subscribe(setPricing);
    return unsubscribe;
  }, []);

  return {
    pricing,
    ethToUsdf: (amount: number) => USDFPriceService.getInstance().ethToUsdf(amount),
    flowToUsdf: (amount: number) => USDFPriceService.getInstance().flowToUsdf(amount),
    usdfToUsd: (amount: number) => USDFPriceService.getInstance().usdfToUsd(amount),
    convertToUsdf: (amount: number, from: 'ETH' | 'FLOW' | 'USD') => 
      USDFPriceService.getInstance().convertToUsdf(amount, from),
    convertFromUsdf: (usdfAmount: number, to: 'ETH' | 'FLOW' | 'USD') => 
      USDFPriceService.getInstance().convertFromUsdf(usdfAmount, to),
  };
}

// React hook for currency toggle functionality
export function useCurrencyToggle() {
  const [currencyToggle, setCurrencyToggle] = useState<CurrencyToggle>({
    showUsdf: false,
    primaryCurrency: 'ETH'
  });

  const toggleUsdf = () => {
    setCurrencyToggle(prev => ({
      ...prev,
      showUsdf: !prev.showUsdf
    }));
  };

  const setPrimaryCurrency = (currency: 'ETH' | 'FLOW' | 'USDF') => {
    setCurrencyToggle(prev => ({
      ...prev,
      primaryCurrency: currency
    }));
  };

  return {
    ...currencyToggle,
    toggleUsdf,
    setPrimaryCurrency
  };
}

// Utility function to format currency amounts
export function formatCurrency(
  amount: number, 
  currency: 'ETH' | 'FLOW' | 'USDF' | 'USD',
  decimals: number = 2,
  showUnit: boolean = false
): string {
  const formatted = amount.toFixed(decimals);
  
  if (!showUnit) {
    return formatted;
  }
  
  switch (currency) {
    case 'ETH':
      return `${formatted} ETH`;
    case 'FLOW':
      return `${formatted} FLOW`;
    case 'USDF':
      return `${formatted} USDF`;
    case 'USD':
      return `$${formatted}`;
    default:
      return formatted;
  }
}

// Format dual currency display (original + USDF)
export function formatDualCurrency(
  amount: number,
  originalCurrency: 'ETH' | 'FLOW',
  usdfAmount: number,
  showBoth: boolean = true,
  showUnit: boolean = false
): string {
  const original = formatCurrency(amount, originalCurrency, 2, showUnit);
  const usdf = formatCurrency(usdfAmount, 'USDF', 2, showUnit);
  
  if (!showBoth) {
    return usdf;
  }
  
  return showUnit ? `${original} (${usdf})` : `${original} (${usdf})`;
}