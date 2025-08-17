// Direct Web3 wallet connection without Privy
import { useState, useEffect, createContext, useContext } from 'react';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isLoading: boolean;
  error: string | null;
}

export class Web3Wallet {
  private static instance: Web3Wallet;
  private listeners: Set<(state: WalletState) => void> = new Set();
  private state: WalletState = {
    isConnected: false,
    address: null,
    chainId: null,
    isLoading: false,
    error: null
  };

  private constructor() {
    this.initializeWallet();
  }

  static getInstance(): Web3Wallet {
    if (!Web3Wallet.instance) {
      Web3Wallet.instance = new Web3Wallet();
    }
    return Web3Wallet.instance;
  }

  private async initializeWallet() {
    if (typeof window === 'undefined' || !window.ethereum) {
      this.setState({ error: 'MetaMask not detected' });
      return;
    }

    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' 
      });
      
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });
        
        this.setState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          error: null
        });
      }

      // Set up event listeners
      window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
    } catch (error) {
      console.warn('Failed to initialize wallet:', error);
      this.setState({ error: 'Failed to initialize wallet' });
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.setState({
        isConnected: false,
        address: null,
        chainId: null,
        error: null
      });
    } else {
      this.setState({
        isConnected: true,
        address: accounts[0],
        error: null
      });
    }
  }

  private handleChainChanged(chainId: string) {
    this.setState({
      chainId: parseInt(chainId, 16)
    });
  }

  private handleDisconnect() {
    this.setState({
      isConnected: false,
      address: null,
      chainId: null,
      error: null
    });
  }

  async connect(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask.');
    }

    this.setState({ isLoading: true, error: null });

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      this.setState({
        isConnected: true,
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      this.setState({
        isLoading: false,
        error: error.message || 'Failed to connect wallet'
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a programmatic disconnect
    // Just clear our state
    this.setState({
      isConnected: false,
      address: null,
      chainId: null,
      error: null
    });
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added, need to add it first
        throw new Error('Network not added to wallet');
      }
      throw error;
    }
  }

  getState(): WalletState {
    return { ...this.state };
  }

  subscribe(callback: (state: WalletState) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.getState());
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  private setState(updates: Partial<WalletState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(callback => callback(this.getState()));
  }
}

// React hook for wallet state
export function useWallet() {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    const wallet = Web3Wallet.getInstance();
    const unsubscribe = wallet.subscribe(setState);
    return unsubscribe;
  }, []);

  const connect = async () => {
    const wallet = Web3Wallet.getInstance();
    await wallet.connect();
  };

  const disconnect = async () => {
    const wallet = Web3Wallet.getInstance();
    await wallet.disconnect();
  };

  const switchNetwork = async (chainId: number) => {
    const wallet = Web3Wallet.getInstance();
    await wallet.switchNetwork(chainId);
  };

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork
  };
}