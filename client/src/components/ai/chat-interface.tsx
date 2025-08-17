import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, TrendingUp, AlertTriangle, Info } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
  tradeRecommendation?: any;
}

interface ChatInterfaceProps {
  selectedCity: {
    city: string;
    state: string;
    stationId: string;
  };
}

export default function ChatInterface({ selectedCity }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hello! I'm your AI trading assistant. I can help you analyze weather patterns, suggest optimal strikes, and calculate risk metrics. What would you like to know?",
      timestamp: new Date(),
      confidence: 1.0
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/ai/chat", {
        query,
        userId: 1, // Mock user ID
        sessionId,
        stationId: selectedCity.stationId
      });
      return response.json();
    },
    onSuccess: (data) => {
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: data.response,
        timestamp: new Date(),
        confidence: data.confidence,
        tradeRecommendation: data.tradeRecommendation
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: () => {
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: "assistant",
        content: "I'm sorry, I'm experiencing technical difficulties. Please try again later.",
        timestamp: new Date(),
        confidence: 0.1
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputValue);
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const TradeRecommendationCard = ({ recommendation }: { recommendation: any }) => (
    <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Trade Recommendation</span>
        <Badge className="bg-primary/20 text-primary text-xs">
          {(recommendation.confidence * 100).toFixed(0)}% confidence
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">Type:</span>
          <span className="ml-1 font-medium">{recommendation.contractType} @ {recommendation.strikePrice}mm</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max Gain:</span>
          <span className="ml-1 font-medium text-primary">${recommendation.maxGain}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max Loss:</span>
          <span className="ml-1 font-medium text-chart-4">${recommendation.maxLoss}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Prob. Profit:</span>
          <span className="ml-1 font-medium">{(recommendation.probabilityOfProfit * 100).toFixed(0)}%</span>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        <strong>Reasoning:</strong> {recommendation.reasoning}
      </div>
    </div>
  );

  const MessageBubble = ({ message }: { message: ChatMessage }) => (
    <div className={cn(
      "flex items-start gap-3",
      message.type === "user" ? "justify-end" : "justify-start"
    )}>
      {message.type === "assistant" && (
        <div className="w-8 h-8 bg-chart-5/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="h-4 w-4 text-chart-5" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] rounded-lg p-3",
        message.type === "user" 
          ? "bg-primary/20 text-foreground" 
          : "bg-secondary/50 text-foreground"
      )}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        
        {message.confidence !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-border text-foreground">
              Confidence: {(message.confidence * 100).toFixed(0)}%
            </div>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
        
        {message.tradeRecommendation && (
          <TradeRecommendationCard recommendation={message.tradeRecommendation} />
        )}
      </div>
      
      {message.type === "user" && (
        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );

  const suggestedQueries = [
    "What's the best strike for Dallas rainfall options this week?",
    "Analyze current weather patterns for trading opportunities",
    "Show me a conservative trade with limited downside",
    "What's the probability of rain exceeding 20mm next week?"
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-chart-5" />
            AI Trading Assistant
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-chart-5 rounded-full animate-pulse"></div>
            <span className="text-chart-5 text-sm">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto bg-secondary/20 rounded-lg p-4 mb-4 space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {chatMutation.isPending && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-chart-5/20 rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-chart-5" />
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-chart-5"></div>
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Suggested Queries */}
        {messages.length === 1 && (
          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">Try asking:</div>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInputValue(query)}
                  className="text-xs"
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Chat Input */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about weather patterns, option strategies, or risk analysis..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || chatMutation.isPending}
            className="bg-chart-5 hover:bg-chart-5/80"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* AI Disclaimer */}
        <div className="mt-3 p-2 bg-chart-3/10 border border-chart-3/20 rounded text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>AI Assistant Disclaimer:</span>
          </div>
          <p className="mt-1">
            AI recommendations are for informational purposes only. Always conduct your own research 
            and consider your risk tolerance before making trading decisions.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
