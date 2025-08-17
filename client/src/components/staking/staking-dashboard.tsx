import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  Coins, 
  Clock, 
  Shield, 
  Zap, 
  Target, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Gift,
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';

interface StakingPool {
  poolId: string;
  name: string;
  stakingToken: 'FLOW' | 'FLR';
  rewardToken: 'FLOW' | 'FLR' | 'USDF';
  network: 'flow-evm' | 'flare-coston2';
  totalStaked: string;
  totalRewards: string;
  apy: number;
  lockPeriod: number;
  minStakeAmount: string;
  userStaked?: string;
  userRewards?: string;
  userLockEndTime?: number;
  description: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  category: 'Weather Protection' | 'Yield Farming' | 'Governance' | 'Insurance';
  active: boolean;
}

interface UserStats {
  totalStaked: string;
  totalRewards: string;
  activeStakes: number;
  totalValue: string;
  portfolioAPY: number;
}

const StakingDashboard: React.FC = () => {
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [userAddress] = useState('0x742d35Cc6AB1C0532F36865D2F98D929f2e3B2');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all staking pools
  const { data: pools = [], isLoading: poolsLoading } = useQuery({
    queryKey: ['/api/staking/pools'],
    refetchInterval: 30000
  });

  // Fetch user staking data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ['/api/staking/user', 'user123'],
    refetchInterval: 30000
  });

  // Fetch staking analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/staking/analytics'],
    refetchInterval: 60000
  });

  // Stake mutation
  const stakeMutation = useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: string }) =>
      apiRequest(`/api/staking/stake`, {
        method: 'POST',
        body: JSON.stringify({ poolId, amount, userAddress })
      }),
    onSuccess: (data) => {
      toast({
        title: "Staking Initiated",
        description: `Successfully staked ${stakeAmount} tokens. Transaction: ${data.txId.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking'] });
      setStakeAmount('');
      setSelectedPool(null);
    },
    onError: (error) => {
      toast({
        title: "Staking Failed",
        description: error instanceof Error ? error.message : "Failed to stake tokens",
        variant: "destructive"
      });
    }
  });

  // Unstake mutation
  const unstakeMutation = useMutation({
    mutationFn: async ({ poolId, amount }: { poolId: string; amount: string }) =>
      apiRequest(`/api/staking/unstake`, {
        method: 'POST',
        body: JSON.stringify({ poolId, amount, userAddress })
      }),
    onSuccess: (data) => {
      toast({
        title: "Unstaking Initiated",
        description: `Successfully unstaked ${unstakeAmount} tokens. Transaction: ${data.txId.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking'] });
      setUnstakeAmount('');
      setSelectedPool(null);
    },
    onError: (error) => {
      toast({
        title: "Unstaking Failed",
        description: error instanceof Error ? error.message : "Failed to unstake tokens",
        variant: "destructive"
      });
    }
  });

  // Claim rewards mutation
  const claimMutation = useMutation({
    mutationFn: async (poolId: string) =>
      apiRequest(`/api/staking/claim`, {
        method: 'POST',
        body: JSON.stringify({ poolId, userAddress })
      }),
    onSuccess: (data) => {
      toast({
        title: "Rewards Claimed",
        description: `Successfully claimed rewards. Transaction: ${data.txId.slice(0, 10)}...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/staking'] });
    }
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getNetworkColor = (network: string) => {
    return network === 'flow-evm' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
  };

  const isLocked = (lockEndTime?: number) => {
    return lockEndTime ? Date.now() < lockEndTime : false;
  };

  const formatTimeRemaining = (lockEndTime: number) => {
    const remaining = lockEndTime - Date.now();
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const userPools = userData?.pools || [];
  const userStats = userData?.stats || {} as UserStats;

  if (poolsLoading || userLoading || analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Staking</h1>
          <p className="text-muted-foreground">
            Stake FLOW and FLR tokens to earn rewards and support weather protection pools
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            TVL: ${analytics?.totalValueLocked || '0'}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Avg APY: {analytics?.averageAPY || '0'}%
          </Badge>
        </div>
      </div>

      {/* User Stats Overview */}
      {userPools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalStaked}</div>
              <p className="text-xs text-muted-foreground">${userStats.totalValue} USD</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalRewards}</div>
              <p className="text-xs text-muted-foreground">Claimable rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio APY</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.portfolioAPY.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Weighted average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Stakes</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.activeStakes}</div>
              <p className="text-xs text-muted-foreground">Pools participating</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="all-pools" className="w-full">
        <TabsList>
          <TabsTrigger value="all-pools">All Pools</TabsTrigger>
          <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="all-pools" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool: StakingPool) => (
              <Card key={pool.poolId} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pool.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRiskColor(pool.riskLevel)}>
                        {pool.riskLevel} Risk
                      </Badge>
                      <Badge className={getNetworkColor(pool.network)}>
                        {pool.network === 'flow-evm' ? 'Flow EVM' : 'Flare Coston2'}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>{pool.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Stake Token</p>
                      <div className="flex items-center">
                        <Coins className="w-4 h-4 mr-1" />
                        <span className="font-medium">{pool.stakingToken}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reward Token</p>
                      <div className="flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        <span className="font-medium">{pool.rewardToken}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">APY</p>
                      <p className="text-2xl font-bold text-green-600">{pool.apy.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lock Period</p>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className="font-medium">{pool.lockPeriod}d</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Min Stake</p>
                      <p className="font-medium">{pool.minStakeAmount} {pool.stakingToken}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Total Staked</span>
                      <span>{pool.totalStaked} {pool.stakingToken}</span>
                    </div>
                    <Progress value={Math.min((parseFloat(pool.totalStaked) / 1000000) * 100, 100)} />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Category: {pool.category}
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="default"
                          onClick={() => setSelectedPool(pool)}
                        >
                          <Wallet className="w-4 h-4 mr-2" />
                          Stake Now
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Stake in {selectedPool?.name}</DialogTitle>
                          <DialogDescription>
                            Stake {selectedPool?.stakingToken} tokens to earn {selectedPool?.rewardToken} rewards
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                            <div>
                              <p className="text-sm text-muted-foreground">APY</p>
                              <p className="font-bold text-green-600">{selectedPool?.apy.toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Lock Period</p>
                              <p className="font-medium">{selectedPool?.lockPeriod} days</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount to Stake</label>
                            <Input
                              type="number"
                              placeholder={`Min: ${selectedPool?.minStakeAmount}`}
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Minimum stake: {selectedPool?.minStakeAmount} {selectedPool?.stakingToken}
                            </p>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              className="flex-1"
                              onClick={() => {
                                if (selectedPool && stakeAmount) {
                                  stakeMutation.mutate({ poolId: selectedPool.poolId, amount: stakeAmount });
                                }
                              }}
                              disabled={stakeMutation.isPending || !stakeAmount}
                            >
                              {stakeMutation.isPending ? "Staking..." : "Confirm Stake"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPool(null);
                                setStakeAmount('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-stakes" className="space-y-4">
          {userPools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Stakes</h3>
                <p className="text-muted-foreground text-center">
                  Start staking FLOW or FLR tokens to earn rewards and support the community
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {userPools.map((pool: StakingPool) => (
                <Card key={pool.poolId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{pool.name}</CardTitle>
                      <Badge className={getNetworkColor(pool.network)}>
                        {pool.network === 'flow-evm' ? 'Flow EVM' : 'Flare Coston2'}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Stake</p>
                        <p className="font-bold">{pool.userStaked} {pool.stakingToken}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Rewards</p>
                        <p className="font-bold text-green-600">{pool.userRewards} {pool.rewardToken}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">APY</p>
                        <p className="font-bold">{pool.apy.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lock Status</p>
                        <div className="flex items-center">
                          {isLocked(pool.userLockEndTime) ? (
                            <>
                              <Lock className="w-4 h-4 mr-1 text-red-500" />
                              <span className="text-sm text-red-600">
                                Locked for {formatTimeRemaining(pool.userLockEndTime!)}
                              </span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4 mr-1 text-green-500" />
                              <span className="text-sm text-green-600">Unlocked</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1">
                            <ArrowUpRight className="w-4 h-4 mr-2" />
                            Add Stake
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add to Stake</DialogTitle>
                            <DialogDescription>
                              Add more {pool.stakingToken} tokens to your existing stake
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              type="number"
                              placeholder="Amount to add"
                              value={stakeAmount}
                              onChange={(e) => setStakeAmount(e.target.value)}
                            />
                            <Button
                              className="w-full"
                              onClick={() => {
                                if (stakeAmount) {
                                  stakeMutation.mutate({ poolId: pool.poolId, amount: stakeAmount });
                                }
                              }}
                              disabled={stakeMutation.isPending}
                            >
                              {stakeMutation.isPending ? "Adding..." : "Add Stake"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            disabled={isLocked(pool.userLockEndTime)}
                          >
                            <ArrowDownRight className="w-4 h-4 mr-2" />
                            Unstake
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Unstake Tokens</DialogTitle>
                            <DialogDescription>
                              Unstake {pool.stakingToken} tokens from this pool
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm text-muted-foreground">Available to unstake</p>
                              <p className="font-bold">{pool.userStaked} {pool.stakingToken}</p>
                            </div>
                            <Input
                              type="number"
                              placeholder="Amount to unstake"
                              value={unstakeAmount}
                              onChange={(e) => setUnstakeAmount(e.target.value)}
                              max={pool.userStaked}
                            />
                            <Button
                              className="w-full"
                              onClick={() => {
                                if (unstakeAmount) {
                                  unstakeMutation.mutate({ poolId: pool.poolId, amount: unstakeAmount });
                                }
                              }}
                              disabled={unstakeMutation.isPending}
                            >
                              {unstakeMutation.isPending ? "Unstaking..." : "Unstake"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => claimMutation.mutate(pool.poolId)}
                        disabled={claimMutation.isPending || parseFloat(pool.userRewards || '0') === 0}
                      >
                        <Gift className="w-4 h-4 mr-2" />
                        {claimMutation.isPending ? "Claiming..." : "Claim"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Value Locked</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${analytics?.totalValueLocked}</div>
                <p className="text-muted-foreground text-sm">Across all pools</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Pools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics?.activePools}</div>
                <p className="text-muted-foreground text-sm">of {analytics?.totalPools} total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Pool</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold">{analytics?.topPool?.name}</div>
                <p className="text-green-600 font-semibold">{analytics?.topPool?.apy.toFixed(1)}% APY</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Network Distribution</CardTitle>
              <CardDescription>Staking pools across different blockchain networks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Flow EVM</span>
                    <span>{analytics?.networkDistribution?.flow || 0} pools</span>
                  </div>
                  <Progress 
                    value={((analytics?.networkDistribution?.flow || 0) / (analytics?.totalPools || 1)) * 100} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Flare Coston2</span>
                    <span>{analytics?.networkDistribution?.flare || 0} pools</span>
                  </div>
                  <Progress 
                    value={((analytics?.networkDistribution?.flare || 0) / (analytics?.totalPools || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StakingDashboard;