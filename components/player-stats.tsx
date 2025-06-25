'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './wallet-provider';
import { aptosService, PlayerProfile, Quest } from '@/lib/aptos-service';

export function PlayerStats() {
  const { account, balance, refreshBalance } = useWallet();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [activeQuests, setActiveQuests] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(false);

  useEffect(() => {
    if (account) {
      loadPlayerData();
    }
  }, [account]);

  const loadPlayerData = async () => {
    if (!account) return;

    try {
      setLoading(true);
      const playerProfile = await aptosService.getPlayerProfile(account.accountAddress.toString());
      setProfile(playerProfile);
      
      // Only load quests if we have a profile, otherwise set empty array
      if (playerProfile) {
        const quests = await aptosService.getActiveQuests();
        setActiveQuests(quests);
      } else {
        setActiveQuests([]);
      }
    } catch (error) {
      console.error('Failed to load player data:', error);
      // On any error, set profile to null to show the initialize screen
      setProfile(null);
      setActiveQuests([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeProfile = async () => {
    if (!account) return;

    try {
      setInitializing(true);
      await aptosService.initializePlayerProfile(account);
      await loadPlayerData();
    } catch (error) {
      console.error('Failed to initialize profile:', error);
    } finally {
      setInitializing(false);
    }
  };

  const calculateExperienceToNextLevel = (level: number): number => {
    const expThresholds = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];
    return expThresholds[Math.min(level, expThresholds.length - 1)] || level * 10000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
            👤
          </div>
          <h3 className="text-xl font-semibold mb-2">Welcome, Adventurer!</h3>
          <p className="text-gray-400 mb-6">
            Initialize your player profile to start tracking your progress, level, and achievements.
          </p>
          <button
            onClick={initializeProfile}
            disabled={initializing}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-all transform hover:scale-105 disabled:hover:scale-100"
          >
            {initializing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Initializing...</span>
              </div>
            ) : (
              'Initialize Profile'
            )}
          </button>
        </div>
      </div>
    );
  }

  const experienceToNext = calculateExperienceToNextLevel(profile.level + 1);
  const currentLevelExp = calculateExperienceToNextLevel(profile.level);
  const expProgress = profile.level >= 10 
    ? 100 
    : ((profile.experience - currentLevelExp) / (experienceToNext - currentLevelExp)) * 100;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Player Overview */}
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl font-bold">
              {profile.level}
            </div>
            <div>
              <h3 className="text-xl font-semibold">Level {profile.level} Adventurer</h3>
              <p className="text-gray-400">
                {account.accountAddress.toString().slice(0, 8)}...
                {account.accountAddress.toString().slice(-6)}
              </p>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Experience</span>
              <span>{profile.experience} / {experienceToNext}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(0, Math.min(100, expProgress))}%` }}
              ></div>
            </div>
            {profile.level < 10 && (
              <p className="text-xs text-gray-400 mt-1">
                {Math.max(0, experienceToNext - profile.experience)} XP to next level
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-400">{profile.completedQuests.length}</div>
              <div className="text-xs text-gray-400">Quests Completed</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{profile.storyFragmentsOwned}</div>
              <div className="text-xs text-gray-400">Story Fragments</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{profile.npcInteractions}</div>
              <div className="text-xs text-gray-400">NPC Interactions</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{(balance / 100000000).toFixed(2)}</div>
              <div className="text-xs text-gray-400">APT Balance</div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold mb-4">Achievements</h4>
          <div className="space-y-3">
            {[
              { 
                name: 'First Steps', 
                description: 'Complete your first quest',
                unlocked: profile.completedQuests.length > 0,
                icon: '🎯'
              },
              { 
                name: 'Storyteller', 
                description: 'Collect your first story fragment',
                unlocked: profile.storyFragmentsOwned > 0,
                icon: '📜'
              },
              { 
                name: 'Social Butterfly', 
                description: 'Have 10 NPC interactions',
                unlocked: profile.npcInteractions >= 10,
                icon: '🗣️'
              },
              { 
                name: 'Leveling Up', 
                description: 'Reach level 5',
                unlocked: profile.level >= 5,
                icon: '⭐'
              },
            ].map((achievement, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  achievement.unlocked 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-gray-500/20 border border-gray-500/30'
                }`}
              >
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">{achievement.name}</div>
                  <div className="text-sm text-gray-400">{achievement.description}</div>
                </div>
                {achievement.unlocked && (
                  <div className="text-green-400 text-sm font-medium">✓ Unlocked</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {profile.lastInteraction > 0 ? (
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm">Last NPC interaction</div>
                  <div className="text-xs text-gray-400">
                    {new Date(profile.lastInteraction * 1000).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">🎮</div>
                <p>Start interacting with NPCs to see your activity here!</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold mb-4">Available Quests</h4>
          {activeQuests.length > 0 ? (
            <div className="space-y-3">
              {activeQuests.map((questId) => (
                <div key={questId} className="p-3 bg-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Quest #{questId}</div>
                      <div className="text-sm text-gray-400">Available for completion</div>
                    </div>
                    <div className="text-purple-400 font-medium">Active</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🎯</div>
              <p>Complete NPC interactions to unlock quests!</p>
            </div>
          )}
        </div>

        {/* Wallet Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold mb-4">Wallet Actions</h4>
          <div className="space-y-3">
            <button
              onClick={refreshBalance}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 p-3 rounded-lg transition-colors text-left"
            >
              <div className="font-medium">Refresh Balance</div>
              <div className="text-sm text-gray-400">Update your APT balance</div>
            </button>
            <button
              onClick={async () => {
                if (account) {
                  try {
                    await aptosService.initializeContract(account);
                    setTimeout(loadPlayerData, 2000); // Reload after initialization
                  } catch (error) {
                    console.error('Failed to initialize contract:', error);
                  }
                }
              }}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 p-3 rounded-lg transition-colors text-left"
            >
              <div className="font-medium">Initialize Contract</div>
              <div className="text-sm text-gray-400">One-time setup for game registry</div>
            </button>
            <a
              href={`${aptosService.getNetworkInfo().explorerUrl}/account/${account.accountAddress.toString()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 p-3 rounded-lg transition-colors"
            >
              <div className="font-medium">View on Explorer</div>
              <div className="text-sm text-gray-400">See your transactions on Aptos Explorer</div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}