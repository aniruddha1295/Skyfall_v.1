import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Vote, Clock, CheckCircle, XCircle, Users, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GovernanceProposal {
  id: number;
  proposalId: string;
  poolId: string;
  title: string;
  description: string;
  proposalType: string;
  proposedValue: string;
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function Governance() {
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [selectedPoolId] = useState("dallas_drought_relief"); // Default pool
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["/api/governance/proposals", selectedPoolId],
    refetchInterval: 30000
  });

  const { data: pools } = useQuery({
    queryKey: ["/api/pools"],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: string; vote: "for" | "against" }) => {
      return apiRequest("POST", "/api/governance/vote", {
        proposalId,
        userId: 1, // Mock user ID
        vote,
        votingPower: 100 // Mock voting power based on stake
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/governance/proposals"] });
      toast({
        title: "Vote Cast",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleVote = (proposalId: string, vote: "for" | "against") => {
    voteMutation.mutate({ proposalId, vote });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };

  const getVotePercentage = (votesFor: number, totalVotes: number) => {
    if (totalVotes === 0) return 0;
    return (votesFor / totalVotes) * 100;
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-chart-3/20 text-chart-3";
      case "passed": return "bg-primary/20 text-primary";
      case "failed": return "bg-chart-4/20 text-chart-4";
      default: return "bg-secondary/20 text-secondary-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Governance & Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Governance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-primary mb-2">
              {proposals?.filter((p: GovernanceProposal) => p.status === "active").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Proposals</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-chart-2 mb-2">
              {proposals?.reduce((sum: number, p: GovernanceProposal) => sum + p.totalVotes, 0) || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Votes Cast</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-chart-3 mb-2">
              {proposals?.filter((p: GovernanceProposal) => p.status === "passed").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Proposals Passed</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Proposals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Active Proposals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {proposals?.filter((proposal: GovernanceProposal) => proposal.status === "active").map((proposal: GovernanceProposal) => {
              const yesPercentage = getVotePercentage(proposal.votesFor, proposal.totalVotes);
              const noPercentage = getVotePercentage(proposal.votesAgainst, proposal.totalVotes);
              
              return (
                <div key={proposal.proposalId} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{proposal.title}</h4>
                        <Badge className={getProposalStatusColor(proposal.status)}>
                          {proposal.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{proposal.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeRemaining(proposal.expiresAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {proposal.totalVotes} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {proposal.proposalType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vote Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Yes: {yesPercentage.toFixed(1)}% ({proposal.votesFor})
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-chart-4" />
                        No: {noPercentage.toFixed(1)}% ({proposal.votesAgainst})
                      </span>
                    </div>
                    
                    <div className="relative">
                      <Progress value={yesPercentage} className="h-3" />
                      <div 
                        className="absolute top-0 right-0 h-3 bg-chart-4 rounded-r-full" 
                        style={{ width: `${noPercentage}%` }}
                      />
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => handleVote(proposal.proposalId, "for")}
                        disabled={voteMutation.isPending}
                        className="bg-primary hover:bg-primary/80 flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Vote Yes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVote(proposal.proposalId, "against")}
                        disabled={voteMutation.isPending}
                        className="border-chart-4 text-chart-4 hover:bg-chart-4/10 flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Vote No
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {(!proposals || proposals.filter((p: GovernanceProposal) => p.status === "active").length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active proposals at this time.</p>
                <p className="text-sm">Check back later or create a new proposal.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Governance Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Governance Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <div>
                <div className="font-medium text-sm">Proposal "Reduce payout threshold" created</div>
                <div className="text-xs text-muted-foreground">Dallas Drought Relief Pool • 2 hours ago</div>
              </div>
              <Badge className="bg-chart-3/20 text-chart-3">New</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <div>
                <div className="font-medium text-sm">Proposal "Increase pool cap" passed</div>
                <div className="text-xs text-muted-foreground">Texas Flood Protection Pool • 1 day ago</div>
              </div>
              <Badge className="bg-primary/20 text-primary">Passed</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
              <div>
                <div className="font-medium text-sm">127 votes cast on threshold proposal</div>
                <div className="text-xs text-muted-foreground">Dallas Drought Relief Pool • 2 days ago</div>
              </div>
              <Badge variant="outline">Voting</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
