'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './wallet-provider';
import { aptosService, StoryFragment } from '@/lib/aptos-service';

export function StoryFragments() {
  const { account } = useWallet();
  const [fragments, setFragments] = useState<(StoryFragment & { address: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFragment, setSelectedFragment] = useState<(StoryFragment & { address: string }) | null>(null);

  useEffect(() => {
    if (account) {
      loadStoryFragments();
    }
  }, [account]);

  const loadStoryFragments = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const fragmentAddresses = await aptosService.getAllStoryFragments();
      
      const fragmentPromises = fragmentAddresses.map(async (address) => {
        const details = await aptosService.getStoryFragmentDetails(address);
        return details ? { ...details, address } : null;
      });

      const fragmentDetails = await Promise.all(fragmentPromises);
      const validFragments = fragmentDetails.filter(Boolean) as (StoryFragment & { address: string })[];
      
      // Sort by timestamp (newest first)
      validFragments.sort((a, b) => b.timestamp - a.timestamp);
      
      setFragments(validFragments);
    } catch (error) {
      console.error('Failed to load story fragments:', error);
    } finally {
      setLoading(false);
    }
  };

  const interactWithFragment = async (fragment: StoryFragment & { address: string }, interactionType: string) => {
    if (!account) return;

    try {
      await aptosService.interactWithFragment(account, fragment.address, interactionType);
      
      // Refresh the fragment data
      const updated = await aptosService.getStoryFragmentDetails(fragment.address);
      if (updated) {
        setFragments(prev => 
          prev.map(f => f.address === fragment.address ? { ...updated, address: fragment.address } : f)
        );
        if (selectedFragment?.address === fragment.address) {
          setSelectedFragment({ ...updated, address: fragment.address });
        }
      }
    } catch (error) {
      console.error('Failed to interact with fragment:', error);
    }
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 1: return 'from-gray-400 to-gray-600';
      case 2: return 'from-green-400 to-green-600';
      case 3: return 'from-blue-400 to-blue-600';
      case 4: return 'from-purple-400 to-purple-600';
      case 5: return 'from-yellow-400 to-yellow-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityLabel = (rarity: number) => {
    switch (rarity) {
      case 1: return 'Common';
      case 2: return 'Uncommon';
      case 3: return 'Rare';
      case 4: return 'Epic';
      case 5: return 'Legendary';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading story fragments...</p>
        </div>
      </div>
    );
  }

  if (fragments.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4 text-2xl">
            📜
          </div>
          <h3 className="text-xl font-semibold mb-2">No Story Fragments Yet</h3>
          <p className="text-gray-400 mb-6">
            Interact with NPCs to create memorable story moments that get minted as unique NFTs.
          </p>
          <div className="text-sm text-gray-500">
            Story fragments are automatically generated during special NPC interactions
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Fragment Collection */}
      <div className="lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your Story Collection ({fragments.length})</h3>
          <button
            onClick={loadStoryFragments}
            className="text-xs bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded-full transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {fragments.map((fragment) => (
            <div
              key={fragment.address}
              onClick={() => setSelectedFragment(fragment)}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-all cursor-pointer ${
                selectedFragment?.address === fragment.address
                  ? 'border-purple-500/50 bg-purple-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRarityColor(fragment.rarity)}`}>
                  {getRarityLabel(fragment.rarity)}
                </div>
                <div className="text-xs text-gray-400">#{fragment.id}</div>
              </div>

              <h4 className="font-semibold mb-2 line-clamp-2">{fragment.title}</h4>
              <p className="text-sm text-gray-400 mb-3 line-clamp-3">{fragment.content}</p>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">💬 {fragment.npcCharacter}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500">
                  <span>❤️ {fragment.interactionCount}</span>
                  <span>{new Date(fragment.timestamp * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fragment Detail */}
      <div className="lg:col-span-1">
        {selectedFragment ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 sticky top-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getRarityColor(selectedFragment.rarity)}`}>
                  {getRarityLabel(selectedFragment.rarity)}
                </div>
                <div className="text-sm text-gray-400">#{selectedFragment.id}</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{selectedFragment.title}</h3>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Story Content</h4>
                <p className="text-sm leading-relaxed">{selectedFragment.content}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Context</h4>
                <p className="text-sm text-gray-300">{selectedFragment.questContext}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="text-gray-400 mb-1">NPC Character</h4>
                  <p className="text-blue-400">{selectedFragment.npcCharacter}</p>
                </div>
                <div>
                  <h4 className="text-gray-400 mb-1">Interactions</h4>
                  <p className="text-green-400">{selectedFragment.interactionCount}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Created</h4>
                <p className="text-sm">{new Date(selectedFragment.timestamp * 1000).toLocaleString()}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-1">Owner</h4>
                <p className="text-xs font-mono bg-white/10 p-2 rounded break-all">
                  {selectedFragment.author}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-400">Interact</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => interactWithFragment(selectedFragment, 'like')}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  ❤️ Like
                </button>
                <button
                  onClick={() => interactWithFragment(selectedFragment, 'favorite')}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  ⭐ Favorite
                </button>
              </div>
              
              <a
                href={`${aptosService.getNetworkInfo().explorerUrl}/object/${selectedFragment.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 p-3 rounded-lg transition-colors text-center text-sm"
              >
                View on Explorer
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 text-center sticky top-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
              📜
            </div>
            <h3 className="font-semibold mb-2">Select a Fragment</h3>
            <p className="text-sm text-gray-400">
              Click on any story fragment to see its details and interact with it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}