import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Copy, Check, ExternalLink, LogOut } from "lucide-react";

export function PrivyButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Add delay to ensure Privy is fully initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Get the first connected wallet
  const wallet = wallets[0];
  const address = wallet?.address;

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.warn('Failed to copy address:', error);
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = () => {
    try {
      login();
    } catch (error) {
      console.warn('Privy login failed:', error);
      // Fallback to MetaMask if available
      if (window.ethereum) {
        window.ethereum.request({ method: 'eth_requestAccounts' }).catch(console.warn);
      }
    }
  };

  // Show loading state while initializing
  if (!ready || !isInitialized) {
    return (
      <Button disabled className="bg-primary/50">
        <Wallet className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Connected state
  if (authenticated && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">Connected</span>
        </div>
        
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setShowWalletModal(true)}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:block">{formatAddress(address)}</span>
          <Badge variant="secondary" className="hidden md:flex">
            Wallet
          </Badge>
        </Button>

        {/* Wallet Details Modal */}
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5" />
                Wallet Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Network Info */}
              <div className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg">
                <span className="text-sm text-muted-foreground">Network</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-white">Ethereum</span>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Wallet Address</label>
                <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                  <span className="text-sm text-white font-mono flex-1 break-all">
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
                    const explorerUrl = `https://etherscan.io/address/${address}`;
                    window.open(explorerUrl, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                  View on Explorer
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    logout();
                    setShowWalletModal(false);
                  }}
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