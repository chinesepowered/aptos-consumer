'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/wallet-provider';
import { GameWorld } from '@/components/game-world';
import { PlayerStats } from '@/components/player-stats';
import { WalletButton } from '@/components/wallet-button';
import { StoryFragments } from '@/components/story-fragments';

export default function Home() {
  const { connected, balance } = useWallet();
  const [activeTab, setActiveTab] = useState<'world' | 'profile' | 'fragments'>('world');

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-cyan-500/20">
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                NPC Ecosystem
              </h1>
              <p className="text-sm text-slate-400">AI-Powered GameFi Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 backdrop-blur-sm">
              ⚡ Aptos Testnet
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {!connected ? (
        /* Landing Page */
        <main className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="mb-16">
              <div className="relative mb-8">
                <h2 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                  Next-Gen AI Gaming
                </h2>
                <div className="absolute -top-2 -right-2 w-20 h-20 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full blur-3xl opacity-20"></div>
              </div>
              <p className="text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl mx-auto">
                Experience revolutionary GameFi where AI-powered NPCs create living worlds, 
                generate dynamic quests, and evolve through your interactions. 
                Own your story as unique NFTs on Aptos blockchain.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-16">
              <div className="group relative bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 flex items-center justify-center mb-6 mx-auto text-2xl group-hover:scale-110 transition-transform">
                  🧠
                </div>
                <h3 className="text-xl font-bold mb-3 text-emerald-300">Intelligent NPCs</h3>
                <p className="text-slate-400 leading-relaxed">
                  Advanced AI creates NPCs with personalities, memories, and evolving relationships
                </p>
              </div>

              <div className="group relative bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 flex items-center justify-center mb-6 mx-auto text-2xl group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <h3 className="text-xl font-bold mb-3 text-cyan-300">Story NFTs</h3>
                <p className="text-slate-400 leading-relaxed">
                  Mint legendary moments as NFTs and build your collection of epic adventures
                </p>
              </div>

              <div className="group relative bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center mb-6 mx-auto text-2xl group-hover:scale-110 transition-transform">
                  ⚔️
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-300">Dynamic Quests</h3>
                <p className="text-slate-400 leading-relaxed">
                  AI generates infinite quests tailored to your playstyle and story choices
                </p>
              </div>
            </div>

            <div className="mb-12">
              <p className="text-slate-400 mb-6 text-lg">Ready to enter the future of gaming?</p>
              <WalletButton />
            </div>

            <div className="space-y-4">
              <div className="flex justify-center items-center space-x-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span>Powered by Aptos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span>Together AI & Groq</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Demo Ready</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl mx-auto">
                Demo creates a testnet wallet instantly. Get free APT from the{' '}
                <a href="https://aptos.dev/network/faucet" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">
                  Aptos faucet
                </a>{' '}
                to interact with NPCs and mint story fragments.
              </p>
            </div>
          </div>
        </main>
      ) : (
        /* Game Interface */
        <main className="container mx-auto px-6 py-8">
          {/* Funding Helper Banner */}
          {connected && balance === 0 && (
            <div className="mb-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-2xl">
                  🪙
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-300 mb-1">Fund Your Wallet</h3>
                  <p className="text-yellow-200/80 text-sm">
                    Get free testnet APT to interact with NPCs and mint story fragments
                  </p>
                </div>
                <a
                  href="https://aptos.dev/network/faucet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-yellow-500/20"
                >
                  Get Free APT
                </a>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mb-8 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-2 border border-slate-700/50">
            {[
              { id: 'world', label: 'Game World', icon: '🌍' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'fragments', label: 'Story Fragments', icon: '✨' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-300 font-medium ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30 shadow-lg shadow-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[60vh]">
            {activeTab === 'world' && <GameWorld />}
            {activeTab === 'profile' && <PlayerStats />}
            {activeTab === 'fragments' && <StoryFragments />}
          </div>
        </main>
      )}
    </div>
  );
}