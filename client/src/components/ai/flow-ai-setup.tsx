import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, Clock, CheckCircle, X, ArrowRight } from 'lucide-react';

interface TradeRecommendation {
  contractType: string;
  strategy: string;
  underlying: string;
  location?: string;
  stationId?: string;
  strikePrice?: number;
  premium: number;
  quantity: number;
  expiryDate: string;
  reasoning: string;
  riskAssessment: string;
  entryConditions: string[];
  exitConditions: string[];
  maxLoss: number;
  potentialProfit: number;
  probability: number;
  tradeSetup?: string;
  greeksAnalysis?: string;
}

interface NLPTradeResponse {
  parameters: {
    maxLoss: number;
    duration: number;
    capital: number;
    tradeType: string;
    underlying?: string;
    city?: string;
    strategy?: string;
  };
  recommendations: TradeRecommendation[];
  automatedRules: string[];
  response: string;
}

export function FlowAISetup() {
  const [tradeInput, setTradeInput] = useState("");
  const [acceptedTrades, setAcceptedTrades] = useState<Set<number>>(new Set());

  const processTradeRequest = useMutation({
    mutationFn: async (input: string): Promise<NLPTradeResponse> => {
      return apiRequest('/api/ai/process-trade', {
        method: 'POST',
        body: { query: input }
      });
    },
  });

  const handleAcceptTrade = (trade: TradeRecommendation, index: number) => {
    setAcceptedTrades(new Set([...acceptedTrades, index]));
    console.log('Trade accepted:', trade);
  };

  const handleRejectTrade = (trade: TradeRecommendation, index: number) => {
    console.log('Trade rejected:', trade);
  };

  const handleTradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tradeInput.trim()) {
      processTradeRequest.mutate(tradeInput);
      setTradeInput("");
    }
  };

  const examples = [
    "I want to trade high probability trade, with max loss $1.75 duration 15 days capital to use $5",
    "Conservative rainfall strategy for Dallas, $10 capital, max loss $2, 30 days",
  ];

  return (
    <div className="space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="text-xs px-2 py-0">
          Natural Language Trading
        </Badge>
        <span className="text-muted-foreground">Active</span>
      </div>

      {/* Compact Input Form */}
      <form onSubmit={handleTradeSubmit} className="space-y-2">
        <Textarea
          placeholder="Describe your trading strategy..."
          value={tradeInput}
          onChange={(e) => setTradeInput(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
        />
        <Button 
          type="submit" 
          disabled={processTradeRequest.isPending || !tradeInput.trim()}
          size="sm"
          className="w-full h-8"
        >
          {processTradeRequest.isPending ? (
            <>
              <Clock className="h-3 w-3 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-1" />
              Analyze Trade
            </>
          )}
        </Button>
      </form>

      {/* Quick Examples */}
      <div>
        <h4 className="text-xs font-medium mb-1 text-muted-foreground">Quick Examples:</h4>
        <div className="space-y-1">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="w-full text-left h-auto py-1 px-2 justify-start text-xs hover:bg-muted/50"
              onClick={() => setTradeInput(example)}
            >
              <ArrowRight className="h-2 w-2 mr-1 flex-shrink-0" />
              <span className="truncate">{example.substring(0, 40)}...</span>
            </Button>
          ))}
        </div>
      </div>

      {/* AI Response - Compact */}
      {processTradeRequest.data && (
        <div className="mt-3 p-2 bg-muted/50 rounded-md">
          <div className="flex items-center gap-1 mb-2">
            <Bot className="h-3 w-3 text-primary" />
            <span className="text-xs font-medium">AI Analysis</span>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs">
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <div>Max Loss: ${processTradeRequest.data.parameters.maxLoss}</div>
                <div>Days: {processTradeRequest.data.parameters.duration}</div>
                <div>Capital: ${processTradeRequest.data.parameters.capital}</div>
                <div>Type: {processTradeRequest.data.parameters.tradeType}</div>
              </div>
            </div>
            
            {processTradeRequest.data.recommendations && processTradeRequest.data.recommendations.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium">Recommendations:</h5>
                {processTradeRequest.data.recommendations.slice(0, 2).map((rec: TradeRecommendation, index: number) => (
                  <div key={index} className="border rounded p-2 bg-background/50">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {rec.strategy.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptTrade(rec, index)}
                          className="h-5 px-2 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-2 w-2" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectTrade(rec, index)}
                          className="h-5 px-2 text-xs"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs space-y-0.5 text-muted-foreground">
                      <div>{rec.location} • ${rec.premium}</div>
                      <div>Max Loss: ${rec.maxLoss} • Profit: ${rec.potentialProfit}</div>
                      <div className="text-xs mt-1 truncate">{rec.reasoning}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}