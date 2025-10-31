import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Copy, Check, ExternalLink, LogOut, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  authenticate, 
  unauthenticate, 
  getCurrentUser, 
  subscribeToUser 
} from "@/lib/flow-config";

export function WalletButton() {
  const [flowUser, setFlowUser] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeFlowWallet();
  }, []);

  const initializeFlowWallet = async () => {
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('FCL timeout')), 5000)
      );
      
      const user = await Promise.race([
        getCurrentUser(),
        timeoutPromise
      ]);
      
      setFlowUser(user);
      setIsConnected(user?.loggedIn || false);

      // Subscribe to user changes with error handling
      try {
        subscribeToUser((user: any) => {
          setFlowUser(user);
          setIsConnected(user?.loggedIn || false);
        });
      } catch (subscribeError) {
        console.warn('FCL subscription failed, continuing without live updates:', subscribeError);
      }
    } catch (error) {
      console.warn('Flow wallet initialization failed (continuing in offline mode):', error);
      // Don't show error to user - just continue without wallet
      setFlowUser(null);
      setIsConnected(false);
    }
  };

  const copyAddress = async () => {
    if (flowUser?.addr) {
      try {
        await navigator.clipboard.writeText(flowUser.addr);
        setCopied(true);
        toast({
          title: "Flow address copied",
          description: "Flow wallet address copied to clipboard",
        });
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast({
          title: "Failed to copy",
          description: "Could not copy address to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await authenticate();
      toast({
        title: "Flow wallet connected",
        description: "Successfully connected to Flow wallet",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect Flow wallet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await unauthenticate();
      setShowWalletModal(false);
      toast({
        title: "Flow wallet disconnected",
        description: "Successfully disconnected from Flow wallet",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const getNetworkName = () => {
    return "Flow Testnet";
  };

  const getNetworkColor = () => {
    return "bg-green-500";
  };

  // Loading state
  if (isLoading) {
    return (
      <Button disabled className="bg-primary/50">
        <Wallet className="h-4 w-4 mr-2 animate-spin" />
        Connecting...
      </Button>
    );
  }

  // Connected state
  if (isConnected && flowUser?.addr) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${getNetworkColor()}`} />
          <span className="text-sm text-muted-foreground">
            {getNetworkName()}
          </span>
        </div>
        
        <Button
          variant="outline"
          className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 border-green-200"
          onClick={() => setShowWalletModal(true)}
        >
          <Wallet className="h-4 w-4 text-green-600" />
          <span className="hidden sm:block text-green-700">{formatAddress(flowUser.addr)}</span>
          <Badge variant="secondary" className="hidden md:flex bg-green-100 text-green-700">
            Flow Connected
          </Badge>
        </Button>

        {/* Wallet Details Modal */}
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Wallet Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Network Info */}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm text-muted-foreground">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getNetworkColor()}`} />
                  <span className="text-sm text-green-700">{getNetworkName()}</span>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Flow Wallet Address</label>
                <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-mono flex-1 break-all">
                    {flowUser?.addr}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={copyAddress}
                    className="h-8 w-8 p-0 flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 flex-1"
                  onClick={() => {
                    const explorerUrl = `https://testnet.flowscan.io/account/${flowUser?.addr}`;
                    window.open(explorerUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  View on FlowScan
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Not connected state
  return (
    <Button
      onClick={handleConnect}
      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Flow Wallet
    </Button>
  );
}