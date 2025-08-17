import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Copy, Check, ExternalLink, LogOut, AlertCircle } from "lucide-react";
import { useWallet } from "@/lib/web3";
import { useToast } from "@/hooks/use-toast";

export function WalletButton() {
  const { 
    isConnected, 
    address, 
    chainId, 
    isLoading, 
    error,
    connect, 
    disconnect,
    switchNetwork 
  } = useWallet();
  
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        toast({
          title: "Address copied",
          description: "Wallet address copied to clipboard",
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
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: "Wallet connected",
        description: "Successfully connected to MetaMask",
      });
    } catch (error: any) {
      toast({
        title: "Connection failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowWalletModal(false);
      toast({
        title: "Wallet disconnected",
        description: "Successfully disconnected wallet",
      });
    } catch (error: any) {
      toast({
        title: "Disconnect failed",
        description: error.message || "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const getNetworkName = (chainId: number | null) => {
    switch (chainId) {
      case 1: return "Ethereum Mainnet";
      case 11155111: return "Sepolia Testnet";
      case 747: return "Flow EVM Testnet";
      default: return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number | null) => {
    switch (chainId) {
      case 1: return "bg-blue-500";
      case 11155111: return "bg-purple-500";
      case 747: return "bg-green-500";
      default: return "bg-gray-500";
    }
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

  // Error state
  if (error && !isConnected) {
    return (
      <Button
        onClick={handleConnect}
        variant="destructive"
        className="flex items-center gap-2"
      >
        <AlertCircle className="h-4 w-4" />
        Retry Connection
      </Button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <div className={`w-2 h-2 rounded-full ${getNetworkColor(chainId)}`} />
          <span className="text-sm text-muted-foreground">
            {getNetworkName(chainId)}
          </span>
        </div>
        
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowWalletModal(true)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:block">{formatAddress(address)}</span>
          <Badge variant="secondary" className="hidden md:flex">
            Connected
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
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm text-muted-foreground">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getNetworkColor(chainId)}`} />
                  <span className="text-sm">{getNetworkName(chainId)}</span>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Wallet Address</label>
                <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-sm font-mono flex-1 break-all">
                    {address}
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
                    const explorerUrl = chainId === 1 
                      ? `https://etherscan.io/address/${address}`
                      : `https://sepolia.etherscan.io/address/${address}`;
                    window.open(explorerUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
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
      className="bg-primary hover:bg-primary/90 text-primary-foreground"
    >
      <Wallet className="h-4 w-4 mr-2" />
      Connect Wallet
    </Button>
  );
}