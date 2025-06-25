'use client';

import { useWallet } from './wallet-provider';

export function WalletButton() {
  const { connected, connecting, connect, disconnect, account, balance } = useWallet();

  if (connected && account) {
    const needsFunding = balance === 0;
    
    return (
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className={`text-sm font-semibold ${needsFunding ? 'text-yellow-400' : 'text-emerald-300'}`}>
            {(balance / 100000000).toFixed(4)} APT
            {needsFunding && (
              <a
                href="https://aptos.dev/network/faucet"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                Get APT
              </a>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {account.accountAddress.toString().slice(0, 6)}...
            {account.accountAddress.toString().slice(-4)}
          </div>
        </div>
        <button
          onClick={disconnect}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-2 rounded-xl transition-all duration-300 border border-red-500/30 hover:border-red-500/50 backdrop-blur-sm"
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
      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
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