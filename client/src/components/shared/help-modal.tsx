import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Search, 
  TrendingUp, 
  Users, 
  Bot, 
  CheckCircle, 
  Info,
  BookOpen,
  Play,
  HelpCircle
} from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const steps = [
    {
      icon: <Wallet className="h-6 w-6 text-primary" />,
      title: "1. Connect Your Wallet",
      description: "Connect your MetaMask or other EVM wallet to Flow EVM testnet to start trading.",
      details: [
        "Click 'Connect Wallet' in the top right",
        "Select MetaMask or your preferred wallet",
        "Approve the connection to Flow EVM Testnet",
        "Get testnet FLOW tokens from the faucet if needed"
      ]
    },
    {
      icon: <Search className="h-6 w-6 text-chart-2" />,
      title: "2. Choose Your City",
      description: "Search for any of 500+ supported cities to trade rainfall options.",
      details: [
        "Use the city search bar at the top",
        "Select from Dallas, Houston, Austin, and 500+ more",
        "View real-time weather data and 30-day trends",
        "Check data source and verification status"
      ]
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-chart-3" />,
      title: "3. Analyze Options",
      description: "Use our AI assistant and Greeks to find optimal strikes and understand risk.",
      details: [
        "Review the options chain with calls and puts",
        "Hover over Greeks badges for explanations",
        "Check AI insights and recommendations",
        "Analyze 30-day rainfall trends and strike levels"
      ]
    },
    {
      icon: <Users className="h-6 w-6 text-chart-4" />,
      title: "4. Join Community Pools",
      description: "Participate in mutual aid pools for collective risk sharing and governance.",
      details: [
        "Browse active community pools",
        "Calculate your potential payouts",
        "Join pools that match your risk profile",
        "Participate in governance voting"
      ]
    }
  ];

  const features = [
    {
      icon: <Bot className="h-5 w-5 text-chart-5" />,
      title: "AI Trading Assistant",
      description: "Get intelligent trade recommendations with confidence levels and risk analysis."
    },
    {
      icon: <Info className="h-5 w-5 text-chart-2" />,
      title: "Greeks Education",
      description: "Learn about Delta, Theta, Gamma, and Vega with weather-specific examples."
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
      title: "Data Transparency",
      description: "All weather data is verified and sourced from WeatherXM via Chainlink Oracle."
    }
  ];

  const faqs = [
    {
      question: "What are weather options?",
      answer: "Weather options are financial derivatives that pay out based on weather events like rainfall. They help farmers, businesses, and individuals hedge against weather risks."
    },
    {
      question: "How does settlement work?",
      answer: "Options settle automatically based on verified weather data from WeatherXM. Payouts are distributed according to the contract terms and actual weather conditions."
    },
    {
      question: "What are community pools?",
      answer: "Community pools are mutual aid funds where members collectively share weather risks. Members stake funds and receive payouts when trigger conditions are met."
    },
    {
      question: "How accurate is the AI assistant?",
      answer: "Our AI has 94% price accuracy and 92% weather prediction accuracy. It uses Monte Carlo simulations and historical data for recommendations."
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Play className="h-6 w-6 text-primary" />
            Getting Started with SkyHedge
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Welcome to Weather Derivatives Trading</h3>
            <p className="text-muted-foreground">
              Trade rainfall options, join community pools, and use AI-powered insights to hedge against weather risks. 
              Follow these steps to get started on Flow EVM.
            </p>
          </div>

          {/* Getting Started Steps */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Start Guide</h3>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                    <ul className="space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-primary flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {feature.icon}
                    <h4 className="font-medium">{feature.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Concepts */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Understanding Weather Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-medium text-primary mb-2">Call Options</h4>
                  <p className="text-sm text-muted-foreground">
                    Bet that rainfall will exceed the strike price. Profits when it rains more than expected.
                  </p>
                </div>
                <div className="bg-chart-4/10 border border-chart-4/20 rounded-lg p-4">
                  <h4 className="font-medium text-chart-4 mb-2">Put Options</h4>
                  <p className="text-sm text-muted-foreground">
                    Bet that rainfall will be below the strike price. Profits during dry periods.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-4">
                  <h4 className="font-medium text-chart-2 mb-2">Strike Price</h4>
                  <p className="text-sm text-muted-foreground">
                    The rainfall amount (in mm) that determines if your option pays out.
                  </p>
                </div>
                <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-4">
                  <h4 className="font-medium text-chart-3 mb-2">Premium</h4>
                  <p className="text-sm text-muted-foreground">
                    The cost to buy the option, determined by AI pricing models and market demand.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-chart-2" />
                    {faq.question}
                  </h4>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Network Information */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-chart-2" />
              Network Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Network:</span>
                <div className="font-medium">Flow EVM Testnet</div>
              </div>
              <div>
                <span className="text-muted-foreground">Chain ID:</span>
                <div className="font-medium">747</div>
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span>
                <div className="font-medium">FLOW</div>
              </div>
              <div>
                <span className="text-muted-foreground">Explorer:</span>
                <div className="font-medium">evm-testnet.flowscan.io</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onClose} className="flex-1 bg-primary hover:bg-primary/80">
              <Play className="h-4 w-4 mr-2" />
              Start Trading
            </Button>
            <Button variant="outline" className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Read Documentation
            </Button>
            <Button variant="outline" className="flex-1">
              <Users className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
