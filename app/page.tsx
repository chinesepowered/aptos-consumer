'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/wallet-provider';
import { GameWorld } from '@/components/game-world';
import { PlayerStats } from '@/components/player-stats';
import { WalletButton } from '@/components/wallet-button';
import { StoryFragments } from '@/components/story-fragments';

export default function Home() {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'world' | 'profile' | 'fragments'>('world');

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-lg">
              🌟
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Intelligent NPC Ecosystem
              </h1>
              <p className="text-sm text-gray-400">AI-Powered GameFi Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-xs text-gray-400 bg-green-500/20 px-2 py-1 rounded-full border border-green-500/30">
              ✓ Aptos Testnet
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {!connected ? (
        /* Landing Page */
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Enter a World of Intelligent NPCs
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Experience the future of gaming where AI-powered NPCs create dynamic storylines, 
                generate quests in real-time, and evolve based on your interactions. 
                Mint unique story fragments as NFTs and shape procedural game worlds.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 mx-auto">
                  🤖
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered NPCs</h3>
                <p className="text-gray-400 text-sm">
                  NPCs powered by advanced LLMs create dynamic dialogue and evolving personalities
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 mx-auto">
                  📜
                </div>
                <h3 className="text-lg font-semibold mb-2">Story Fragment NFTs</h3>
                <p className="text-gray-400 text-sm">
                  Mint unique story moments as NFTs and build your collection of memorable interactions
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  🎮
                </div>
                <h3 className="text-lg font-semibold mb-2">Dynamic Quests</h3>
                <p className="text-gray-400 text-sm">
                  AI generates quests and rewards in real-time based on your gameplay and choices
                </p>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-400 mb-4">Ready to begin your adventure?</p>
              <WalletButton />
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Built on Aptos blockchain • Powered by Together AI & Groq</p>
              <p>Demo mode: New wallet will be created with testnet APT for immediate gameplay</p>
            </div>
          </div>
        </main>
      ) : (
        /* Game Interface */
        <main className="container mx-auto px-4 py-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-black/20 backdrop-blur-sm rounded-lg p-1">
            {[
              { id: 'world', label: 'Game World', icon: '🌍' },
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'fragments', label: 'Story Fragments', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="font-medium">{tab.label}</span>
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