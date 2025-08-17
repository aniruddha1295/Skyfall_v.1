import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import TradeExecutionModal from "./trade-execution-modal";

interface FuturesTradingProps {
  selectedCity: string;
  currentRainfall: number;
  currentWindSpeed?: number;
  weatherMetric?: "rainfall" | "wind";
}

interface FuturesContract {
  contractId: string;
  underlying: string;
  expiryMonth: string;
  lastPrice: number;
  change: number;
  changePercent: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  high: number;
  low: number;
  settlement: number;
}

const FUTURES_MONTHS = [
  { month: "JUL2025", label: "July 2025", days: 30 },
  { month: "AUG2025", label: "August 2025", days: 61 },
  { month: "SEP2025", label: "September 2025", days: 92 },
  { month: "OCT2025", label: "October 2025", days: 123 },
];

export default function FuturesTrading({ 
  selectedCity, 
  currentRainfall, 
  currentWindSpeed = 0, 
  weatherMetric = "rainfall" 
}: FuturesTradingProps) {
  const [selectedMonth, setSelectedMonth] = useState("JUL2025");
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<{
    type: "futures";
    action: "buy" | "sell";
    price: string;
    contract: string;
    currentRainfall: number;
  } | null>(null);

  // Generate mock futures data based on weather metric
  const generateFuturesData = (): FuturesContract[] => {
    const currentValue = weatherMetric === "wind" ? currentWindSpeed : currentRainfall;
    const isWind = weatherMetric === "wind";
    
    return FUTURES_MONTHS.map((month, index) => {
      const basePrice = currentValue + (index * (isWind ? 1 : 2));
      const volatility = isWind ? 0.25 : 0.15; // Wind is more volatile
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      const lastPrice = parseFloat((basePrice * randomFactor).toFixed(2));
      const previousClose = basePrice;
      const change = lastPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        contractId: `${selectedCity}_${isWind ? "wind" : "rain"}_${month.month}`,
        underlying: `${selectedCity} ${isWind ? "Wind Speed Index" : "Rainfall Index"}`,
        expiryMonth: month.label,
        lastPrice,
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2)),
        bid: parseFloat((lastPrice - (isWind ? 0.25 : 0.05)).toFixed(2)),
        ask: parseFloat((lastPrice + (isWind ? 0.25 : 0.05)).toFixed(2)),
        volume: Math.floor(Math.random() * 1000) + 100,
        openInterest: Math.floor(Math.random() * 5000) + 1000,
        high: parseFloat((lastPrice * 1.02).toFixed(2)),
        low: parseFloat((lastPrice * 0.98).toFixed(2)),
        settlement: basePrice
      };
    });
  };

  const futuresData = generateFuturesData();
  const selectedContract = futuresData.find(f => {
    const monthData = FUTURES_MONTHS.find(m => m.month === selectedMonth);
    return f.expiryMonth === monthData?.label;
  });

  const handleTradeClick = (action: "buy" | "sell", contract: FuturesContract) => {
    setSelectedTrade({
      type: "futures",
      action,
      price: action === "buy" ? contract.ask.toFixed(2) : contract.bid.toFixed(2),
      contract: contract.expiryMonth,
      currentRainfall: weatherMetric === "wind" ? currentWindSpeed : currentRainfall
    });
    setTradeModalOpen(true);
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-400" />
          {weatherMetric === "wind" ? "Wind Speed" : "Rainfall"} Futures Trading
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Selection */}
        <Tabs value={selectedMonth} onValueChange={setSelectedMonth}>
          <TabsList className="bg-gray-800 border-gray-700">
            {FUTURES_MONTHS.map(month => (
              <TabsTrigger 
                key={month.month} 
                value={month.month}
                className="data-[state=active]:bg-gray-700"
              >
                {month.month}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value={selectedMonth} className="mt-6">
            {selectedContract ? (
              <div className="space-y-6">
                {/* Contract Details */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {selectedContract.underlying}
                      </h3>
                      <p className="text-gray-400">{selectedContract.expiryMonth}</p>
                    </div>
                    <Badge className={cn(
                      "text-lg px-3 py-1",
                      selectedContract.change >= 0 
                        ? "bg-green-900/20 text-green-400" 
                        : "bg-red-900/20 text-red-400"
                    )}>
                      {selectedContract.change >= 0 ? "+" : ""}{selectedContract.change} 
                      ({selectedContract.changePercent >= 0 ? "+" : ""}{selectedContract.changePercent}%)
                    </Badge>
                  </div>

                  {/* Price Display */}
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-white mb-2">
                      {selectedContract.lastPrice} {weatherMetric === "wind" ? "mph" : "mm"}
                    </div>
                    <div className="text-gray-400">Last Trade Price</div>
                  </div>

                  {/* Market Data Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Bid</div>
                      <div className="text-red-400 font-semibold">{selectedContract.bid}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Ask</div>
                      <div className="text-green-400 font-semibold">{selectedContract.ask}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Day High</div>
                      <div className="text-white">{selectedContract.high}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Day Low</div>
                      <div className="text-white">{selectedContract.low}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Volume</div>
                      <div className="text-white">{selectedContract.volume.toLocaleString()}</div>
                    </div>
                    <div className="bg-gray-900 rounded p-3">
                      <div className="text-gray-400 text-sm">Open Interest</div>
                      <div className="text-white">{selectedContract.openInterest.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Trading Buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      size="lg"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleTradeClick("buy", selectedContract)}
                    >
                      <TrendingUp className="mr-2 h-5 w-5" />
                      Buy (Long)
                    </Button>
                    <Button
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => handleTradeClick("sell", selectedContract)}
                    >
                      <TrendingDown className="mr-2 h-5 w-5" />
                      Sell (Short)
                    </Button>
                  </div>
                </div>

                {/* All Contracts Table */}
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-700">
                    <h4 className="font-medium text-white">All Futures Contracts</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="px-4 py-2 text-left text-gray-400 text-sm">Contract</th>
                          <th className="px-4 py-2 text-right text-gray-400 text-sm">Last</th>
                          <th className="px-4 py-2 text-right text-gray-400 text-sm">Change</th>
                          <th className="px-4 py-2 text-right text-gray-400 text-sm">Bid</th>
                          <th className="px-4 py-2 text-right text-gray-400 text-sm">Ask</th>
                          <th className="px-4 py-2 text-right text-gray-400 text-sm">Volume</th>
                          <th className="px-4 py-2 text-center text-gray-400 text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {futuresData.map((contract) => (
                          <tr key={contract.contractId} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-white font-medium">{contract.expiryMonth}</div>
                                <div className="text-xs text-gray-400">{contract.contractId}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-white">{contract.lastPrice}</td>
                            <td className="px-4 py-3 text-right">
                              <span className={cn(
                                "text-sm",
                                contract.change >= 0 ? "text-green-400" : "text-red-400"
                              )}>
                                {contract.change >= 0 ? "+" : ""}{contract.change}
                                <span className="text-xs ml-1">
                                  ({contract.changePercent >= 0 ? "+" : ""}{contract.changePercent}%)
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-red-400">{contract.bid}</td>
                            <td className="px-4 py-3 text-right text-green-400">{contract.ask}</td>
                            <td className="px-4 py-3 text-right text-gray-300">{contract.volume}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-400 border-green-400 hover:bg-green-400/10"
                                  onClick={() => handleTradeClick("buy", contract)}
                                >
                                  Buy
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-400 border-red-400 hover:bg-red-400/10"
                                  onClick={() => handleTradeClick("sell", contract)}
                                >
                                  Sell
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Information Box */}
                <div className="bg-purple-900/20 border border-purple-800 rounded-lg p-4">
                  <h4 className="text-purple-300 font-medium mb-2">About Rainfall Futures</h4>
                  <p className="text-sm text-purple-200/80">
                    Rainfall futures allow you to take direct positions on future rainfall levels. 
                    Going long (buying) profits if rainfall exceeds the contract price at expiry. 
                    Going short (selling) profits if rainfall is below the contract price. 
                    These are cash-settled contracts based on the official rainfall index.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No contract data available for {selectedMonth}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Trade Execution Modal */}
        <TradeExecutionModal
          isOpen={tradeModalOpen}
          onClose={() => {
            setTradeModalOpen(false);
            setSelectedTrade(null);
          }}
          tradeDetails={selectedTrade as any}
        />
      </CardContent>
    </Card>
  );
}