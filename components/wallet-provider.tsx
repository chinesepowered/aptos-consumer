'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, Ed25519PrivateKey, Network } from '@aptos-labs/ts-sdk';
import { aptosService } from '@/lib/aptos-service';

interface WalletContextType {
  account: Account | null;
  connected: boolean;
  connecting: boolean;
  balance: number;
  loadingBalance: boolean;
  network: Network | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [network, setNetwork] = useState<Network | null>(null);

  useEffect(() => {
    setNetwork(aptosService.getNetworkInfo().network);
  }, []);

  const connect = async () => {
    setConnecting(true);
    try {
      // Create a new account (without automatic funding)
      const { account: newAccount, privateKey } = await aptosService.createDemoAccountWithoutFunding();
      setAccount(newAccount);
      setConnected(true);
      
      // Store account in localStorage for demo persistence
      localStorage.setItem('demo-account', JSON.stringify({
        privateKeyHex: privateKey.toString(),
        address: newAccount.accountAddress.toString()
      }));
      
      await refreshBalance();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setConnected(false);
    setBalance(0);
    setLoadingBalance(false);
    localStorage.removeItem('demo-account');
  };

  const refreshBalance = async () => {
    if (account) {
      setLoadingBalance(true);
      try {
        const accountBalance = await aptosService.getAccountBalance(account.accountAddress.toString());
        setBalance(accountBalance);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
        setBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    }
  };

  // Try to restore account from localStorage on mount
  useEffect(() => {
    const storedAccount = localStorage.getItem('demo-account');
    if (storedAccount) {
      try {
        const { privateKeyHex, address } = JSON.parse(storedAccount);
        const privateKey = new Ed25519PrivateKey(privateKeyHex);
        const restoredAccount = Account.fromPrivateKey({ privateKey });
        setAccount(restoredAccount);
        setConnected(true);
        refreshBalance();
      } catch (error) {
        console.error('Failed to restore account:', error);
        localStorage.removeItem('demo-account');
      }
    }
  }, []);

  // Periodically refresh balance
  useEffect(() => {
    if (connected && account) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 15000); // Refresh every 15 seconds

      return () => clearInterval(interval);
    }
  }, [connected, account]);

  const value: WalletContextType = {
    account,
    connected,
    connecting,
    balance,
    loadingBalance,
    network,
    connect,
    disconnect,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}