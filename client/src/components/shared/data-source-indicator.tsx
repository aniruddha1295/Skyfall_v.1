import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Shield, Database } from "lucide-react";

interface DataSourceIndicatorProps {
  primary: "weatherxm" | "chainlink";
  backup?: "weatherxm" | "chainlink";
  confidence: number;
  crossValidated?: boolean;
  variance?: number;
  blockchainVerified?: boolean;
  sources?: {
    weatherxm?: number;
    chainlink?: number;
  };
  compact?: boolean;
}

export function DataSourceIndicator({
  primary,
  backup,
  confidence,
  crossValidated = false,
  variance = 0,
  blockchainVerified = false,
  sources = {},
  compact = false
}: DataSourceIndicatorProps) {
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case "weatherxm":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "chainlink":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return "text-green-400";
    if (conf >= 0.8) return "text-yellow-400";
    return "text-red-400";
  };

  const getVarianceColor = (variance: number) => {
    if (variance <= 0.05) return "text-green-400";
    if (variance <= 0.15) return "text-yellow-400";
    return "text-red-400";
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 min-w-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className={`text-[10px] sm:text-xs ${getSourceColor(primary)} border px-1.5 sm:px-2`}>
                <span className="truncate">
                  {primary === "weatherxm" ? "OWM" : primary.slice(0, 3).toUpperCase()}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Cross-validated across sources</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {blockchainVerified && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Shield className="h-3 w-3 text-blue-400" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">Blockchain verified</div>
            </TooltipContent>
          </Tooltip>
        )}

        <span className={`text-[10px] sm:text-xs font-mono ${getConfidenceColor(confidence)}`}>
          {(confidence * 100).toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">Data Sources</div>
          <div className="flex items-center gap-1">
            {crossValidated && (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            {blockchainVerified && (
              <Shield className="h-4 w-4 text-blue-400" />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Primary:</span>
            <Badge className={`text-xs ${getSourceColor(primary)} border`}>
              {primary === "weatherxm" ? "OpenWeather" : primary.toUpperCase()}
            </Badge>
          </div>

          {backup && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Backup:</span>
              <Badge variant="outline" className={`text-xs ${getSourceColor(backup)}`}>
                {backup === "weatherxm" ? "OpenWeather" : backup.toUpperCase()}
              </Badge>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <span className={`text-xs font-mono ${getConfidenceColor(confidence)}`}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          {crossValidated && variance !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Variance:</span>
              <span className={`text-xs font-mono ${getVarianceColor(variance)}`}>
                {(variance * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        {Object.keys(sources).length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-1">Source Values:</div>
            <div className="space-y-1">
              {sources.weatherxm !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-400">OpenWeather:</span>
                  <span className="text-xs font-mono">{sources.weatherxm.toFixed(1)}mm</span>
                </div>
              )}
              {sources.chainlink !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-orange-400">Chainlink:</span>
                  <span className="text-xs font-mono">{sources.chainlink.toFixed(1)}mm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {blockchainVerified && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Database className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">Blockchain Verified</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}