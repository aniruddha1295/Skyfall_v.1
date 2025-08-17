import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Bot, 
  Send, 
  Loader2, 
  ArrowRight, 
  CheckCircle, 
  X, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';

export function FlowAISetupEnhanced() {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processTradeQuery = async () => {
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai/process-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId: 1, // Mock user ID
          sessionId: `session_${Date.now()}`
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
      setQuery("");
    } catch (err) {
      console.error('Trade processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process trade request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  // Execute trade mutation
  const executeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await apiRequest('POST', '/api/trade/execute', tradeData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Trade Executed Successfully",
        description: data.message || "Your trade has been executed",
      });
      // Invalidate user positions cache
      queryClient.invalidateQueries({ queryKey: ['/api/users/1/positions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Trade Execution Failed",
        description: error.message || "Failed to execute trade",
        variant: "destructive",
      });
    }
  });

  const handleExecuteTrade = () => {
    if (!response?.tradeRecommendation) return;
    
    const tradeData = {
      userId: 1,
      contractId: "dallas_rain_call_15mm_jan31", // Use actual existing contract ID
      action: response.tradeRecommendation.action || "BUY",
      quantity: 1,
      premium: response.tradeRecommendation.entry || "1.85",
      tradeType: "call"
    };
    
    executeTradeMutation.mutate(tradeData);
  };

  const handleDeclineTrade = () => {
    toast({
      title: "Trade Declined",
      description: "Trade recommendation declined",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Status */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-chart-5/10 to-chart-1/10 rounded-lg border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 bg-chart-5 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-chart-5">AI Agent Active</span>
          </div>
          <Badge className="bg-chart-5/20 text-chart-5">Marcus Rodriguez</Badge>
          <Badge variant="outline" className="text-xs">Professional Trader</Badge>
        </div>
        <div className="text-sm text-muted-foreground">Flow AI v2.1</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Trading Interface */}
        <div className="lg:col-span-2 space-y-4">
          {/* Natural Language Trading Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Natural Language Trading</CardTitle>
              <CardDescription className="text-sm">
                Describe your trading strategy in plain English. Marcus will analyze market conditions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Example: 'I want to trade high probability rainfall options for Dallas this week with conservative risk management'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[80px] resize-none text-sm"
                disabled={isProcessing}
              />
              <Button 
                onClick={processTradeQuery}
                disabled={!query.trim() || isProcessing}
                className="w-full"
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Get AI Analysis
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Strategy Examples */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Strategy Examples</CardTitle>
              <CardDescription className="text-sm">
                Click on any example to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  {
                    title: "Farmer Flood Hedge",
                    query: "I'm a farmer and I want to hedge against floods in Texas. Need protection for my crops with affordable premium costs.",
                    description: "Agricultural risk management"
                  },
                  {
                    title: "Budget-Constrained Trade",
                    query: "I want high probability trade with max loss $1.50, max utilized buying power for options $3.00",
                    description: "Strict capital limits"
                  },
                  {
                    title: "Ranch Drought Protection",
                    query: "I own a cattle ranch in Dallas area and need drought insurance through rainfall options to protect my livestock water supply",
                    description: "Livestock risk hedging"
                  },
                  {
                    title: "Small Investor Strategy",
                    query: "I have $500 total budget and want to trade weather options with maximum $50 risk per trade for steady income",
                    description: "Retail investor approach"
                  },
                  {
                    title: "Construction Site Protection",
                    query: "Managing outdoor construction project delays due to rain. Need coverage for next 2 weeks, budget $200, medium risk tolerance",
                    description: "Infrastructure weather risk"
                  },
                  {
                    title: "Golf Course Revenue Hedge",
                    query: "Golf course losing revenue during rainy weekends. Want to hedge weekend rainfall risk, $400 capital, 45-day protection period",
                    description: "Recreation business insurance"
                  },
                  {
                    title: "Event Planning Insurance",
                    query: "Planning outdoor wedding venue events. Need rainfall insurance for peak season, budget $150, high importance protection",
                    description: "Special event protection"
                  },
                  {
                    title: "Solar Farm Optimization",
                    query: "Solar installation needs clear weather forecast hedging. Looking for anti-rainfall positions, $600 capital, quarterly strategy",
                    description: "Energy sector hedging"
                  }
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    onClick={() => handleExampleClick(example.query)}
                    className="h-auto p-3 text-left justify-start"
                    disabled={isProcessing}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="h-3 w-3 text-chart-5" />
                        <span className="font-medium text-sm">{example.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {example.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Professional Recommendation - Moved here for better accessibility */}
          {response && response.tradeRecommendation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Professional Recommendation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-medium text-primary">
                        {response.tradeRecommendation.action || "BUY"} Signal
                      </span>
                    </div>
                    <Badge className="bg-primary/20 text-primary">
                      {response.confidence || "85"}% Confidence
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    {response.tradeRecommendation.reasoning || "Favorable weather patterns and technical indicators suggest high probability setup"}
                  </div>

                  {/* Trade Parameters */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-primary/20">
                    <div>
                      <div className="text-xs font-medium text-primary">Entry:</div>
                      <div className="text-sm">{response.tradeRecommendation.entry || "15mm Strike"}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-primary">Risk/Reward:</div>
                      <div className="text-sm">{response.tradeRecommendation.riskReward || "1:2.5"}</div>
                    </div>
                  </div>
                </div>
                
                {/* Execute Trade Buttons - More prominent positioning */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    className="bg-primary hover:bg-primary/90" 
                    size="sm"
                    onClick={handleExecuteTrade}
                    disabled={executeTradeMutation.isPending}
                  >
                    {executeTradeMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Execute Trade
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeclineTrade}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Compact AI Profile & Analysis */}
        <div className="space-y-4">
          {/* Compact AI Trader Profile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/api/placeholder/40/40" />
                  <AvatarFallback className="bg-chart-5/20 text-chart-5 font-bold text-xs">MR</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm font-bold">Marcus Rodriguez</div>
                  <div className="text-xs text-muted-foreground">Senior Weather Derivatives Trader</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-chart-5">94.2%</div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-chart-2">2.8:1</div>
                  <div className="text-xs text-muted-foreground">Avg R:R</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis - Compact */}
          {response && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-sm">
                  <Bot className="h-4 w-4 text-chart-5" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {response.response || "Processing market analysis..."}
                  </div>
                </div>
                
                {/* Compact Additional Insights */}
                <div className="space-y-2">
                  <div className="text-xs font-medium">Key Insights:</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="h-1.5 w-1.5 bg-chart-2 rounded-full"></div>
                      <span>Weather patterns favor precipitation</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="h-1.5 w-1.5 bg-chart-3 rounded-full"></div>
                      <span>Volatility below historical averages</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="h-1.5 w-1.5 bg-chart-5 rounded-full"></div>
                      <span>Strong technical confirmation</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Market Status - Compact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Live Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Agent</span>
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 bg-chart-5 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-chart-5">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Speed</span>
                <span className="text-xs font-medium">&lt; 2s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Sources</span>
                <span className="text-xs font-medium">WeatherXM +5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Analysis Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}