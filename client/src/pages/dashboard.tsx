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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  Coins,
  Menu,
  X,
  Database,
  ExternalLink
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
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
      <header className="bg-card border-b border-border sticky top-0 z-40 flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Row - Brand and Actions */}
          <div className="flex justify-between items-center h-14 border-b border-border/50">
            <div className="flex items-center space-x-2">
              <CloudRain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-lg sm:text-xl font-bold">SkyFall</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/flare-wind-futures">
                <Button variant="outline" size="sm" className="text-xs">
                  <Wind className="h-4 w-4 mr-1" />
                  Flare Wind Futures
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
            
            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-2">
              <WalletButton />
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-4 mt-6">
                    <Link href="/flare-wind-futures">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start" 
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Wind className="h-4 w-4 mr-2" />
                        Flare Wind Futures
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        setShowHelpModal(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Help & Support
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Bottom Row - City Search and Selected City Display */}
          <div className="flex items-center justify-between h-auto py-3 sm:h-16">
            {/* Mobile Layout */}
            <div className="flex sm:hidden items-center justify-between w-full">
              {/* Selected City Display - Mobile */}
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {selectedCity.city}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedCity.state}
                  </div>
                </div>
              </div>
              
              {/* Search Toggle Button - Mobile */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="ml-2"
              >
                <Search className="h-4 w-4" />
                <span className="ml-2">Search</span>
              </Button>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between w-full">
              {/* Selected City Display with Dropdown - Desktop */}
              <div className="flex items-center space-x-4 min-w-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 hover:bg-secondary/50 rounded-lg px-3 py-2 transition-colors">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="min-w-0 text-left">
                        <div className="font-semibold text-lg truncate flex items-center gap-2">
                          {selectedCity.city}, {selectedCity.state}
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Station: {selectedCity.stationId}
                        </div>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-96 overflow-y-auto">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Select Location
                    </div>
                    <DropdownMenuSeparator />
                    {CITIES.map((city) => (
                      <DropdownMenuItem
                        key={city.stationId}
                        onClick={() => handleCitySelect(city)}
                        className={cn(
                          "cursor-pointer",
                          selectedCity.stationId === city.stationId && "bg-primary/10"
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <MapPin className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedCity.stationId === city.stationId ? "text-primary" : "text-gray-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{city.city}, {city.state}</div>
                            <div className="text-xs text-muted-foreground">{city.stationId}</div>
                          </div>
                          {selectedCity.stationId === city.stationId && (
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            
              {/* City Search - Desktop */}
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

              {/* Weather Status Indicator - Desktop */}
              <div className="flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-muted-foreground">Live Data</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile Search Dropdown */}
          {mobileSearchOpen && (
            <div className="sm:hidden border-t border-border/50 py-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 text-base w-full"
                  autoFocus
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Search Results - Mobile */}
              {searchQuery && filteredCities.length > 0 && (
                <div className="bg-card border border-border rounded-md mt-2 max-h-60 overflow-y-auto">
                  {filteredCities.map((city) => (
                    <button
                      key={city.stationId}
                      onClick={() => {
                        handleCitySelect(city);
                        setMobileSearchOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors text-sm border-b border-border last:border-b-0"
                    >
                      <div className="font-medium">{city.city}, {city.state}</div>
                      <div className="text-xs text-muted-foreground">{city.stationId}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col items-center">
        {/* Market Overview Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 w-full">
          <Card className="bg-gradient-to-br from-blue-950/50 to-blue-900/30 border-blue-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-300 mb-1">Total Volume 24h</p>
                  <p className="text-xl font-bold text-white">${(marketOverview as any)?.totalVolume || '418.2M'}</p>
                  <p className="text-xs text-green-400 mt-1">↗ +12.5%</p>
                </div>
                <Activity className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-950/50 to-green-900/30 border-green-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300 mb-1">Open Interest</p>
                  <p className="text-xl font-bold text-white">{(marketOverview as any)?.openInterest || '$89.4M'}</p>
                  <p className="text-xs text-green-400 mt-1">↗ +8.2%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-purple-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-300 mb-1">Active Traders</p>
                  <p className="text-xl font-bold text-white">{(marketOverview as any)?.activeTraders || '12,847'}</p>
                  <p className="text-xs text-green-400 mt-1">↗ +432</p>
                </div>
                <Users className="h-8 w-8 text-purple-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-950/50 to-orange-900/30 border-orange-800/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-300 mb-1">Total Contracts</p>
                  <p className="text-xl font-bold text-white">{(marketOverview as any)?.totalContracts || '2,847'}</p>
                  <p className="text-xs text-orange-400 mt-1">Live Trading</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-400 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6 w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 bg-secondary p-0.5 gap-0.5 h-auto">
            <TabsTrigger value="trading" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px]">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Trading</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px]">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-2 relative text-[10px] sm:text-sm px-1 sm:px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-[36px]">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Community</span>
              <Badge variant="secondary" className="hidden sm:inline-flex ml-1 text-xs bg-chart-3 text-chart-3-foreground absolute -top-1 -right-1 h-4 px-1">
                New
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Trading Tab */}
          <TabsContent value="trading" className="space-y-4 sm:space-y-6 w-full">
            {/* Trading Instruments - Moved to Top */}
            <Tabs defaultValue="options" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-4 gap-1">
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
              </TabsContent>
              
              <TabsContent value="futures">
                <FuturesTrading 
                  selectedCity={selectedCity.city}
                  currentRainfall={(weatherData as any)?.currentRainfall || 0}
                  currentWindSpeed={(weatherData as any)?.windSpeed || 0}
                  weatherMetric={weatherMetric}
                />
              </TabsContent>
            </Tabs>

            {/* Weather Data Section - Now Below Trading */}
            <div className="space-y-4 sm:space-y-8 w-full">
              {/* Trading Instrument Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
                {/* Main Instrument Panel */}
                <Card className="lg:col-span-2 bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
                  <CardHeader className="pb-3 border-b border-gray-800">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-1 bg-primary rounded-full" />
                          <div>
                            <CardTitle className="text-lg font-bold">
                              {selectedCity.city}, {selectedCity.state}
                            </CardTitle>
                            <p className="text-xs text-gray-500">Station: {selectedCity.stationId}</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <div className="h-2 w-2 bg-green-400 rounded-full mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                      
                      {/* Instrument Selector */}
                      <div className="flex items-center bg-gray-800/50 rounded-lg p-1 w-full sm:w-fit">
                        <Button
                          variant={weatherMetric === "rainfall" ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-2 sm:px-3 rounded-full text-xs transition-all flex-1 sm:flex-initial",
                            weatherMetric === "rainfall" 
                              ? "bg-primary text-primary-foreground shadow-sm" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setWeatherMetric("rainfall")}
                        >
                          <Droplets className="h-4 w-4 mr-1.5" />
                          <span className="font-medium">RAIN/USD</span>
                        </Button>
                        <Button
                          variant={weatherMetric === "wind" ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-8 px-3 rounded-md text-xs transition-all flex-1 sm:flex-initial",
                            weatherMetric === "wind" 
                              ? "bg-orange-600 text-white shadow-lg" 
                              : "text-gray-400 hover:text-white hover:bg-gray-700"
                          )}
                          onClick={() => setWeatherMetric("wind")}
                        >
                          <Wind className="h-4 w-4 mr-1.5" />
                          <span className="font-medium">WIND/USD</span>
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {/* Price Display - Trading Style */}
                      <div className="flex items-baseline gap-3">
                        <div className="text-5xl font-bold tracking-tight">
                          {weatherLoading ? "..." : weatherMetric === "rainfall" 
                            ? `${(weatherData as any)?.currentRainfall || 0}`
                            : `${(weatherData as any)?.windSpeed || 0}`
                          }
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-400">
                            {weatherMetric === "rainfall" ? "mm" : "mph"}
                          </span>
                          <span className="text-xs text-green-400 font-mono">
                            +{weatherMetric === "rainfall" ? "2.3%" : "1.8%"} 24h
                          </span>
                        </div>
                      </div>
                      
                      {/* Trading Info Bar */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">24h High</p>
                          <p className="text-sm font-bold text-white">
                            {weatherMetric === "rainfall" ? "32.5mm" : "18.2mph"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">24h Low</p>
                          <p className="text-sm font-bold text-white">
                            {weatherMetric === "rainfall" ? "0.0mm" : "2.1mph"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Avg</p>
                          <p className="text-sm font-bold text-white">
                            {weatherMetric === "rainfall" ? "5.9mm" : "8.4mph"}
                          </p>
                        </div>
                      </div>
                      
                      {/* Verification Badge */}
                      <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-xs font-medium text-blue-400">Blockchain Verified</p>
                            <p className="text-[10px] text-gray-500">Updated 2 mins ago</p>
                          </div>
                        </div>
                        <code className="text-xs text-gray-500 font-mono">
                          {(weatherData as any)?.dataHash?.slice(0, 8) || "0x..."}
                        </code>
                      </div>
                      
                      {/* Risk Indicators */}
                      <div className="grid grid-cols-2 gap-2">
                        {weatherMetric === "rainfall" ? (
                          <>
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                              <p className="text-xs text-yellow-400 mb-1">Drought Risk</p>
                              <p className="text-sm font-bold text-yellow-300">
                                {((weatherData as any)?.currentRainfall || 0) > 25 ? "Low" :
                                 ((weatherData as any)?.currentRainfall || 0) > 10 ? "Moderate" : "High"}
                              </p>
                            </div>
                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                              <p className="text-xs text-blue-400 mb-1">Flood Risk</p>
                              <p className="text-sm font-bold text-blue-300">
                                {((weatherData as any)?.currentRainfall || 0) > 40 ? "High" :
                                 ((weatherData as any)?.currentRainfall || 0) > 25 ? "Moderate" : "Low"}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                              <p className="text-xs text-orange-400 mb-1">Wind Alert</p>
                              <p className="text-sm font-bold text-orange-300">
                                {((weatherData as any)?.windSpeed || 0) > 30 ? "High" :
                                 ((weatherData as any)?.windSpeed || 0) > 15 ? "Moderate" : "Low"}
                              </p>
                            </div>
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-xs text-red-400 mb-1">Storm Risk</p>
                              <p className="text-sm font-bold text-red-300">
                                {((weatherData as any)?.windSpeed || 0) > 40 ? "High" : "Low"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats Sidebar */}
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-gray-900 to-gray-950 border-gray-800">
                    <CardHeader className="pb-3 border-b border-gray-800">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold">Market Overview</CardTitle>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                          <div className="h-1.5 w-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />
                          LIVE
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">24h Volume</span>
                          <span className="font-mono text-sm font-bold">${(marketOverview as any)?.totalVolume || "418M"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Open Interest</span>
                          <span className="font-mono text-sm font-bold">${(marketOverview as any)?.openInterest || "89M"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">Active Contracts</span>
                          <span className="font-mono text-sm font-bold text-green-400">{(marketOverview as any)?.activeContracts || "2,847"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">IV (30d)</span>
                          <span className="font-mono text-sm font-bold text-orange-400">{(marketOverview as any)?.impliedVolatility || "42.5%"}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-800">
                        <Button 
                          className="w-full bg-primary hover:bg-primary/90" 
                          size="sm"
                          onClick={() => window.open('https://dune.com/tan0610/skyfall-weather-trading-analytics', '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Dune Dashboard
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-950/30 to-pink-950/30 border-purple-800/50">
                    <CardHeader className="pb-3 border-b border-purple-800/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bot className="h-4 w-4 text-purple-400" />
                          <CardTitle className="text-sm font-bold">AI Signals</CardTitle>
                        </div>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                          BETA
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <span className="text-xs font-semibold text-green-400">BULLISH SIGNAL</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            {(aiInsights as any)?.keyFactors?.[0] || "Strong demand for call options detected"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                          <p className="text-[10px] text-gray-500 mb-2">AI Confidence Score</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{width: `${(aiAccuracy as any)?.confidence || 85}%`}} />
                            </div>
                            <span className="text-xs font-bold text-purple-400">{(aiAccuracy as any)?.confidence || 85}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
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
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6 w-full flex flex-col items-center">
            <div className="w-full">
              <PortfolioOverview />
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-4 sm:space-y-6 w-full flex flex-col items-center">
            {/* Community Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold">Community Features</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Mutual aid pools, governance, and staking rewards</p>
              </div>
              <div className="flex items-center space-x-3">
                <Link href="/staking">
                  <Button variant="outline" className="flex items-center gap-2 w-full sm:w-auto" size="sm">
                    <Coins className="h-4 w-4" />
                    Community Staking
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="w-full">
              <PoolsOverview />
            </div>
            <div className="w-full">
              <Governance />
            </div>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="ai-assistant" className="space-y-4 sm:space-y-6 w-full flex flex-col items-center">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
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
      {/* Fixed AI Agent Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => {
                setActiveTab("ai-assistant");
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 rounded-full w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/60 transform hover:scale-110 transition-all duration-300 z-40 border border-purple-400/30"
              size="icon"
            >
              <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-purple-600 text-white border-purple-700">
            <p className="text-sm font-medium">AI Assistant</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* Help Modal */}
      <HelpModal 
        isOpen={showHelpModal} 
        onClose={() => setShowHelpModal(false)} 
      />
    </div>
  );
}
