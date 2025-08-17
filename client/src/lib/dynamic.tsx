import { ReactNode } from 'react';
import { DynamicContextProvider, DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';

const environmentId = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID;

interface DynamicProviderProps {
  children: ReactNode;
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  // Add validation for environment ID
  if (!environmentId) {
    console.error('VITE_DYNAMIC_ENVIRONMENT_ID is not defined');
    return <div>{children}</div>;
  }

  return (
    <DynamicContextProvider
      settings={{
        environmentId: environmentId.trim(),
        walletConnectors: [EthereumWalletConnectors],
        appName: 'SkyFall',
        cssOverrides: `
          .dynamic-shadow-dom-content {
            color-scheme: dark;
          }
        `,
        debugError: true,
        logLevel: 'WARN',
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}

export function ConnectWalletButton() {
  // Check if Dynamic is available
  if (!environmentId) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
          </svg>
          <span>Connect Wallet</span>
        </div>
      </div>
    );
  }

  try {
    return <DynamicWidget />;
  } catch (error) {
    console.error('DynamicWidget error:', error);
    return (
      <div className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Wallet Config Issue</span>
        </div>
      </div>
    );
  }
}

export function useDynamic() {
  return useDynamicContext();
}