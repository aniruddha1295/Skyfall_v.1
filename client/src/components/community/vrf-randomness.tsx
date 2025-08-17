import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, ExternalLink, Shield, Zap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface VRFRequest {
  requestId: string;
  poolId: string;
  drawType: 'weekly' | 'monthly';
  participants: string[];
  stakes: string[];
  timestamp: number;
  transactionHash?: string;
  fulfilled: boolean;
  randomWords?: string[];
  winners?: Array<{
    address: string;
    reward: string;
    tier: 'grand_prize' | 'weekly_reward';
  }>;
}

interface StakingDraw {
  drawId: string;
  poolId: string;
  type: 'weekly_proportional' | 'monthly_grand_prize';
  totalStaked: string;
  participantCount: number;
  vrfRequestId: string;
  scheduledTime: number;
  status: 'pending' | 'requested' | 'fulfilled' | 'distributed';
  winners: Array<{
    address: string;
    stake: string;
    reward: string;
    tier: string;
  }>;
  proofData: {
    transactionHash: string;
    blockNumber: number;
    randomSeed: string;
    verificationUrl: string;
  };
}

interface ProofOfFairness {
  requestId: string;
  transactionHash: string;
  blockNumber: number;
  randomSeed: string;
  participants: string[];
  algorithm: string;
  verificationSteps: string[];
  flareExplorerUrl: string;
}

