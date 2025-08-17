import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  CloudRain, 
  Search, 
  HelpCircle, 
  Wallet, 
  TrendingUp, 
  Users, 
  Bot,
  Play,
  CheckCircle,
  Activity,
  Settings,
  Wind,
  Droplets,
  BarChart3,
  MapPin,
  Coins
} from "lucide-react";
import { WalletButton } from "@/components/wallet/wallet-button";
import { CITIES } from "@/lib/constants";
import OptionsChainPro from "@/components/trading/options-chain-pro";
import WeatherChart from "@/components/trading/rainfall-chart";
import FuturesTrading from "@/components/trading/futures-trading";
import PoolsOverview from "@/components/community/pools-overview";
import Governance from "@/components/community/governance";
import ChatInterface from "@/components/ai/chat-interface";
import HelpModal from "@/components/shared/help-modal";
import { FlowAISetupEnhanced } from "@/components/ai/flow-ai-setup-enhanced";
import PortfolioOverview from "@/components/portfolio/portfolio-overview";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [activeTab, setActiveTab] = useState("trading");
  const [weatherMetric, setWeatherMetric] = useState<"rainfall" | "wind">("rainfall");
  const [timePeriod, setTimePeriod] = useState(30);
  // Wallet state is now handled by Privy provider

  const { data: weatherData, isLoading: weatherLoading } = useQuery({
    queryKey: [`/api/weather/current/${selectedCity.stationId}`],
    refetchInterval: 30000
  });

  const { data: trendData } = useQuery({
    queryKey: [`/api/weather/trend/${selectedCity.stationId}`, weatherMetric, timePeriod],
    queryFn: async () => {
      const response = await fetch(`/api/weather/trend/${selectedCity.stationId}?metric=${weatherMetric}&period=${timePeriod}`);
      if (!response.ok) throw new Error('Failed to fetch trend data');
      return response.json();
    },
    refetchInterval: 60000
  });

  const { data: marketOverview } = useQuery({
    queryKey: ["/api/market/overview"],
    refetchInterval: 30000
  });

  const { data: aiInsights } = useQuery({
    queryKey: ["/api/ai/insights", selectedCity.stationId],
    refetchInterval: 30000
  });

  const { data: aiAccuracy } = useQuery({
    queryKey: ["/api/ai/accuracy"],
    refetchInterval: 60000
  });

  const filteredCities = CITIES.filter(city =>
    `${city.city}, ${city.state}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (city: typeof CITIES[0]) => {
    setSelectedCity(city);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Brand and Actions */}
          <div className="flex justify-between items-center h-14 border-b border-border/50">
            <div className="flex items-center space-x-2">
              <CloudRain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">SkyFall</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link href="/flare-wind-futures">
                <Button variant="outline" size="sm" className="text-xs">
                  <Wind className="h-4 w-4 mr-1" />
                  Flare Wind Futures
                </Button>
              </Link>
              <Link href="/flow-ai">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Flow AI Agent
                </Button>
              </Link>
              <WalletButton />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHelpModal(true)}
              >
                <HelpCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Bottom Row - City Search and Selected City Display */}
          <div className="flex items-center justify-between h-16">
            {/* Selected City Display */}
            <div className="flex items-center space-x-4 min-w-0">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-lg truncate">
                    {selectedCity.city}, {selectedCity.state}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Station: {selectedCity.stationId}
                  </div>
                </div>
              </div>
            </div>
            
            {/* City Search */}
            <div className="flex-1 max-w-md mx-8 relative">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-base w-full"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Search Results */}
              {searchQuery && filteredCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md mt-1 max-h-60 overflow-y-auto z-50 shadow-lg">
                  {filteredCities.map((city) => (
                    <button
                      key={city.stationId}
                      onClick={() => handleCitySelect(city)}
                      className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-sm border-b border-border last:border-b-0"
                    >
                      <div className="font-medium">{city.city}, {city.state}</div>
                      <div className="text-xs text-muted-foreground">{city.stationId}</div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {searchQuery && filteredCities.length === 0 && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md mt-1 p-4 z-50 shadow-lg">
                  <div className="text-sm text-muted-foreground text-center">
                    No cities found matching "{searchQuery}"
                  </div>
                </div>
              )}
            </div>

            {/* Weather Status Indicator */}
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-muted-foreground">Live Data</span>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Get Started Banner */}
        <div className="bg-gradient-to-r from-primary to-chart-2 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary-foreground">
                New to Weather Options?
              </h3>
              <p className="text-sm text-primary-foreground/90">
                Learn how to trade rainfall derivatives in 3 simple steps
              </p>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => setShowHelpModal(true)}
              className="bg-background text-foreground hover:bg-secondary"
            >
              <Play className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4 bg-secondary p-1">
            <TabsTrigger value="trading" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trading
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 relative">
              <Users className="h-4 w-4" />
              Community
              <Badge variant="secondary" className="ml-1 text-xs bg-chart-3 text-chart-3-foreground">
                New
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="ai-assistant" className="flex items-center gap-2 ai-glow">
              <Bot className="h-4 w-4 text-chart-5" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-6">
            {/* Weather Data Section */}
            <div className="space-y-8">
              {/* Top Weather Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {selectedCity.city}, {selectedCity.state}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {weatherMetric === "rainfall" ? "Chainlink WeatherXM" : "Flare-Openweather"}
                        </Badge>
                      </div>
                      
                      {/* Weather Metric Toggle */}
                      <div className="flex items-center bg-secondary/50 rounded-full p-1 w-fit">
                        <Button
                          variant={weatherMetric === "rainfall" ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-3 rounded-full text-xs transition-all",
                            weatherMetric === "rainfall" 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setWeatherMetric("rainfall")}
                        >
                          <Droplets className="h-3 w-3 mr-1" />
                          Rainfall Index
                        </Button>
                        <Button
                          variant={weatherMetric === "wind" ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-3 rounded-full text-xs transition-all",
                            weatherMetric === "wind" 
                              ? "bg-orange-500 text-white shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setWeatherMetric("wind")}
                        >
                          <Wind className="h-3 w-3 mr-1" />
                          Wind Index
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-3xl font-bold text-primary">
                        {weatherLoading ? "..." : weatherMetric === "rainfall" 
                          ? `${(weatherData as any)?.currentRainfall || 0}mm`
                          : `${(weatherData as any)?.windSpeed || 0} mph`
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {weatherMetric === "rainfall" ? "Last 24 hours" : "Current wind speed"}
                      </div>
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        <span>Verified {(weatherData as any)?.timestamp ? "2 mins ago" : "..."}</span>
                        <span className="ml-auto text-muted-foreground">
                          {(weatherData as any)?.dataHash?.slice(0, 8) || "..."}
                        </span>
                      </div>
                      
                      {/* Rainfall Risk Indicators */}
                      {weatherMetric === "rainfall" && (
                        <div className="space-y-2">
                          {/* Drought Risk */}
                          <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-yellow-600 font-medium">Drought Risk:</span>
                              <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                                {((weatherData as any)?.currentRainfall || 0) > 25 ? "Low" :
                                 ((weatherData as any)?.currentRainfall || 0) > 10 ? "Moderate" :
                                 ((weatherData as any)?.currentRainfall || 0) > 5 ? "High" : "Extreme"}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Flood Risk */}
                          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-blue-600 font-medium">Flood Risk:</span>
                              <Badge variant="outline" className="text-blue-600 border-blue-500/30">
                                {((weatherData as any)?.currentRainfall || 0) < 15 ? "Low" :
                                 ((weatherData as any)?.currentRainfall || 0) < 30 ? "Moderate" :
                                 ((weatherData as any)?.currentRainfall || 0) < 50 ? "High" : "Extreme"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Hurricane Wind Index Indicator */}
                      {weatherMetric === "wind" && (
                        <div className="p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-orange-600 font-medium">Hurricane Risk:</span>
                            <Badge variant="outline" className="text-orange-600 border-orange-500/30">
                              {((weatherData as any)?.windSpeed || 0) < 39 ? "Low" :
                               ((weatherData as any)?.windSpeed || 0) < 74 ? "Moderate" :
                               ((weatherData as any)?.windSpeed || 0) < 111 ? "High" : "Extreme"}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Market Status</CardTitle>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-primary text-sm">Live</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Contracts</span>
                        <span className="font-medium text-lg">{(marketOverview as any)?.activeContracts || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Volume</span>
                        <span className="font-medium text-lg">${(marketOverview as any)?.totalVolume || "0"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Implied Volatility</span>
                        <span className="font-medium text-lg">{(marketOverview as any)?.impliedVolatility || "0%"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">AI Insights</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-chart-5" />
                        <Badge className="bg-chart-5/20 text-chart-5">AI-Powered</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(aiInsights as any)?.keyFactors?.slice(0, 3).map((factor: any, index: number) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={cn(
                            "w-3 h-3 rounded-full mt-0.5 flex-shrink-0",
                            index === 0 ? "bg-primary" : index === 1 ? "bg-chart-3" : "bg-chart-2"
                          )} />
                          <span className="text-sm leading-relaxed">{factor}</span>
                        </div>
                      )) || (
                        <div className="text-sm text-muted-foreground">Loading insights...</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Weather Trend Chart */}
              {trendData && trendData.length > 0 ? (
                <WeatherChart 
                  data={trendData}
                  selectedCity={selectedCity}
                  weatherMetric={weatherMetric}
                  timePeriod={timePeriod}
                  onTimePeriodChange={setTimePeriod}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Droplets className="h-5 w-5" />
                      Weather Trend Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      Loading weather trend data...
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Trading Instruments */}
            <Tabs defaultValue="options" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-4">
                <TabsTrigger value="options" className="data-[state=active]:bg-gray-700">
                  Options Chain
                </TabsTrigger>
                <TabsTrigger value="futures" className="data-[state=active]:bg-gray-700">
                  Futures Trading
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="options" className="space-y-8">
                {/* Options Chain - Full Width */}
                <OptionsChainPro 
                  selectedCity={selectedCity}
                  currentRainfall={(weatherData as any)?.currentRainfall || 0}
                  currentWindSpeed={(weatherData as any)?.windSpeed || 0}
                  weatherMetric={weatherMetric}
                />
                
                {/* AI Agent - Full Width Below Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Bot className="h-6 w-6 text-chart-5" />
                      <span>Flow AI Trading Assistant</span>
                      <Badge className="bg-chart-5/20 text-chart-5">Marcus Rodriguez</Badge>
                      <Badge variant="outline" className="text-xs">Professional Trader</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FlowAISetupEnhanced />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="futures" className="space-y-8">
                {/* Futures Trading - Full Width */}
                <FuturesTrading
                  selectedCity={selectedCity.city}
                  currentRainfall={(weatherData as any)?.currentRainfall || 0}
                  currentWindSpeed={(weatherData as any)?.windSpeed || 0}
                  weatherMetric={weatherMetric}
                />
                
                {/* AI Agent - Full Width Below Futures */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Bot className="h-6 w-6 text-chart-5" />
                      <span>Flow AI Trading Assistant</span>
                      <Badge className="bg-chart-5/20 text-chart-5">Marcus Rodriguez</Badge>
                      <Badge variant="outline" className="text-xs">Professional Trader</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FlowAISetupEnhanced />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioOverview />
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            {/* Community Navigation */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Community Features</h2>
                <p className="text-muted-foreground">Mutual aid pools, governance, and staking rewards</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/staking">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Community Staking
                  </Button>
                </Link>
              </div>
            </div>
            
            <PoolsOverview />
            <Governance />
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChatInterface selectedCity={selectedCity} />
              </div>
              
              <div className="space-y-6">
                {/* AI Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-chart-5" />
                      AI Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Price Accuracy</span>
                          <span className="font-medium text-primary">
                            {(aiAccuracy as any)?.priceAccuracy || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${(aiAccuracy as any)?.priceAccuracy || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Weather Prediction</span>
                          <span className="font-medium text-chart-2">
                            {(aiAccuracy as any)?.weatherPrediction || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-chart-2 h-2 rounded-full transition-all"
                            style={{ width: `${(aiAccuracy as any)?.weatherPrediction || 0}%` }}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Risk Assessment</span>
                          <span className="font-medium text-chart-3">
                            {(aiAccuracy as any)?.riskAssessment || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-chart-3 h-2 rounded-full transition-all"
                            style={{ width: `${(aiAccuracy as any)?.riskAssessment || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-chart-5" />
                      Smart Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">BUY Signal</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedCity.city} 15mm Call - High probability setup
                        </div>
                      </div>
                      
                      <div className="bg-chart-3/10 border border-chart-3/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <HelpCircle className="h-4 w-4 text-chart-3" />
                          <span className="text-sm font-medium">Risk Alert</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          High volatility expected next week
                        </div>
                      </div>
                      
                      <div className="bg-chart-2/10 border border-chart-2/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="h-4 w-4 text-chart-2" />
                          <span className="text-sm font-medium">Market Insight</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Premium levels 15% below historical avg
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Fixed Help Button */}
      <Button
        onClick={() => setShowHelpModal(true)}
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-chart-2 hover:bg-chart-2/80 shadow-lg z-40"
        size="icon"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </div>
  );
}
