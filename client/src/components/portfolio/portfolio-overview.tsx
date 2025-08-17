import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Activity,
  Target,
  BarChart3,
  Eye,
  X
} from "lucide-react";
import { PriceDisplay, CurrencyConversionCard } from "../trading/currency-toggle";
import { useCurrencyToggle, useUSDFPricing } from "@/lib/usdf-pricing";

interface Position {
  id: string;
  contractId: string;
  type: "call" | "put";
  strike: number;
  premium: number;
  quantity: number;
  expiry: string;
  city: string;
  weatherMetric: "rainfall" | "wind";
  currentValue: number;
  entryDate: string;
  status: "open" | "closed" | "expired";
  pnl: number;
  pnlPercent: number;
}

interface PortfolioStats {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  openPositions: number;
  dayChange: number;
  dayChangePercent: number;
}

export default function PortfolioOverview() {
  const [selectedTab, setSelectedTab] = useState("positions");
  const [filterStatus, setFilterStatus] = useState<"all" | "open" | "closed">("all");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  
  const { showUsdf, primaryCurrency } = useCurrencyToggle();
  const { convertToUsdf, convertFromUsdf } = useUSDFPricing();

  const { data: portfolio, isLoading } = useQuery({
    queryKey: ["/api/portfolio/positions"],
    refetchInterval: 30000
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/portfolio/stats"],
    refetchInterval: 30000
  });

  const positions: Position[] = (portfolio as any)?.positions || [];
  const portfolioStats: PortfolioStats = (stats as any) || {
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
    openPositions: 0,
    dayChange: 0,
    dayChangePercent: 0
  };

  const filteredPositions = positions.filter(position => {
    if (filterStatus === "all") return true;
    return position.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Open</Badge>;
      case "closed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Closed</Badge>;
      case "expired":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPnLColor = (pnl: number) => {
    if (pnl > 0) return "text-green-400";
    if (pnl < 0) return "text-red-400";
    return "text-gray-400";
  };

  const formatCurrency = (amount: number, originalCurrency: 'ETH' | 'FLOW' = 'ETH') => {
    if (showUsdf) {
      const usdfAmount = convertToUsdf(amount, originalCurrency);
      return `${usdfAmount.toFixed(2)} USDF`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDualCurrency = (amount: number, originalCurrency: 'ETH' | 'FLOW' = 'ETH') => {
    const usdfAmount = convertToUsdf(amount, originalCurrency);
    return {
      original: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount),
      usdf: `${usdfAmount.toFixed(2)} USDF`
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysToExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMoneyness = (position: Position) => {
    const { type, strike, currentValue } = position;
    if (type === "call") {
      if (currentValue > strike) return "ITM";
      if (Math.abs(currentValue - strike) < (position.weatherMetric === "wind" ? 2 : 1)) return "ATM";
      return "OTM";
    } else {
      if (currentValue < strike) return "ITM";
      if (Math.abs(currentValue - strike) < (position.weatherMetric === "wind" ? 2 : 1)) return "ATM";
      return "OTM";
    }
  };

  const getMoneynessColor = (moneyness: string) => {
    switch (moneyness) {
      case "ITM": return "text-green-400";
      case "ATM": return "text-yellow-400";
      case "OTM": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-700 rounded"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total Value</p>
                <p className="text-lg font-semibold text-white">
                  {formatCurrency(portfolioStats.totalValue)}
                </p>
              </div>
              <DollarSign className="h-5 w-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Total P&L</p>
                <p className={`text-lg font-semibold ${getPnLColor(portfolioStats.totalPnL)}`}>
                  {formatCurrency(portfolioStats.totalPnL)}
                </p>
                <p className={`text-xs ${getPnLColor(portfolioStats.totalPnL)}`}>
                  ({portfolioStats.totalPnLPercent > 0 ? '+' : ''}{portfolioStats.totalPnLPercent.toFixed(1)}%)
                </p>
              </div>
              {portfolioStats.totalPnL >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Open Positions</p>
                <p className="text-lg font-semibold text-white">
                  {portfolioStats.openPositions}
                </p>
              </div>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Day Change</p>
                <p className={`text-lg font-semibold ${getPnLColor(portfolioStats.dayChange)}`}>
                  {formatCurrency(portfolioStats.dayChange)}
                </p>
                <p className={`text-xs ${getPnLColor(portfolioStats.dayChange)}`}>
                  ({portfolioStats.dayChangePercent > 0 ? '+' : ''}{portfolioStats.dayChangePercent.toFixed(1)}%)
                </p>
              </div>
              {portfolioStats.dayChange >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Conversion Card */}
      <CurrencyConversionCard />

      {/* Portfolio Content */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Portfolio</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className="text-xs"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "open" ? "default" : "outline"}
                onClick={() => setFilterStatus("open")}
                className="text-xs"
              >
                Open
              </Button>
              <Button
                size="sm"
                variant={filterStatus === "closed" ? "default" : "outline"}
                onClick={() => setFilterStatus("closed")}
                className="text-xs"
              >
                Closed
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPositions.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No positions found</p>
              <p className="text-gray-500 text-xs mt-1">
                Execute your first trade to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-850">
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Position</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Strike</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Current</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Moneyness</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Expiry</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">P&L</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-400 px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPositions.map((position) => {
                    const moneyness = getMoneyness(position);
                    const daysToExpiry = getDaysToExpiry(position.expiry);
                    
                    return (
                      <tr
                        key={position.id}
                        className="border-b border-gray-800 hover:bg-gray-850/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={position.type === "call" ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {position.type.toUpperCase()}
                              </Badge>
                              <span className="text-sm text-white">{position.city}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {position.weatherMetric === "wind" ? "Wind" : "Rainfall"} • Qty: {position.quantity}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">
                            {position.strike}{position.weatherMetric === "wind" ? "mph" : "mm"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white">
                            {position.currentValue.toFixed(1)}{position.weatherMetric === "wind" ? "mph" : "mm"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${getMoneynessColor(moneyness)}`}>
                            {moneyness}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-white">{formatDate(position.expiry)}</span>
                            <span className={`text-xs ${daysToExpiry <= 7 ? 'text-red-400' : 'text-gray-400'}`}>
                              {daysToExpiry > 0 ? `${daysToExpiry}d` : 'Expired'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${getPnLColor(position.pnl)}`}>
                              {formatCurrency(position.pnl)}
                            </span>
                            <span className={`text-xs ${getPnLColor(position.pnl)}`}>
                              ({position.pnlPercent > 0 ? '+' : ''}{position.pnlPercent.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(position.status)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedPosition(position)}
                            className="h-6 w-6 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Position Detail Modal */}
      {selectedPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Position Details</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedPosition(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Contract</p>
                  <p className="text-sm text-white">
                    {selectedPosition.type.toUpperCase()} {selectedPosition.strike}
                    {selectedPosition.weatherMetric === "wind" ? "mph" : "mm"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">City</p>
                  <p className="text-sm text-white">{selectedPosition.city}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Premium Paid</p>
                  <p className="text-sm text-white">{formatCurrency(selectedPosition.premium)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Quantity</p>
                  <p className="text-sm text-white">{selectedPosition.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Entry Date</p>
                  <p className="text-sm text-white">{formatDate(selectedPosition.entryDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expiry</p>
                  <p className="text-sm text-white">{formatDate(selectedPosition.expiry)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Current Value</p>
                  <p className="text-sm text-white">
                    {selectedPosition.currentValue.toFixed(1)}
                    {selectedPosition.weatherMetric === "wind" ? "mph" : "mm"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Moneyness</p>
                  <p className={`text-sm font-medium ${getMoneynessColor(getMoneyness(selectedPosition))}`}>
                    {getMoneyness(selectedPosition)}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Total P&L</p>
                    <p className={`text-lg font-semibold ${getPnLColor(selectedPosition.pnl)}`}>
                      {formatCurrency(selectedPosition.pnl)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">P&L %</p>
                    <p className={`text-lg font-semibold ${getPnLColor(selectedPosition.pnl)}`}>
                      {selectedPosition.pnlPercent > 0 ? '+' : ''}{selectedPosition.pnlPercent.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {selectedPosition.status === "open" && (
                <div className="border-t border-gray-800 pt-4">
                  <Button className="w-full" variant="outline">
                    Close Position
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}