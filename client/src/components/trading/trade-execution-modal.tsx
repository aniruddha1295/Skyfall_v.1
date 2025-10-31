import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriceDisplay } from "./currency-toggle";
import { useUSDFPricing, formatDualCurrency } from "@/lib/usdf-pricing";

interface TradeExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tradeDetails: {
    type: "call" | "put" | "futures";
    action: "buy" | "sell";
    strike?: number;
    price: string;
    expiry?: string;
    contract?: string;
    currentRainfall: number;
  } | null;
}

export default function TradeExecutionModal({ isOpen, onClose, tradeDetails }: TradeExecutionModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [orderType, setOrderType] = useState("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionComplete, setExecutionComplete] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<'ETH' | 'FLOW' | 'USD'>('ETH');
  
  const { convertToUsdf, convertFromUsdf } = useUSDFPricing();

  if (!tradeDetails) return null;

  const total = (parseFloat(tradeDetails.price) * quantity).toFixed(2);
  const priceInUsdf = convertToUsdf(parseFloat(tradeDetails.price), paymentCurrency);
  const totalInUsdf = convertToUsdf(parseFloat(total), paymentCurrency);
  const isITM = tradeDetails.type !== "futures"
    ? (tradeDetails.type === "call" 
      ? tradeDetails.currentRainfall > (tradeDetails.strike || 0)
      : tradeDetails.currentRainfall < (tradeDetails.strike || 0))
    : null;

  const handleExecute = async () => {
    setIsExecuting(true);
    // Simulate trade execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExecuting(false);
    setExecutionComplete(true);
    
    // Auto close after showing success
    setTimeout(() => {
      onClose();
      setExecutionComplete(false);
      setQuantity(1);
      setOrderType("market");
      setLimitPrice("");
      setPaymentCurrency('ETH');
    }, 2000);
  };

  const getActionColor = () => {
    if (tradeDetails.action === "buy") {
      return tradeDetails.type === "call" ? "text-green-400" : "text-red-400";
    }
    return "text-yellow-400";
  };

  const getActionIcon = () => {
    if (tradeDetails.type === "call") {
      return <TrendingUp className="h-5 w-5" />;
    }
    return <TrendingDown className="h-5 w-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isExecuting && onClose()}>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] max-h-[85vh] sm:max-h-[90vh] bg-gray-900 border-gray-800 flex flex-col p-0 gap-0">
        {!executionComplete ? (
          <>
            <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span className={getActionColor()}>
                  {tradeDetails.action.toUpperCase()} {tradeDetails.type.toUpperCase()}
                </span>
                {getActionIcon()}
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-sm">
                {tradeDetails.type === "futures" 
                  ? `Contract: ${tradeDetails.contract}`
                  : `Strike: ${tradeDetails.strike}mm | Expiry: ${tradeDetails.expiry}`
                }
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 space-y-2 sm:space-y-3">
              {/* Price Display with USDF */}
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Price per Contract</span>
                  <div className="text-right">
                    <div className="text-white font-medium">${tradeDetails.price}</div>
                    <div className="text-sm text-blue-400">{priceInUsdf.toFixed(2)} USDF</div>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-400">Current Rainfall</span>
                  <span className="text-white">{tradeDetails.currentRainfall}mm</span>
                </div>
                {isITM !== null && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Moneyness</span>
                    <Badge className={cn(
                      "text-xs",
                      isITM ? "bg-green-900/20 text-green-400" : "bg-gray-700 text-gray-300"
                    )}>
                      {isITM ? "ITM" : "OTM"}
                    </Badge>
                  </div>
                )}
                {tradeDetails.type === "futures" && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-400">Position Type</span>
                    <Badge className={cn(
                      "text-xs",
                      tradeDetails.action === "buy" 
                        ? "bg-green-900/20 text-green-400" 
                        : "bg-red-900/20 text-red-400"
                    )}>
                      {tradeDetails.action === "buy" ? "LONG" : "SHORT"}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="space-y-1">
                <Label className="text-gray-300 text-sm">Quantity</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[quantity]}
                    onValueChange={(values) => setQuantity(values[0])}
                    max={100}
                    min={1}
                    step={1}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-8 bg-gray-800 border-gray-700 text-sm"
                  />
                </div>
              </div>

              {/* Order Type */}
              <div className="space-y-1">
                <Label className="text-gray-300 text-sm">Order Type</Label>
                <RadioGroup value={orderType} onValueChange={setOrderType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="market" id="market" className="h-3 w-3" />
                    <Label htmlFor="market" className="text-gray-300 cursor-pointer text-sm">
                      Market Order
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="limit" id="limit" className="h-3 w-3" />
                    <Label htmlFor="limit" className="text-gray-300 cursor-pointer text-sm">
                      Limit Order
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Limit Price */}
              {orderType === "limit" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Limit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter limit price"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              )}

              {/* Payment Currency Selection */}
              <div className="space-y-1">
                <Label className="text-gray-300 text-sm">Payment Currency</Label>
                <RadioGroup 
                  value={paymentCurrency} 
                  onValueChange={(value: 'ETH' | 'FLOW' | 'USD') => setPaymentCurrency(value as 'ETH' | 'FLOW' | 'USD')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ETH" id="eth" />
                    <Label htmlFor="eth" className="text-sm">ETH</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FLOW" id="flow" />
                    <Label htmlFor="flow" className="text-sm">FLOW</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="USD" id="usdf" />
                    <Label htmlFor="usdf" className="text-sm">USDF</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Order Total with Dual Currency */}
              <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium">Total</span>
                  <div className="text-right">
                    <div className="text-white font-bold text-lg">${total}</div>
                    <div className="text-xs text-blue-400">{totalInUsdf.toFixed(2)} USDF</div>
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 mt-1">
                  Blockchain transaction will be in {paymentCurrency}. USDF shown for reference.
                </div>
              </div>

              {/* Risk Warning */}
              <Alert className="bg-yellow-900/20 border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300 text-sm">
                  Weather options involve risk. The value depends on actual rainfall outcomes.
                </AlertDescription>
              </Alert>
            </div>

            <div className="flex gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6 pt-3 sm:pt-4 border-t border-gray-800 bg-gray-900 sticky bottom-0">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isExecuting}
                className="flex-1 border-gray-700 hover:bg-gray-800 text-sm sm:text-base"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExecute}
                disabled={isExecuting || (orderType === "limit" && !limitPrice)}
                className={cn(
                  "flex-1 text-sm sm:text-base",
                  tradeDetails.action === "buy" 
                    ? "bg-green-600 hover:bg-green-700" 
                    : "bg-red-600 hover:bg-red-700"
                )}
              >
                <span className="sm:hidden">
                  {isExecuting ? "..." : `${tradeDetails.action.toUpperCase()} ${quantity}`}
                </span>
                <span className="hidden sm:inline">
                  {isExecuting ? "Executing..." : `${tradeDetails.action.toUpperCase()} ${quantity} Contract${quantity > 1 ? 's' : ''}`}
                </span>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Trade Executed!</h3>
            <p className="text-gray-400 text-sm">
              {tradeDetails.type === "futures" 
                ? `Opened ${tradeDetails.action === "buy" ? "long" : "short"} position for ${quantity} contract${quantity > 1 ? 's' : ''}`
                : `${tradeDetails.action === "buy" ? "Bought" : "Sold"} ${quantity} ${tradeDetails.type} contract${quantity > 1 ? 's' : ''}`
              }
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {tradeDetails.type === "futures"
                ? `${tradeDetails.contract} @ ${tradeDetails.price}mm`
                : `Strike: ${tradeDetails.strike}mm @ $${tradeDetails.price}`
              }
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}