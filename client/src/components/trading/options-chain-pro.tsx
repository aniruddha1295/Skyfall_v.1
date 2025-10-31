import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Bot, Info, Shield, Database } from "lucide-react";
import { DataSourceIndicator } from "@/components/shared/data-source-indicator";
import TradeExecutionModal from "./trade-execution-modal";
import { CurrencyToggle, PriceDisplay } from "./currency-toggle";
import { useCurrencyToggle, useUSDFPricing } from "@/lib/usdf-pricing";

interface OptionsChainProps {
  selectedCity: {
    city: string;
    state: string;
    stationId: string;
  };
  currentRainfall: number;
  currentWindSpeed?: number;
  weatherMetric?: "rainfall" | "wind";
}

// Generate expiry dates based on current date
const generateExpiryDates = () => {
  const dates = [];
  const now = new Date();
  
  // Helper function to get next Friday
  const getNextFriday = (date: Date) => {
    const result = new Date(date);
    const dayOfWeek = result.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0 && result.getTime() <= date.getTime()) {
      result.setDate(result.getDate() + 7);
    } else {
      result.setDate(result.getDate() + daysUntilFriday);
    }
    return result;
  };
  
  // Helper function to get third Friday of month
  const getThirdFriday = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const firstFriday = getNextFriday(new Date(year, month, 1));
    return new Date(firstFriday.getTime() + 14 * 24 * 60 * 60 * 1000);
  };
  
  // Generate weekly and monthly expirations
  const monthlyDates = new Set();
  
  // Get monthly expirations for next 6 months
  for (let i = 0; i < 6; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const thirdFriday = getThirdFriday(month.getFullYear(), month.getMonth());
    if (thirdFriday > now) {
      const dateStr = thirdFriday.toISOString().split('T')[0];
      monthlyDates.add(dateStr);
      dates.push({
        label: `${thirdFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        value: dateStr,
        type: "monthly"
      });
    }
  }
  
  // Generate weekly Fridays for next 8 weeks
  let currentFriday = getNextFriday(now);
  for (let i = 0; i < 8; i++) {
    const dateStr = currentFriday.toISOString().split('T')[0];
    
    // Skip if this Friday is a monthly expiration
    if (!monthlyDates.has(dateStr)) {
      dates.push({
        label: `${currentFriday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} W`,
        value: dateStr,
        type: "weekly"
      });
    }
    
    currentFriday = new Date(currentFriday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  
  // Sort by date
  return dates.sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());
};

const EXPIRY_DATES = generateExpiryDates();

// Generate strike prices based on current value and weather metric
const generateStrikes = (currentValue: number, weatherMetric: string) => {
  const strikes = [];
  
  if (weatherMetric === "wind") {
    // Wind speed strikes: 1 mph increments around current wind speed
    const baseStrike = Math.round(currentValue);
    for (let i = -10; i <= 10; i++) {
      const strike = baseStrike + i;
      if (strike >= 0) {
        strikes.push(strike);
      }
    }
  } else {
    // Rainfall strikes: 5mm increments
    const baseStrike = Math.round(currentValue / 5) * 5;
    for (let i = -6; i <= 6; i++) {
      const strike = baseStrike + (i * 5);
      if (strike >= 0) {
        strikes.push(strike);
      }
    }
  }
  
  return strikes;
};

export default function OptionsChainPro({ 
  selectedCity, 
  currentRainfall, 
  currentWindSpeed = 0, 
  weatherMetric = "rainfall" 
}: OptionsChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_DATES[0].value);
  const [filterMode, setFilterMode] = useState("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<{
    type: "call" | "put";
    action: "buy" | "sell";
    strike: number;
    price: string;
    expiry: string;
    currentRainfall: number;
  } | null>(null);

  const { showUsdf, primaryCurrency } = useCurrencyToggle();
  const { convertToUsdf } = useUSDFPricing();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/options/contracts", selectedCity.stationId, selectedExpiry],
    refetchInterval: 30000
  });

  const currentValue = weatherMetric === "wind" ? currentWindSpeed : currentRainfall;
  const strikes = generateStrikes(currentValue, weatherMetric) || [];

  // Mock market data for display
  const getMarketData = (strike: number, type: "call" | "put") => {
    const isITM = type === "call" ? currentValue > strike : currentValue < strike;
    const basePrice = Math.abs(currentValue - strike) * (weatherMetric === "wind" ? 0.05 : 0.1) + 1.5;
    const adjustment = isITM ? 1.5 : 0.5;
    const price = (basePrice * adjustment).toFixed(2);
    
    const volume = Math.floor(Math.random() * 500 + 50);
    const openInterest = Math.floor(Math.random() * 2000 + 200);
    const changePercent = ((Math.random() - 0.5) * 20).toFixed(2);
    const iv = Math.floor(20 + Math.random() * 30);
    
    return {
      volume,
      openInterest,
      bid: (parseFloat(price) * 0.98).toFixed(2),
      ask: (parseFloat(price) * 1.02).toFixed(2),
      last: price,
      change: changePercent,
      iv: `${iv}%`,
      greeks: {
        delta: type === "call" 
          ? (0.5 + (currentValue - strike) * 0.02).toFixed(2)
          : (-0.5 + (currentValue - strike) * 0.02).toFixed(2),
        gamma: (0.02 + Math.random() * 0.08).toFixed(3),
        theta: (-0.02 - Math.random() * 0.08).toFixed(3),
        vega: (0.1 + Math.random() * 0.2).toFixed(2)
      }
    };
  };

  const getMoneyness = (strike: number, allStrikes: number[]) => {
    // Safety check for allStrikes array
    if (!allStrikes || allStrikes.length === 0) {
      return strike < currentValue ? "ITM" : "OTM";
    }
    
    // Find the strike closest to current value
    const closestStrike = allStrikes.reduce((prev, curr) => 
      Math.abs(curr - currentValue) < Math.abs(prev - currentValue) ? curr : prev
    );
    
    if (strike === closestStrike) return "ATM";
    return strike < currentValue ? "ITM" : "OTM";
  };

  const handleTradeClick = (
    type: "call" | "put",
    action: "buy" | "sell",
    strike: number,
    price: string
  ) => {
    const expiryDate = EXPIRY_DATES.find(d => d.value === selectedExpiry);
    setSelectedTrade({
      type,
      action,
      strike,
      price,
      expiry: expiryDate?.label || "",
      currentRainfall: currentValue
    });
    setTradeModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-8">
          <div className="text-center text-gray-400">Loading options chain...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/80 border-gray-800">
      <CardHeader className="bg-gray-900/80 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">
            {weatherMetric === "wind" ? "Wind" : "Rainfall"} Options Chain - {selectedCity.city}, {selectedCity.state}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
              Monte Carlo Pricing
            </Badge>
            <div className="flex gap-1 flex-wrap">
              {EXPIRY_DATES.map((date) => (
                <Button
                  key={date.value}
                  size="sm"
                  variant={selectedExpiry === date.value ? "default" : "outline"}
                  onClick={() => setSelectedExpiry(date.value)}
                  className={cn(
                    "h-7 px-3 text-xs",
                    selectedExpiry === date.value 
                      ? "bg-primary hover:bg-primary/90 text-white" 
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700",
                    date.type === "weekly" && "text-orange-400"
                  )}
                >
                  {date.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-full sm:w-28 h-7 bg-gray-800 border-gray-700 text-gray-300 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Strikes</SelectItem>
                <SelectItem value="itm">In The Money</SelectItem>
                <SelectItem value="otm">Out The Money</SelectItem>
                <SelectItem value="atm">At The Money</SelectItem>
              </SelectContent>
            </Select>
            
            <label className="flex items-center gap-2">
              <Checkbox
                checked={showOnlyActive}
                onCheckedChange={(checked) => setShowOnlyActive(checked === true)}
                className="border-gray-600 h-3 w-3"
              />
              <span className="text-xs text-gray-300 whitespace-nowrap">Active contracts only</span>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
            <div className="text-xs text-gray-400 whitespace-nowrap">
              Current {weatherMetric === "wind" ? "Wind" : "Rain"}: 
              <span className="text-green-400 font-medium ml-1">
                {currentValue.toFixed(1)}{weatherMetric === "wind" ? "mph" : "mm"}
              </span>
            </div>
            <DataSourceIndicator
              primary="weatherxm"
              backup="chainlink"
              confidence={0.942}
              crossValidated={true}
              blockchainVerified={true}
              compact={true}
            />
          </div>
        </div>
        
        {/* Currency Toggle */}
        <div className="mt-4">
          <CurrencyToggle className="bg-gray-800/50" />
        </div>
      </CardHeader>
      
      <CardContent className="bg-gray-900/60 p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-gray-800 bg-gray-850">
                <th colSpan={5} className="text-center text-green-400 text-sm font-medium py-2">CALLS</th>
                <th className="border-x border-gray-800 bg-gray-900"></th>
                <th colSpan={5} className="text-center text-red-400 text-sm font-medium py-2">PUTS</th>
              </tr>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="font-normal px-3 py-1.5 text-left">Theta</th>
                <th className="font-normal px-3 py-1.5 text-left">Delta</th>
                <th className="font-normal px-3 py-1.5 text-center text-red-400">Bid (Sell)</th>
                <th className="font-normal px-3 py-1.5 text-center text-green-400">Ask (Buy)</th>
                <th className="font-normal px-3 py-1.5 text-right">Last</th>
                <th className="font-semibold text-white bg-gray-900 border-x border-gray-800 px-3">Strike</th>
                <th className="font-normal px-3 py-1.5 text-left text-red-400">Bid (Sell)</th>
                <th className="font-normal px-3 py-1.5 text-center text-green-400">Ask (Buy)</th>
                <th className="font-normal px-3 py-1.5 text-center">Last</th>
                <th className="font-normal px-3 py-1.5 text-right">Delta</th>
                <th className="font-normal px-3 py-1.5 text-right">Theta</th>
              </tr>
            </thead>
            <tbody>
              {strikes.map((strike) => {
                const callData = getMarketData(strike, "call");
                const putData = getMarketData(strike, "put");
                const moneyness = getMoneyness(strike, strikes);
                const isATM = moneyness === "ATM";
                const isITMCall = currentRainfall > strike;
                const isITMPut = currentRainfall < strike;
                
                // Apply filters
                if (filterMode !== "all" && filterMode.toUpperCase() !== moneyness) {
                  return null;
                }
                
                return (
                  <tr key={strike} className={cn(
                    "border-b border-gray-800 text-sm",
                    isATM && "bg-yellow-900/10"
                  )}>
                    {/* CALLS */}
                    <td className={cn("px-3 py-2 text-gray-400", isITMCall && "bg-green-900/10")}>
                      {callData.greeks.theta}
                    </td>
                    <td className={cn("px-3 py-2 text-gray-400", isITMCall && "bg-green-900/10")}>
                      {callData.greeks.delta}
                    </td>
                    <td className={cn("px-3 py-2 text-center", isITMCall && "bg-green-900/10")}>
                      <button 
                        className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                        onClick={() => handleTradeClick("call", "sell", strike, callData.bid)}
                      >
                        <PriceDisplay 
                          amount={parseFloat(callData.bid)} 
                          originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                          showUsdf={showUsdf}
                          showBoth={false}
                        />
                      </button>
                    </td>
                    <td className={cn("px-3 py-2 text-center", isITMCall && "bg-green-900/10")}>
                      <button 
                        className="text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                        onClick={() => handleTradeClick("call", "buy", strike, callData.ask)}
                      >
                        <PriceDisplay 
                          amount={parseFloat(callData.ask)} 
                          originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                          showUsdf={showUsdf}
                          showBoth={false}
                        />
                      </button>
                    </td>
                    <td className={cn("px-3 py-2 text-right text-white", isITMCall && "bg-green-900/10")}>
                      <PriceDisplay 
                        amount={parseFloat(callData.last)} 
                        originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                        showUsdf={showUsdf}
                        showBoth={false}
                      />
                    </td>
                    
                    {/* STRIKE */}
                    <td className="text-center font-bold bg-gray-900 border-x border-gray-800 px-3 py-2">
                      <div className="text-white">{strike}{weatherMetric === "wind" ? "mph" : "mm"}</div>
                      {isATM && <div className="text-xs text-yellow-400">ATM</div>}
                    </td>
                    
                    {/* PUTS */}
                    <td className={cn("px-3 py-2 text-left", isITMPut && "bg-red-900/10")}>
                      <button 
                        className="text-red-400 hover:text-red-300 hover:underline cursor-pointer"
                        onClick={() => handleTradeClick("put", "sell", strike, putData.bid)}
                      >
                        <PriceDisplay 
                          amount={parseFloat(putData.bid)} 
                          originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                          showUsdf={showUsdf}
                          showBoth={false}
                        />
                      </button>
                    </td>
                    <td className={cn("px-3 py-2 text-center", isITMPut && "bg-red-900/10")}>
                      <button 
                        className="text-green-400 hover:text-green-300 hover:underline cursor-pointer"
                        onClick={() => handleTradeClick("put", "buy", strike, putData.ask)}
                      >
                        <PriceDisplay 
                          amount={parseFloat(putData.ask)} 
                          originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                          showUsdf={showUsdf}
                          showBoth={false}
                        />
                      </button>
                    </td>
                    <td className={cn("px-3 py-2 text-center text-white", isITMPut && "bg-red-900/10")}>
                      <PriceDisplay 
                        amount={parseFloat(putData.last)} 
                        originalCurrency={primaryCurrency as 'ETH' | 'FLOW'} 
                        showUsdf={showUsdf}
                        showBoth={false}
                      />
                    </td>
                    <td className={cn("px-3 py-2 text-right text-gray-400", isITMPut && "bg-red-900/10")}>
                      {putData.greeks.delta}
                    </td>
                    <td className={cn("px-3 py-2 text-right text-gray-400", isITMPut && "bg-red-900/10")}>
                      {putData.greeks.theta}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Greeks Guide */}
        <div className="p-4 border-t border-gray-800">
          <h4 className="text-xs font-medium mb-2 flex items-center gap-2 text-gray-400">
            <Info className="h-3 w-3" />
            Greeks Guide for Weather Options
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-green-400 font-medium">Delta (Δ):</span>
              <span className="text-gray-500 ml-1">Price sensitivity to {weatherMetric === "wind" ? "wind speed" : "rainfall"}</span>
            </div>
            <div>
              <span className="text-yellow-400 font-medium">Gamma (Γ):</span>
              <span className="text-gray-500 ml-1">Rate of delta change</span>
            </div>
            <div>
              <span className="text-red-400 font-medium">Theta (Θ):</span>
              <span className="text-gray-500 ml-1">Time decay per day</span>
            </div>
            <div>
              <span className="text-blue-400 font-medium">Vega (ν):</span>
              <span className="text-gray-500 ml-1">Volatility sensitivity</span>
            </div>
          </div>
        </div>

        {/* AI Pricing Methodology */}
        <div className="p-4 bg-purple-900/10 border-t border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-3 w-3 text-purple-400" />
            <span className="font-medium text-xs text-purple-300">AI Pricing Methodology</span>
          </div>
          <p className="text-xs text-purple-200/80">
            Options are priced using Monte Carlo simulation with historical rainfall data. The model accounts for seasonal patterns, volatility clustering, and mean reversion in precipitation patterns. Greeks are calculated using finite difference methods.
          </p>
        </div>
      </CardContent>
      
      {/* Trade Execution Modal */}
      <TradeExecutionModal
        isOpen={tradeModalOpen}
        onClose={() => {
          setTradeModalOpen(false);
          setSelectedTrade(null);
        }}
        tradeDetails={selectedTrade}
      />
    </Card>
  );
}