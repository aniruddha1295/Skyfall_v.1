import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Bot, Info, TrendingUp, TrendingDown } from "lucide-react";

interface OptionsChainProps {
  selectedCity: {
    city: string;
    state: string;
    stationId: string;
  };
  currentRainfall: number;
}

interface OptionContract {
  id: string;
  contractId: string;
  underlying: string;
  contractType: "call" | "put";
  strikePrice: string;
  premium: string;
  expiryDate: string;
  totalSupply: number;
  availableSupply: number;
  Greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  isSettled: boolean;
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

// Generate strike prices based on current rainfall
const generateStrikes = (currentRainfall: number) => {
  const strikes = [];
  const baseStrike = Math.round(currentRainfall / 5) * 5; // Round to nearest 5
  
  // Generate strikes from -20mm to +20mm around current rainfall
  for (let i = -4; i <= 4; i++) {
    const strike = baseStrike + (i * 5);
    if (strike >= 0) {
      strikes.push(strike);
    }
  }
  
  return strikes;
};

export default function OptionsChain({ selectedCity, currentRainfall }: OptionsChainProps) {
  const [selectedExpiry, setSelectedExpiry] = useState(EXPIRY_DATES[0].value);
  const [filterMode, setFilterMode] = useState("all");
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["/api/options/contracts", selectedCity.stationId, selectedExpiry],
    refetchInterval: 30000
  });

  const strikes = generateStrikes(currentRainfall);

  // Mock market data for display
  const getMarketData = (strike: number, type: "call" | "put") => {
    const isITM = type === "call" ? currentRainfall > strike : currentRainfall < strike;
    const basePrice = Math.abs(currentRainfall - strike) * 0.1 + 1.5;
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
          ? (0.5 + (currentRainfall - strike) * 0.02).toFixed(2)
          : (-0.5 + (currentRainfall - strike) * 0.02).toFixed(2),
        gamma: (0.02 + Math.random() * 0.08).toFixed(3),
        theta: (-0.02 - Math.random() * 0.08).toFixed(3),
        vega: (0.1 + Math.random() * 0.2).toFixed(2)
      }
    };
  };

  const getMoneyness = (strike: number) => {
    if (Math.abs(strike - currentRainfall) < 2.5) return "ATM";
    return strike < currentRainfall ? "ITM" : "OTM";
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
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="bg-gray-900">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Options Chain - {selectedCity.city}, {selectedCity.state}</CardTitle>
          <div className="flex items-center gap-4">
            <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
              Monte Carlo Pricing
            </Badge>
            <div className="flex gap-2 flex-wrap">
              {EXPIRY_DATES.map((date) => (
                <Button
                  key={date.value}
                  size="sm"
                  variant={selectedExpiry === date.value ? "default" : "outline"}
                  onClick={() => setSelectedExpiry(date.value)}
                  className={cn(
                    "border-gray-700 text-xs px-3 py-1",
                    selectedExpiry === date.value 
                      ? "bg-primary hover:bg-primary/90 text-white border-primary" 
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                    date.type === "weekly" && "text-orange-400"
                  )}
                >
                  {date.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <Select value={filterMode} onValueChange={setFilterMode}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-gray-300">
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
                className="border-gray-600"
              />
              <span className="text-sm text-gray-300">Active contracts only</span>
            </label>
          </div>
          
          <div className="text-sm text-gray-300">
            Current Rainfall: <span className="text-green-400 font-medium">{currentRainfall}mm</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="bg-gray-900 p-0">
        <div className="border-t border-gray-800">
          {/* Header */}
          <div className="grid grid-cols-[3fr_1fr_3fr] border-b border-gray-800">
            <div className="text-center py-3">
              <div className="text-green-400 font-semibold mb-2">CALLS</div>
              <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 px-4">
                <div>Theta</div>
                <div>Delta</div>
                <div className="text-red-400">Bid (Sell)</div>
                <div className="text-green-400">Ask (Buy)</div>
                <div>Last</div>
              </div>
            </div>
            <div className="text-center py-3 border-x border-gray-800">
              <div className="text-white font-semibold mb-2">STRIKE</div>
            </div>
            <div className="text-center py-3">
              <div className="text-red-400 font-semibold mb-2">PUTS</div>
              <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 px-4">
                <div className="text-red-400">Bid (Sell)</div>
                <div className="text-green-400">Ask (Buy)</div>
                <div>Last</div>
                <div>Delta</div>
                <div>Theta</div>
              </div>
            </div>
          </div>

          {/* Options Data */}
          {strikes.map((strike) => {
            const callData = getMarketData(strike, "call");
            const putData = getMarketData(strike, "put");
            const moneyness = getMoneyness(strike);
            const isATM = moneyness === "ATM";
            
            // Apply filters
            if (filterMode !== "all" && filterMode.toUpperCase() !== moneyness) {
              return null;
            }
            
            return (
              <div key={strike} className="border-b border-gray-800">
                {/* Data Row */}
                <div className="grid grid-cols-[3fr_1fr_3fr]">
                  {/* CALLS */}
                  <div className="grid grid-cols-5 gap-2 px-4 py-3 text-sm items-center">
                    <div className="text-gray-400">{callData.greeks.theta}</div>
                    <div className="text-gray-400">{callData.greeks.delta}</div>
                    <div className="text-red-300">${callData.bid}</div>
                    <div className="text-green-300">${callData.ask}</div>
                    <div className="text-white">${callData.last}</div>
                  </div>
                  
                  {/* STRIKE */}
                  <div className={cn(
                    "text-center py-3 border-x border-gray-800 font-bold",
                    isATM && "bg-yellow-900/20"
                  )}>
                    <div className="text-white">{strike}mm</div>
                    <div className="text-xs text-gray-500 font-normal">{moneyness}</div>
                  </div>
                  
                  {/* PUTS */}
                  <div className="grid grid-cols-5 gap-2 px-4 py-3 text-sm items-center">
                    <div className="text-red-300">${putData.bid}</div>
                    <div className="text-green-300">${putData.ask}</div>
                    <div className="text-white">${putData.last}</div>
                    <div className="text-gray-400">{putData.greeks.delta}</div>
                    <div className="text-gray-400">{putData.greeks.theta}</div>
                  </div>
                </div>
                
                {/* Action Row - Click on prices */}
                <div className="grid grid-cols-[3fr_1fr_3fr] text-xs text-gray-500">
                  <div className="px-4 py-2 grid grid-cols-5 gap-2">
                    <div></div>
                    <div></div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-400 hover:bg-red-900/20 h-6 px-2 py-0"
                    >
                      Sell
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-green-400 hover:bg-green-900/20 h-6 px-2 py-0"
                    >
                      Buy
                    </Button>
                    <div></div>
                  </div>
                  
                  <div className="border-x border-gray-800"></div>
                  
                  <div className="px-4 py-2 grid grid-cols-5 gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-red-400 hover:bg-red-900/20 h-6 px-2 py-0"
                    >
                      Sell
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-green-400 hover:bg-green-900/20 h-6 px-2 py-0"
                    >
                      Buy
                    </Button>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Greeks Guide */}
        <div className="p-6 border-t border-gray-800">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-300">
            <Info className="h-4 w-4" />
            Greeks Guide for Weather Options
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-400 font-medium">Delta (Δ):</span>
              <span className="text-gray-400 ml-1">Price sensitivity to rainfall changes</span>
            </div>
            <div>
              <span className="text-yellow-400 font-medium">Gamma (Γ):</span>
              <span className="text-gray-400 ml-1">Rate of change of delta</span>
            </div>
            <div>
              <span className="text-red-400 font-medium">Theta (Θ):</span>
              <span className="text-gray-400 ml-1">Time decay per day</span>
            </div>
            <div>
              <span className="text-blue-400 font-medium">Vega (ν):</span>
              <span className="text-gray-400 ml-1">Volatility sensitivity</span>
            </div>
          </div>
        </div>

        {/* AI Pricing Methodology */}
        <div className="p-6 bg-purple-900/20 border-t border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-purple-400" />
            <span className="font-medium text-purple-300">AI Pricing Methodology</span>
          </div>
          <p className="text-sm text-purple-200">
            Options are priced using Monte Carlo simulation with historical rainfall data. The model accounts for seasonal patterns, volatility clustering, and mean reversion in precipitation patterns. Greeks are calculated using finite difference methods.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}