import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connecting: boolean;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    connecting: false,
  });

  // Check for existing connection on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('wallet_connection');
    if (savedWallet) {
      const { address, chainId } = JSON.parse(savedWallet);
      setWalletState(prev => ({
        ...prev,
        isConnected: true,
        address,
        chainId,
        balance: '2.45 ETH'
      }));
    }
  }, []);

  const connect = async (): Promise<void> => {
    setWalletState(prev => ({ ...prev, connecting: true }));

    try {
      // Try MetaMask first
      if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (accounts.length > 0) {
          const address = accounts[0];
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [address, 'latest']
          });
          
          const balanceInEth = (parseInt(balance, 16) / Math.pow(10, 18)).toFixed(4);
          
          setWalletState({
            isConnected: true,
            address,
            balance: `${balanceInEth} ETH`,
            chainId: parseInt(chainId, 16),
            connecting: false,
          });

          localStorage.setItem('wallet_connection', JSON.stringify({ address, chainId: parseInt(chainId, 16) }));
          return;
        }
      }

      // Fallback to demo wallet if no MetaMask - Privy-style connection
      const demoAddress = '0x742d35Cc6639C0532fba96122c3E1cc0C27C8373';
      setWalletState({
        isConnected: true,
        address: demoAddress,
        balance: '125.42 FLOW',
        chainId: 747, // Flow EVM Testnet
        connecting: false,
      });

      localStorage.setItem('wallet_connection', JSON.stringify({ 
        address: demoAddress, 
        chainId: 747 // Flow EVM Testnet
      }));

    } catch (error) {
      console.error('Wallet connection failed:', error);
      setWalletState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  };

  const disconnect = (): void => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      connecting: false,
    });
    localStorage.removeItem('wallet_connection');
  };

  const switchChain = async (chainId: number): Promise<void> => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${chainId.toString(16)}` }],
        });
        setWalletState(prev => ({ ...prev, chainId }));
      } catch (error) {
        console.error('Chain switch failed:', error);
        throw error;
      }
    }
  };

  const contextValue: WalletContextType = {
    ...walletState,
    connect,
    disconnect,
    switchChain,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}