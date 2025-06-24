'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './wallet-provider';
import { aiService, NPCCharacter } from '@/lib/ai-service';
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
      loadWorld();
      loadPlayerLevel();
    }
  }, [account]);

  const loadWorld = async () => {
    try {
      const world = await aiService.generateProceduralWorld('mystical fantasy realm', playerLevel);
      setCurrentWorld(world);
      
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
      const response = await aiService.generateNPCResponse(
        selectedNPC,
        playerMessage,
        playerLevel,
        { currentWorld }
      );

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
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'system',
        content: 'The NPC seems distracted and doesn\'t respond...',
        timestamp: new Date()
      }]);
    }

    setIsLoading(false);
  };

  const regenerateWorld = () => {
    setCurrentWorld(null);
    setSelectedNPC(null);
    setMessages([]);
    loadWorld();
  };

  if (!currentWorld) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Generating procedural world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 h-full">
      {/* World Info & NPCs */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current World</h3>
            <button
              onClick={regenerateWorld}
              className="text-xs bg-purple-500/20 hover:bg-purple-500/30 px-3 py-1 rounded-full transition-colors"
            >
              🔄 New World
            </button>
          </div>
          <p className="text-sm text-gray-300 mb-4">{currentWorld.description}</p>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-purple-400">Quest Hooks:</h4>
            {currentWorld.questHooks.map((hook: string, index: number) => (
              <div key={index} className="text-xs text-gray-400 bg-white/5 p-2 rounded">
                • {hook}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4">NPCs</h3>
          <div className="space-y-3">
            {currentWorld.npcs.map((npc: NPCCharacter) => (
              <button
                key={npc.id}
                onClick={() => selectNPC(npc)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedNPC?.id === npc.id
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="font-medium">{npc.name}</div>
                <div className="text-xs text-gray-400 mt-1">{npc.personality}</div>
                <div className="text-xs text-gray-500 mt-1 italic">{npc.currentContext}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold">
              {selectedNPC ? `Conversation with ${selectedNPC.name}` : 'Select an NPC to start'}
            </h3>
            {selectedNPC && (
              <p className="text-sm text-gray-400 mt-1">{selectedNPC.personality}</p>
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
                    className={`max-w-sm p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-purple-500/20 text-white'
                        : message.type === 'npc'
                        ? 'bg-blue-500/20 text-white'
                        : 'bg-gray-500/20 text-gray-300'
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
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-400">NPC is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          {selectedNPC && (
            <div className="p-4 border-t border-white/10">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={playerMessage}
                  onChange={(e) => setPlayerMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                  placeholder={`Say something to ${selectedNPC.name}...`}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !playerMessage.trim()}
                  className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 px-6 py-2 rounded-lg font-medium transition-colors"
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