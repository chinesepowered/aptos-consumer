'use client';

import { useWallet } from './wallet-provider';

export function WalletButton() {
  const { connected, connecting, connect, disconnect, account, balance } = useWallet();

  if (connected && account) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-right">
          <div className="text-sm font-medium">
            {(balance / 100000000).toFixed(4)} APT
          </div>
          <div className="text-xs text-gray-400">
            {account.accountAddress.toString().slice(0, 6)}...
            {account.accountAddress.toString().slice(-4)}
          </div>
        </div>
        <button
          onClick={disconnect}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg transition-colors border border-red-500/30"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={connecting}
      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-all transform hover:scale-105 disabled:hover:scale-100"
    >
      {connecting ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          <span>Connecting...</span>
        </div>
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}