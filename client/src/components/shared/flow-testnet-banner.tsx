import { Activity, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function FlowTestnetBanner() {
  return (
    <Card className="bg-gradient-to-r from-green-900/40 via-green-800/30 to-green-900/40 border-green-500/30 overflow-hidden">
      <div className="flex items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-green-100">
              Live Flow Testnet Integration
            </h3>
            <p className="text-xs sm:text-sm text-green-200/80 truncate">
              Experience Forte Actions + Scheduled Transactions on live blockchain
            </p>
          </div>
        </div>
        <Link href="/live-testnet">
          <Button
            variant="secondary"
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white border-green-500/50 flex items-center gap-2 flex-shrink-0"
          >
            <span className="text-xs sm:text-sm whitespace-nowrap">View Live Contracts</span>
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
