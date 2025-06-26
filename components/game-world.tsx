'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './wallet-provider';
import { NPCCharacter } from '@/lib/ai-service';
import { aptosService } from '@/lib/aptos-service';

interface Message {
  id: string;
  type: 'user' | 'npc' | 'system';
  content: string;
  timestamp: Date;
  npcCharacter?: string;
}

export function GameWorld() {
  const { account } = useWallet();
  const [currentWorld, setCurrentWorld] = useState<any>(null);
  const [selectedNPC, setSelectedNPC] = useState<NPCCharacter | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [playerMessage, setPlayerMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playerLevel, setPlayerLevel] = useState(1);

  // Load initial world
  useEffect(() => {
    if (account) {
      // Try to restore world from localStorage first
      const savedWorld = localStorage.getItem('current-game-world');
      if (savedWorld) {
        try {
          const world = JSON.parse(savedWorld);
          setCurrentWorld(world);
          setMessages([{
            id: 'welcome',
            type: 'system',
            content: `Welcome back to the ${world.description}`,
            timestamp: new Date()
          }]);
        } catch (error) {
          console.error('Failed to restore world:', error);
          loadWorld();
        }
      } else {
        loadWorld();
      }
      loadPlayerLevel();
    }
  }, [account]);

  const loadWorld = async () => {
    try {
      const apiResponse = await fetch('/api/ai/generate-world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: 'mystical fantasy realm',
          playerLevel
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`World generation failed: ${apiResponse.status}`);
      }

      const world = await apiResponse.json();
      setCurrentWorld(world);
      
      // Save world to localStorage
      localStorage.setItem('current-game-world', JSON.stringify(world));
      
      // Add welcome message
      setMessages([{
        id: 'welcome',
        type: 'system',
        content: `Welcome to the ${world.description}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to load world:', error);
      // Fallback world
      setCurrentWorld({
        description: 'A mystical realm awaits your exploration...',
        npcs: [
          {
            id: 'sage',
            name: 'Elder Sage',
            personality: 'Wise and helpful',
            background: 'An ancient keeper of knowledge',
            currentContext: 'Waiting to guide new adventurers'
          }
        ],
        questHooks: ['Ancient mysteries await discovery']
      });
    }
  };

  const loadPlayerLevel = async () => {
    if (account) {
      try {
        const profile = await aptosService.getPlayerProfile(account.accountAddress.toString());
        if (profile) {
          setPlayerLevel(profile.level);
        }
      } catch (error) {
        console.error('Failed to load player level:', error);
      }
    }
  };

  const selectNPC = (npc: NPCCharacter) => {
    setSelectedNPC(npc);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'system',
      content: `You approach ${npc.name}. ${npc.background}`,
      timestamp: new Date()
    }]);
  };

  const sendMessage = async () => {
    if (!playerMessage.trim() || !selectedNPC || !account) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: playerMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setPlayerMessage('');
    setIsLoading(true);

    try {
      const apiResponse = await fetch('/api/ai/npc-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character: selectedNPC,
          playerMessage,
          playerLevel,
          gameContext: { currentWorld }
        }),
      });

      if (!apiResponse.ok) {
        throw new Error(`API call failed: ${apiResponse.status}`);
      }

      const response = await apiResponse.json();

      // Add NPC response
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'npc',
        content: response.dialogue,
        timestamp: new Date(),
        npcCharacter: selectedNPC.name
      }]);

      // Handle quest generation
      if (response.questGenerated) {
        try {
          const questTx = await aptosService.createQuest(
            account,
            response.questGenerated.title,
            response.questGenerated.description,
            selectedNPC.name,
            response.questGenerated.rewardAmount,
            response.questGenerated.experienceReward,
            response.questGenerated.requiredLevel
          );

          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            type: 'system',
            content: `🎯 New Quest Available: ${response.questGenerated.title}`,
            timestamp: new Date()
          }]);
        } catch (error) {
          console.error('Failed to create quest:', error);
        }
      }

      // Handle story fragment generation
      if (response.storyFragment) {
        try {
          const fragmentTx = await aptosService.mintStoryFragment(
            account,
            response.storyFragment.title,
            response.storyFragment.content,
            selectedNPC.name,
            `Conversation with ${selectedNPC.name}`,
            response.storyFragment.rarity
          );

          // Track the fragment locally for demo purposes
          await aptosService.trackMintedFragment(account, {
            id: Date.now(),
            title: response.storyFragment.title,
            content: response.storyFragment.content,
            npcCharacter: selectedNPC.name,
            questContext: `Conversation with ${selectedNPC.name}`,
            rarity: response.storyFragment.rarity,
            interactionCount: 0
          });

          setMessages(prev => [...prev, {
            id: (Date.now() + 3).toString(),
            type: 'system',
            content: `📜 Story Fragment Created: "${response.storyFragment.title}" - Check your collection!`,
            timestamp: new Date()
          }]);
        } catch (error) {
          console.error('Failed to mint story fragment:', error);
        }
      }

      // Update NPC context
      setSelectedNPC(prev => prev ? { ...prev, currentContext: response.nextContext } : null);

    } catch (error) {
      console.error('Failed to get NPC response:', error);
      
      let errorMessage = 'The NPC seems distracted and doesn\'t respond...';
      
      if (error instanceof Error) {
        if (error.message.includes('API call failed: 500')) {
          errorMessage = '🤖 AI service temporarily unavailable. Please check your API keys are configured.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = '🌐 Network error. Please check your connection.';
        }
      }
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: errorMessage,
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const regenerateWorld = () => {
    // Clear saved world
    localStorage.removeItem('current-game-world');
    setCurrentWorld(null);
    setSelectedNPC(null);
    setMessages([]);
    loadWorld();
  };

  if (!currentWorld) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">Generating procedural world...</p>
          <p className="text-slate-500 text-sm mt-2">AI is crafting your adventure</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      {/* World Info & NPCs */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-emerald-300">Current World</h3>
            <button
              onClick={regenerateWorld}
              className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-xl transition-all duration-300 border border-emerald-500/30"
            >
              🔄 New World
            </button>
          </div>
          <p className="text-sm text-slate-300 mb-4">{currentWorld.description}</p>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-cyan-400">Quest Hooks:</h4>
            {currentWorld.questHooks.map((hook: string, index: number) => (
              <div key={index} className="text-xs text-slate-400 bg-slate-700/50 p-3 rounded-xl border border-slate-600/50">
                • {hook}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold mb-4 text-cyan-300">NPCs</h3>
          <div className="space-y-3">
            {currentWorld.npcs.map((npc: NPCCharacter) => (
              <button
                key={npc.id}
                onClick={() => selectNPC(npc)}
                className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                  selectedNPC?.id === npc.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50'
                }`}
              >
                <div className="font-medium text-white">{npc.name}</div>
                <div className="text-xs text-slate-400 mt-1">{npc.personality}</div>
                <div className="text-xs text-slate-500 mt-1 italic">{npc.currentContext}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-6 border-b border-slate-700/50">
            <h3 className="font-semibold text-white">
              {selectedNPC ? `Conversation with ${selectedNPC.name}` : 'Select an NPC to start'}
            </h3>
            {selectedNPC && (
              <p className="text-sm text-slate-400 mt-1">{selectedNPC.personality}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto max-h-96">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm p-4 rounded-xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30'
                        : message.type === 'npc'
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                    }`}
                  >
                    {message.type === 'npc' && (
                      <div className="text-xs text-gray-400 mb-1">{message.npcCharacter}</div>
                    )}
                    <div className="text-sm">{message.content}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 rounded-xl border border-blue-500/30">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                      <span className="text-sm text-slate-300">NPC is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          {selectedNPC && (
            <div className="p-6 border-t border-slate-700/50">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={playerMessage}
                  onChange={(e) => setPlayerMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                  placeholder={`Say something to ${selectedNPC.name}...`}
                  className="flex-1 bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !playerMessage.trim()}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/20"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}