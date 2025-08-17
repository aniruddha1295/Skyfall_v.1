// Privy wallet hook replacement for Dynamic wallet
import { useState, useEffect, createContext, useContext } from 'react';

interface WalletState {
  isConnected: boolean;
  address?: string;
  chainId?: number;
  balance?: string;
  isLoading: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    // Return default state when not wrapped in provider
    return {
      isConnected: false,
      isLoading: false,
      connect: async () => {
        console.log('Wallet connection simulated');
      },
      disconnect: () => {
        console.log('Wallet disconnection simulated');
      }
    };
  }
  return context;
}

// Mock wallet implementation for development
export function createMockWallet(): WalletContextType {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isLoading: false
  });

  const connect = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setState({
        isConnected: true,
        address: '0x742d35Cc6639C0532fba96122c3E1cc0C27C8373',
        chainId: 747, // Flow EVM Testnet
        balance: '125.42',
        isLoading: false
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const disconnect = () => {
    setState({
      isConnected: false,
      isLoading: false
    });
  };

  return {
    ...state,
    connect,
    disconnect
  };
}

// Privy provider wrapper (mock for now)
export { WalletContext };