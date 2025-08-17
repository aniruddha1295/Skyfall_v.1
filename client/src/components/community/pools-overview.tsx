import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  DollarSign, 
  Clock, 
  Plus, 
  CheckCircle, 
  Calculator,
  Activity,
  UserPlus,
  Coins,
  Zap
} from "lucide-react";
import { VRFRandomnessComponent } from "./vrf-randomness";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface CommunityPool {
  id: number;
  poolId: string;
  name: string;
  description: string;
  underlying: string;
  triggerCondition: string;
  totalValueLocked: string;
  memberCount: number;
  nextPayoutDate: string;
  payoutMultiplier: string;
  isActive: boolean;
  createdAt: string;
}

export default function PoolsOverview() {
  const [stakeAmount, setStakeAmount] = useState("500");
  const [selectedPoolId, setSelectedPoolId] = useState("dallas_drought_relief");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pools, isLoading } = useQuery({
    queryKey: ["/api/pools"],
    refetchInterval: 30000
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["/api/users/1/pools"], // Assuming user ID 1 for demo
    refetchInterval: 30000
  });

  const { data: payoutCalculation } = useQuery({
    queryKey: ["/api/pools", selectedPoolId, "calculate-payout", stakeAmount],
    enabled: !!selectedPoolId && !!stakeAmount
  });

  const joinPoolMutation = useMutation({
    mutationFn: async ({ poolId, stakeAmount }: { poolId: string; stakeAmount: string }) => {
      return apiRequest(`/api/pools/${poolId}/join`, {
        method: "POST",
        body: JSON.stringify({
          userId: 1, // Demo user ID
          stakeAmount: stakeAmount
        })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Successfully Joined Pool!",
        description: `You've staked $${stakeAmount} in the ${pools?.find((p: CommunityPool) => p.poolId === selectedPoolId)?.name} pool.`,
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/pools"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/1/pools"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Join Pool",
        description: "There was an error joining the pool. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleJoinPool = () => {
    if (!selectedPoolId || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please select a pool and enter a valid stake amount.",
        variant: "destructive"
      });
      return;
    }

    joinPoolMutation.mutate({
      poolId: selectedPoolId,
      stakeAmount: stakeAmount
    });
  };

  // Check if user is already a member of the selected pool
  const isAlreadyMember = () => {
    if (!userMemberships || !selectedPoolId) return false;
    return (userMemberships as any[]).some((membership: any) => 
      membership.poolId === selectedPoolId
    );
  };

  const getTotalTVL = () => {
    if (!pools || !Array.isArray(pools)) return "0";
    return pools.reduce((sum: number, pool: CommunityPool) => 
      sum + parseFloat(pool.totalValueLocked), 0
    ).toFixed(0);
  };

  const getTotalMembers = () => {
    if (!pools || !Array.isArray(pools)) return 0;
    return pools.reduce((sum: number, pool: CommunityPool) => sum + pool.memberCount, 0);
  };

  const getNextPayoutPool = () => {
    if (!pools || !Array.isArray(pools)) return null;
    return pools.reduce((nearest: CommunityPool | null, pool: CommunityPool) => {
      if (!pool.nextPayoutDate) return nearest;
      if (!nearest || new Date(pool.nextPayoutDate) < new Date(nearest.nextPayoutDate)) {
        return pool;
      }
      return nearest;
    }, null);
  };

  const getTimeUntilPayout = (dateString: string) => {
    const now = new Date();
    const payout = new Date(dateString);
    const diff = payout.getTime() - now.getTime();
    
    if (diff <= 0) return "Payout ready";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h`;
  };

  const nextPayoutPool = getNextPayoutPool();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-secondary rounded"></div>
                  <div className="h-4 bg-secondary rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Community Pool Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary mb-2">
              ${parseInt(getTotalTVL()).toLocaleString()}K
            </div>
            <div className="text-sm text-muted-foreground">Total Value Locked</div>
            <div className="text-xs text-primary mt-1">+12.5% this week</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-chart-2 mb-2">
              {getTotalMembers().toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Active Members</div>
            <div className="text-xs text-primary mt-1">+38 new today</div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold countdown mb-2">
              {nextPayoutPool ? getTimeUntilPayout(nextPayoutPool.nextPayoutDate) : "N/A"}
            </div>
            <div className="text-sm text-muted-foreground">Next Payout</div>
            <div className="text-xs text-chart-3 mt-1">
              {nextPayoutPool?.name || "No active pools"}
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-primary mb-2">$127K</div>
            <div className="text-sm text-muted-foreground">Total Payouts</div>
            <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pools" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-900/60">
          <TabsTrigger value="pools" className="data-[state=active]:bg-blue-600">Pool Management</TabsTrigger>
          <TabsTrigger value="vrf" className="data-[state=active]:bg-blue-600 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            VRF Rewards
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-6 mt-6">

      {/* Pool Management & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Pools */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Pools</CardTitle>
              <Button className="bg-primary hover:bg-primary/80">
                <Plus className="h-4 w-4 mr-2" />
                Create Pool
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(pools as CommunityPool[])?.slice(0, 2).map((pool: CommunityPool) => (
                <div key={pool.poolId} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium">{pool.name}</div>
                      <div className="text-sm text-muted-foreground">{pool.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <Badge className="bg-primary/20 text-primary">Eligible</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Your Stake</div>
                      <div className="font-medium">$500</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pool TVL</div>
                      <div className="font-medium">${parseInt(pool.totalValueLocked).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Members</div>
                      <div className="font-medium">{pool.memberCount}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">Sarah M. joined Dallas Drought Relief</div>
                  <div className="text-xs text-muted-foreground">2 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-3/20 rounded-full flex items-center justify-center">
                  <Activity className="h-4 w-4 text-chart-3" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">New governance proposal created</div>
                  <div className="text-xs text-muted-foreground">5 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-2/20 rounded-full flex items-center justify-center">
                  <Coins className="h-4 w-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">Payout distributed: $12,500</div>
                  <div className="text-xs text-muted-foreground">1 day ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <UserPlus className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">Marcus R. joined Texas Flood Protection</div>
                  <div className="text-xs text-muted-foreground">3 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-chart-2/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-chart-2" />
                </div>
                <div className="flex-1">
                  <div className="text-sm">$2,800 stake added to Drought Relief</div>
                  <div className="text-xs text-muted-foreground">6 hours ago</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Eligibility Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Payout Eligibility Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="pool-select">Select Pool</Label>
                <select 
                  id="pool-select"
                  value={selectedPoolId}
                  onChange={(e) => setSelectedPoolId(e.target.value)}
                  className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground"
                >
                  {(pools as CommunityPool[])?.map((pool: CommunityPool) => (
                    <option key={pool.poolId} value={pool.poolId}>
                      {pool.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="stake-amount">Your Stake ($)</Label>
                <Input 
                  id="stake-amount"
                  type="number" 
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Pool Total ($)</Label>
                <Input 
                  value={(pools as CommunityPool[])?.find((p: CommunityPool) => p.poolId === selectedPoolId)?.totalValueLocked || "0"}
                  readOnly
                  className="mt-1 bg-muted"
                />
              </div>
            </div>
            
            <div className="bg-secondary/30 rounded-lg p-4">
              <h4 className="font-medium mb-3">Estimated Payout</h4>
              <div className="text-2xl font-bold text-primary mb-2">
                ${(payoutCalculation as any)?.estimatedPayout?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-muted-foreground mb-4">If next payout is triggered</div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Your share:</span>
                  <span>{(payoutCalculation as any)?.userShare?.toFixed(2) || "0.00"}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pool multiplier:</span>
                  <span>{(payoutCalculation as any)?.multiplier || "1.00"}x</span>
                </div>
                <div className="flex justify-between">
                  <span>Trigger condition:</span>
                  <span className="text-xs">{(payoutCalculation as any)?.triggerCondition || "N/A"}</span>
                </div>
              </div>
              
              {isAlreadyMember() ? (
                <div className="w-full mt-4 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-center text-green-700 dark:text-green-300">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Already a Member
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 text-center mt-1">
                    You're participating in this pool
                  </div>
                </div>
              ) : (
                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/80"
                  onClick={handleJoinPool}
                  disabled={joinPoolMutation.isPending || !stakeAmount || parseFloat(stakeAmount) <= 0}
                >
                  {joinPoolMutation.isPending ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Joining Pool...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Join Pool (${stakeAmount})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="vrf" className="space-y-6 mt-6">
          <VRFRandomnessComponent poolId={selectedPoolId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
