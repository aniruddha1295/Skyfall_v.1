import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, ArrowRightLeft, TrendingUp } from "lucide-react";
import { useCurrencyToggle, useUSDFPricing, formatCurrency } from "@/lib/usdf-pricing";

interface CurrencyToggleProps {
  onCurrencyChange?: (currency: 'ETH' | 'FLOW' | 'USDF') => void;
  onToggleChange?: (showUsdf: boolean) => void;
  className?: string;
}

export function CurrencyToggle({ 
  onCurrencyChange, 
  onToggleChange,
  className = "" 
}: CurrencyToggleProps) {
  const { showUsdf, primaryCurrency, toggleUsdf, setPrimaryCurrency } = useCurrencyToggle();
  const { pricing } = useUSDFPricing();

  const handleToggle = () => {
    toggleUsdf();
    onToggleChange?.(!showUsdf);
  };

  const handleCurrencyChange = (currency: 'ETH' | 'FLOW' | 'USDF') => {
    setPrimaryCurrency(currency);
    onCurrencyChange?.(currency);
  };

  return null;
}

interface PriceDisplayProps {
  amount: number;
  originalCurrency: 'ETH' | 'FLOW';
  showUsdf?: boolean;
  showBoth?: boolean;
  className?: string;
}

export function PriceDisplay({ 
  amount, 
  originalCurrency, 
  showUsdf = false,
  showBoth = false,
  className = "" 
}: PriceDisplayProps) {
  const { convertToUsdf } = useUSDFPricing();
  
  const usdfAmount = convertToUsdf(amount, originalCurrency);
  const originalFormatted = formatCurrency(amount, originalCurrency, 2, false); // Remove units
  const usdfFormatted = formatCurrency(usdfAmount, 'USDF', 2, false); // Remove units

  if (showUsdf && !showBoth) {
    return <span className={className}>{usdfFormatted}</span>;
  }

  if (showBoth) {
    return (
      <div className={`flex flex-col ${className}`}>
        <span className="font-medium">{originalFormatted}</span>
        <span className="text-sm text-muted-foreground">{usdfFormatted}</span>
      </div>
    );
  }

  return <span className={className}>{originalFormatted}</span>;
}

interface CurrencyConversionCardProps {
  className?: string;
}

export function CurrencyConversionCard({ className = "" }: CurrencyConversionCardProps) {
  const { pricing } = useUSDFPricing();

  return (
    <div className={`p-4 bg-gray-900 border border-gray-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-blue-400" />
        <h3 className="font-medium text-white">USDF Exchange Rates</h3>
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Live</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-gray-400 text-xs">ETH → USDF</div>
          <div className="font-medium text-white">{pricing.ethToUsdf.toFixed(0)}</div>
        </div>
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-gray-400 text-xs">FLOW → USDF</div>
          <div className="font-medium text-white">{pricing.flowToUsdf.toFixed(2)}</div>
        </div>
        <div className="text-center p-2 bg-gray-800 rounded">
          <div className="text-gray-400 text-xs">USDF → USD</div>
          <div className="font-medium text-white">{pricing.usdfToUsd.toFixed(3)}</div>
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mt-2 text-center">
        Powered by Chainlink Price Feeds on Flow EVM
      </div>
    </div>
  );
}