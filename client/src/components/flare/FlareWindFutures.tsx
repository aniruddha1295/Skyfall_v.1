import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Wind, Zap, ExternalLink, DollarSign, Clock, Target } from 'lucide-react';

interface FlareMarketData {
  currentWindSpeed: number;
  flrUsdPrice: number;
  lastUpdate: number;
}

interface WindFuture {
  contractId: string;
  trader: string;
  isLong: boolean;
  strikePrice: number;
  notionalAmount: number;
  collateralAmount: number;
  collateralToken: string;
  expiryTimestamp: number;
  isSettled: boolean;
  pnl: number;
  createdAt: number;
}

interface NetworkInfo {
  chainId: number;
  networkName: string;
  blockNumber: number;
  gasPrice: string;
  explorerUrl: string;
}

export default function FlareWindFutures() {
  const [selectedStrike, setSelectedStrike] = useState<number>(8);
  const [selectedExpiry, setSelectedExpiry] = useState<number>(7);
  const [positionSize, setPositionSize] = useState<string>('1000');
  const [collateralToken, setCollateralToken] = useState<string>('FLR');
  const [selectedPosition, setSelectedPosition] = useState<'long' | 'short'>('long');

  // Fetch Flare network information
  const { data: networkInfo } = useQuery<NetworkInfo>({
    queryKey: ['/api/flare/network-info'],
    refetchInterval: 30000
  });

  // Fetch market data
  const { data: marketData } = useQuery<FlareMarketData>({
    queryKey: ['/api/flare/market-data'],
    refetchInterval: 10000
  });

  // Fetch available strikes and expiries
  const { data: strikes } = useQuery<number[]>({
    queryKey: ['/api/flare/wind-futures/strikes']
  });

  const { data: expiries } = useQuery<{ days: number; label: string }[]>({
    queryKey: ['/api/flare/wind-futures/expiries']
  });

  // Fetch all contracts
  const { data: allContracts } = useQuery<WindFuture[]>({
    queryKey: ['/api/flare/wind-futures/all'],
    refetchInterval: 15000
  });

  // Fetch deployment info
  const { data: deploymentInfo } = useQuery({
    queryKey: ['/api/flare/deployment-info']
  });

  const formatTimeRemaining = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const getMoneyness = (currentPrice: number, strikePrice: number, isLong: boolean) => {
    const diff = currentPrice - strikePrice;
    if (Math.abs(diff) < 0.5) return 'ATM';
    
    if (isLong) {
      return diff > 0 ? 'ITM' : 'OTM';
    } else {
      return diff < 0 ? 'ITM' : 'OTM';
    }
  };

  const calculatePnL = (contract: WindFuture, currentWindSpeed: number) => {
    if (contract.isSettled) return contract.pnl;
    
    const priceDiff = currentWindSpeed - contract.strikePrice;
    const adjustedDiff = contract.isLong ? priceDiff : -priceDiff;
    return (adjustedDiff / contract.strikePrice) * contract.notionalAmount;
  };

  return (
    <div className="space-y-6">
      {/* Header with Network Info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Flare Wind Futures
          </h1>
          <p className="text-muted-foreground mt-1">
            On-chain wind derivatives trading with automatic FTSO settlement
          </p>
        </div>
        
        {networkInfo && (
          <div className="text-right">
            <Badge variant="outline" className="mb-2">
              <Zap className="h-3 w-3 mr-1" />
              {networkInfo.networkName}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Block: {networkInfo.blockNumber.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Market Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Wind className="h-4 w-4 mr-2 text-blue-500" />
              Current Wind Speed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {marketData?.currentWindSpeed?.toFixed(1) || '--'} mph
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Live data from Flare oracles
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-500" />
              FLR/USD Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${marketData?.flrUsdPrice?.toFixed(4) || '--'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              FTSO price feed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Target className="h-4 w-4 mr-2 text-orange-500" />
              Active Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allContracts?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              On-chain positions
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trading" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trading">Trading Interface</TabsTrigger>
          <TabsTrigger value="positions">Open Positions</TabsTrigger>
          <TabsTrigger value="deployment">Contract Info</TabsTrigger>
        </TabsList>

        <TabsContent value="trading" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wind className="h-5 w-5 mr-2" />
                Create Wind Future Position
              </CardTitle>
              <CardDescription>
                Trade wind speed derivatives with automatic FTSO settlement on Flare Network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Position Type */}
                <div className="space-y-3">
                  <Label>Position Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={selectedPosition === 'long' ? 'default' : 'outline'}
                      onClick={() => setSelectedPosition('long')}
                      className="flex items-center"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Long
                    </Button>
                    <Button
                      variant={selectedPosition === 'short' ? 'default' : 'outline'}
                      onClick={() => setSelectedPosition('short')}
                      className="flex items-center"
                    >
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Short
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedPosition === 'long' 
                      ? 'Profit when wind speed > strike price'
                      : 'Profit when wind speed < strike price'
                    }
                  </div>
                </div>

                {/* Strike Price */}
                <div className="space-y-3">
                  <Label>Strike Price (mph)</Label>
                  <Select value={selectedStrike.toString()} onValueChange={(value) => setSelectedStrike(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {strikes?.map((strike) => {
                        const moneyness = getMoneyness(marketData?.currentWindSpeed || 7.5, strike, selectedPosition === 'long');
                        return (
                          <SelectItem key={strike} value={strike.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{strike} mph</span>
                              <Badge variant={moneyness === 'ATM' ? 'default' : 'secondary'} className="ml-2">
                                {moneyness}
                              </Badge>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiry */}
                <div className="space-y-3">
                  <Label>Expiry Period</Label>
                  <Select value={selectedExpiry.toString()} onValueChange={(value) => setSelectedExpiry(Number(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expiries?.map((expiry) => (
                        <SelectItem key={expiry.days} value={expiry.days.toString()}>
                          {expiry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Position Size */}
                <div className="space-y-3">
                  <Label>Position Size (USD)</Label>
                  <Input
                    type="number"
                    value={positionSize}
                    onChange={(e) => setPositionSize(e.target.value)}
                    placeholder="1000"
                  />
                  <div className="text-xs text-muted-foreground">
                    Minimum: $100, Margin required: 20%
                  </div>
                </div>

                {/* Collateral Token */}
                <div className="space-y-3">
                  <Label>Collateral Token</Label>
                  <Select value={collateralToken} onValueChange={setCollateralToken}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FLR">FLR (Flare Token)</SelectItem>
                      <SelectItem value="USDT">USDT (Tether USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Margin Info */}
                <div className="space-y-3">
                  <Label>Required Margin</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">
                      ${(Number(positionSize) * 0.2).toFixed(2)} USD
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {collateralToken === 'FLR' && marketData
                        ? `≈ ${((Number(positionSize) * 0.2) / marketData.flrUsdPrice).toFixed(0)} FLR`
                        : collateralToken === 'USDT'
                        ? `≈ ${(Number(positionSize) * 0.2).toFixed(2)} USDT`
                        : 'Loading...'
                      }
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Connect wallet to Flare Coston2 testnet to trade
                </div>
                <Button disabled className="min-w-32">
                  Connect Flare Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Positions</CardTitle>
              <CardDescription>
                All active wind futures contracts on Flare Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allContracts && allContracts.length > 0 ? (
                <div className="space-y-4">
                  {allContracts.map((contract) => {
                    const currentPnL = calculatePnL(contract, marketData?.currentWindSpeed || 7.5);
                    const isProfit = currentPnL > 0;
                    
                    return (
                      <div key={contract.contractId} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant={contract.isLong ? 'default' : 'secondary'}>
                              {contract.isLong ? 'LONG' : 'SHORT'}
                            </Badge>
                            <div className="text-sm font-medium">
                              {contract.strikePrice} mph
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${contract.notionalAmount.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                              {isProfit ? '+' : ''}${currentPnL.toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {((currentPnL / contract.notionalAmount) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          <div>
                            <div className="text-muted-foreground">Expiry</div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeRemaining(contract.expiryTimestamp)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Collateral</div>
                            <div>{contract.collateralAmount.toFixed(2)} {contract.collateralToken}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Status</div>
                            <Badge variant={contract.isSettled ? 'outline' : 'default'} className="text-xs">
                              {contract.isSettled ? 'Settled' : 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No active positions found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Flare Network Integration</CardTitle>
              <CardDescription>
                Smart contract deployment and network information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deploymentInfo && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Network</Label>
                      <div className="text-sm text-muted-foreground">
                        {deploymentInfo.network}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Chain ID</Label>
                      <div className="text-sm text-muted-foreground">
                        {deploymentInfo.chainId}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">RPC Endpoint</Label>
                    <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">
                      {deploymentInfo.rpcUrl}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Contract Registry</Label>
                    <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded flex items-center justify-between">
                      {deploymentInfo.contractRegistry}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {deploymentInfo.contractAddress && (
                    <div>
                      <Label className="text-sm font-medium">Wind Futures Contract</Label>
                      <div className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded flex items-center justify-between">
                        {deploymentInfo.contractAddress}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Separator />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Automatic settlement using Flare FTSO price feeds</li>
                  <li>• FLR and USDT collateral support</li>
                  <li>• 20% margin requirement</li>
                  <li>• 7, 14, and 30-day expiry options</li>
                  <li>• Strike prices from 4-24 mph in 1 mph increments</li>
                  <li>• Gas-free transactions on Flare Network</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}