export function VRFRandomnessComponent({ poolId }: { poolId: string }) {
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch VRF requests for the pool
  const { data: vrfRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/vrf/pool', poolId, 'requests'],
    refetchInterval: 5000 // Poll every 5 seconds for live updates
  });

  // Fetch scheduled draws
  const { data: scheduledDraws = [], isLoading: drawsLoading } = useQuery({
    queryKey: ['/api/vrf/pool', poolId, 'draws'],
    refetchInterval: 10000
  });

  // Fetch VRF health status
  const { data: vrfHealth } = useQuery({
    queryKey: ['/api/vrf/health'],
    refetchInterval: 30000
  });

  // Request new draw mutation
  const requestDrawMutation = useMutation({
    mutationFn: async ({ drawType }: { drawType: 'weekly' | 'monthly' }) => {
      const response = await fetch('/api/vrf/request-draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          drawType,
          participants: ['0x742d35Cc6ABfC0532F3686521FDF63F7d0B8E1d', '0x8ba1f109551bD432803012645Hac136c9.', '0x123...abc'],
          stakes: ['100.0', '250.0', '150.0']
        })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vrf/pool', poolId, 'requests'] });
    }
  });

  // Schedule draws mutation
  const scheduleDrawsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/vrf/pool/${poolId}/schedule`, {
        method: 'POST'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vrf/pool', poolId, 'draws'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'bg-green-500';
      case 'requested': return 'bg-yellow-500';
      case 'pending': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <CheckCircle className="h-4 w-4" />;
      case 'requested': return <Zap className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatTimeUntil = (timestamp: number) => {
    const now = Date.now();
    const diff = timestamp - now;
    if (diff <= 0) return 'Now';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* VRF Health Status */}
      <Card className="bg-gray-900/40 border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Chainlink VRF Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Flare EVM Verifiable Randomness Function
              </CardDescription>
            </div>
            <Badge variant={vrfHealth?.status === 'healthy' ? 'default' : 'destructive'}>
              {vrfHealth?.status || 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Flare Connection</div>
              <div className={`font-medium ${vrfHealth?.flareConnection ? 'text-green-400' : 'text-red-400'}`}>
                {vrfHealth?.flareConnection ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Pending Requests</div>
              <div className="text-white font-medium">{vrfHealth?.pendingRequests || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Scheduled Draws</div>
              <div className="text-white font-medium">{vrfHealth?.scheduledDraws || 0}</div>
            </div>
            <div>
              <div className="text-gray-400">Last Activity</div>
              <div className="text-white font-medium">
                {vrfHealth?.lastActivity ? new Date(vrfHealth.lastActivity).toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900/60">
          <TabsTrigger value="live" className="data-[state=active]:bg-blue-600">Live Draws</TabsTrigger>
          <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-600">Scheduled</TabsTrigger>
          <TabsTrigger value="proof" className="data-[state=active]:bg-blue-600">Proof of Fairness</TabsTrigger>
        </TabsList>

        {/* Live VRF Draws */}
        <TabsContent value="live" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Live Randomness Generation</h3>
            <div className="space-x-2">
              <Button 
                size="sm" 
                onClick={() => requestDrawMutation.mutate({ drawType: 'weekly' })}
                disabled={requestDrawMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Request Weekly Draw
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => requestDrawMutation.mutate({ drawType: 'monthly' })}
                disabled={requestDrawMutation.isPending}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Request Monthly Draw
              </Button>
            </div>
          </div>

          {requestsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-gray-900/40 border-gray-800">
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(vrfRequests as any[]).map((request: any) => (
                <Card key={request.requestId} className="bg-gray-900/40 border-gray-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant={request.fulfilled ? 'default' : 'secondary'}>
                          {request.drawType} Draw
                        </Badge>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(request.fulfilled ? 'fulfilled' : 'requested')}
                          <span className="text-sm text-gray-400">
                            {request.fulfilled ? 'Completed' : 'Generating...'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(request.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {!request.fulfilled && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Randomness Generation</span>
                          <span className="text-blue-400">In Progress...</span>
                        </div>
                        <Progress value={request.progress || 65} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400">Request ID</div>
                        <div className="text-white font-mono text-xs">
                          {request.requestId.slice(0, 12)}...
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Participants</div>
                        <div className="text-white">{request.participants.length}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Transaction</div>
                        <div className="text-white">
                          {request.transactionHash ? (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 h-auto text-blue-400 hover:text-blue-300"
                              onClick={() => window.open(`https://testnet.evm.nodes.onflow.org/tx/${request.transactionHash}`, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          ) : (
                            <span className="text-gray-500">Pending</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Winners</div>
                        <div className="text-white">{request.winners?.length || 0}</div>
                      </div>
                    </div>

                    {request.fulfilled && request.winners && request.winners.length > 0 && (
                      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                        <h4 className="text-sm font-medium text-white mb-2">Winners Selected</h4>
                        <div className="space-y-2">
                          {request.winners.map((winner, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300 font-mono">
                                {winner.address.slice(0, 6)}...{winner.address.slice(-4)}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant={winner.tier === 'grand_prize' ? 'default' : 'secondary'}>
                                  {winner.tier === 'grand_prize' ? 'Grand Prize' : 'Weekly Reward'}
                                </Badge>
                                <span className="text-green-400 font-medium">{winner.reward} USDF</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {request.fulfilled && (
                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRequestId(request.requestId)}
                          className="border-gray-600 text-white hover:bg-gray-800"
                        >
                          View Proof of Fairness
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {vrfRequests.length === 0 && (
                <Card className="bg-gray-900/40 border-gray-800">
                  <CardContent className="p-8 text-center">
                    <Zap className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Draws</h3>
                    <p className="text-gray-400 mb-4">
                      Request a new randomness generation for fair reward distribution
                    </p>
                    <Button 
                      onClick={() => requestDrawMutation.mutate({ drawType: 'weekly' })}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start Weekly Draw
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Scheduled Draws */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Automatic Draw Schedule</h3>
            <Button 
              size="sm" 
              onClick={() => scheduleDrawsMutation.mutate()}
              disabled={scheduleDrawsMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              Schedule Draws
            </Button>
          </div>

          <div className="space-y-4">
            {(scheduledDraws as any[]).map((draw: any) => (
              <Card key={draw.id} className="bg-gray-900/40 border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={draw.type === 'monthly' ? 'default' : 'secondary'}>
                        {draw.type === 'monthly' ? 'Monthly Grand Prize' : draw.type === 'emergency' ? 'Emergency Draw' : 'Weekly Proportional'}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(draw.status)}`}></div>
                        <span className="text-sm text-gray-400 capitalize">{draw.status}</span>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-blue-400">
                      {formatTimeUntil(draw.scheduledTime)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Scheduled Time</div>
                      <div className="text-white">
                        {new Date(draw.scheduledTime).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Participants</div>
                      <div className="text-white">{draw.eligibleParticipants}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Reward Pool</div>
                      <div className="text-white">{draw.rewardPool} USDF</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Est. Winners</div>
                      <div className="text-white">{draw.estimatedWinners}</div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-gray-800/30 rounded text-xs text-gray-300">
                    {draw.description}
                  </div>
                </CardContent>
              </Card>
            ))}

            {scheduledDraws.length === 0 && (
              <Card className="bg-gray-900/40 border-gray-800">
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Scheduled Draws</h3>
                  <p className="text-gray-400 mb-4">
                    Set up automatic weekly and monthly draws for this pool
                  </p>
                  <Button 
                    onClick={() => scheduleDrawsMutation.mutate()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Schedule Automatic Draws
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Proof of Fairness */}
        <TabsContent value="proof" className="space-y-4">
          <ProofOfFairnessDisplay requestId={selectedRequestId || "0x1a2b3c4d5e6f7890abcdef1234567890abcdef12"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProofOfFairnessDisplay({ requestId }: { requestId: string }) {
  const { data: proof, isLoading } = useQuery({
    queryKey: ['/api/vrf/proof', requestId],
    enabled: !!requestId
  });

  if (!requestId) {
    return (
      <Card className="bg-gray-900/40 border-gray-800">
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Select a Completed Draw</h3>
          <p className="text-gray-400">
            Choose a fulfilled VRF request from the Live Draws tab to view its proof of fairness
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 border-gray-800">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!proof) {
    return (
      <Card className="bg-gray-900/40 border-gray-800">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Proof Not Available</h3>
          <p className="text-gray-400">
            The selected request is either not fulfilled or proof data is not yet available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/40 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Proof of Fairness Verification
          </CardTitle>
          <CardDescription className="text-gray-400">
            Cryptographic proof that the randomness generation was fair and tamper-proof
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Randomness Source</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Request ID:</span>
                  <span className="text-white font-mono">{proof.requestId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Block Number:</span>
                  <span className="text-white">{proof.blockNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Random Seed:</span>
                  <span className="text-white font-mono text-xs">
                    {proof.randomSeed.slice(0, 16)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-white">{proof.participants.length}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-white mb-3">Algorithm</h4>
              <div className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded">
                {proof.algorithm}
              </div>
              <Button
                variant="link"
                size="sm"
                className="p-0 mt-2 text-blue-400 hover:text-blue-300"
                onClick={() => window.open(proof.flareExplorerUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on Flare Explorer
              </Button>
            </div>
          </div>

          {/* Verification Steps */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Verification Process</h4>
            <div className="space-y-3">
              {proof.verificationSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <div className="text-sm text-gray-300">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Link */}
          <div className="p-4 bg-green-900/20 border border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">Verification Complete</span>
            </div>
            <p className="text-sm text-gray-300">
              This randomness generation has been cryptographically verified on the Flare EVM blockchain.
              All data is publicly auditable and tamper-proof.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}