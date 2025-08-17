import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed Privy - using direct Web3 wallet connection
import Dashboard from "@/pages/dashboard";
import { FlowAIPage } from "@/pages/flow-ai";
import FlareWindFutures from "@/components/flare/FlareWindFutures";
import StakingPage from "@/pages/staking";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/flow-ai" component={FlowAIPage} />
      <Route path="/flare-wind-futures" component={FlareWindFutures} />
      <Route path="/staking" component={StakingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
