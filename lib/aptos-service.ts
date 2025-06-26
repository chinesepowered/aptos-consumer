import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

interface StoryFragment {
  id: number;
  title: string;
  content: string;
  author: string;
  npcCharacter: string;
  questContext: string;
  rarity: number;
  timestamp: number;
  interactionCount: number;
}

interface PlayerProfile {
  level: number;
  experience: number;
  completedQuests: number[];
  storyFragmentsOwned: number;
  npcInteractions: number;
  lastInteraction: number;
}

interface Quest {
  id: number;
  title: string;
  description: string;
  npcCharacter: string;
  rewardAmount: number;
  experienceReward: number;
  requiredLevel: number;
  isActive: boolean;
  completionCount: number;
}

class AptosService {
  private aptos: Aptos;
  private network: Network;
  private moduleAddress: string;

  constructor() {
    this.network = process.env.NEXT_PUBLIC_APTOS_NETWORK === 'mainnet' ? Network.MAINNET : Network.TESTNET;
    const config = new AptosConfig({ network: this.network });
    this.aptos = new Aptos(config);
    this.moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS || '0x42'; // Will be updated after deployment
  }

  // Story Fragment Functions
  async mintStoryFragment(
    account: Account,
    title: string,
    content: string,
    npcCharacter: string,
    questContext: string,
    rarity: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::mint_story_fragment`,
        functionArguments: [title, content, npcCharacter, rarity], // questContext removed per contract
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  async getStoryFragmentDetails(fragmentAddress: string): Promise<StoryFragment | null> {
    try {
      // Try to get from localStorage first (for demo fragments)
      const localFragment = localStorage.getItem(`fragment-${fragmentAddress}`);
      if (localFragment) {
        return JSON.parse(localFragment);
      }

      // Fallback to contract call
      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::npc_ecosystem::get_fragment_details`,
          functionArguments: [fragmentAddress],
        },
      });

      const [id, title, content, author, npcCharacter, rarity, timestamp, interactionCount] = response as any[];
      
      return {
        id: parseInt(id),
        title,
        content,
        author,
        npcCharacter,
        questContext: '', // Not stored in current contract
        rarity: parseInt(rarity),
        timestamp: parseInt(timestamp),
        interactionCount: parseInt(interactionCount),
      };
    } catch (error) {
      console.error('Error fetching story fragment:', error);
      return null;
    }
  }

  async getAllStoryFragments(): Promise<string[]> {
    try {
      // For demo purposes, we'll track fragments in localStorage
      // In production, you'd use events or a registry contract
      const storedFragments = localStorage.getItem('player-story-fragments');
      if (storedFragments) {
        return JSON.parse(storedFragments);
      }
      return [];
    } catch (error) {
      console.error('Error fetching story fragments:', error);
      return [];
    }
  }

  // Helper to track minted fragments locally for demo
  async trackMintedFragment(account: Account, fragmentData: any): Promise<void> {
    try {
      const fragmentAddress = account.accountAddress.toString();
      const storedFragments = localStorage.getItem('player-story-fragments');
      const fragments = storedFragments ? JSON.parse(storedFragments) : [];
      
      // Add this fragment address to the list
      if (!fragments.includes(fragmentAddress)) {
        fragments.push(fragmentAddress);
        localStorage.setItem('player-story-fragments', JSON.stringify(fragments));
      }

      // Store the fragment details
      localStorage.setItem(`fragment-${fragmentAddress}`, JSON.stringify({
        ...fragmentData,
        address: fragmentAddress,
        timestamp: Date.now() / 1000,
        author: fragmentAddress
      }));
    } catch (error) {
      console.error('Error tracking fragment:', error);
    }
  }

  async interactWithFragment(
    account: Account,
    fragmentAddress: string,
    interactionType: string
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::interact_with_fragment`,
        functionArguments: [fragmentAddress, interactionType],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  // Player Profile Functions
  async initializePlayerProfile(account: Account): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::initialize_player_profile`,
        functionArguments: [],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  async getPlayerProfile(playerAddress: string): Promise<PlayerProfile | null> {
    try {
      // First check if the account exists at all to avoid MISSING_DATA errors
      try {
        await this.aptos.getAccountResource({
          accountAddress: playerAddress,
          resourceType: `${this.moduleAddress}::npc_ecosystem::PlayerProfile`
        });
      } catch (resourceError: any) {
        // If the resource doesn't exist, return null without trying to call the view function
        if (resourceError?.message?.includes('MISSING_DATA') || 
            resourceError?.message?.includes('Resource not found')) {
          console.log('Player profile resource not found - user needs to initialize profile first');
          return null;
        }
        // If it's a different error, continue with the view call
      }

      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::npc_ecosystem::get_player_profile`,
          functionArguments: [playerAddress],
        },
      });

      const [level, experience, completedQuests, storyFragmentsOwned, npcInteractions, lastInteraction] = response as any[];
      
      return {
        level: parseInt(level),
        experience: parseInt(experience),
        completedQuests: completedQuests.map((q: any) => parseInt(q)),
        storyFragmentsOwned: parseInt(storyFragmentsOwned),
        npcInteractions: parseInt(npcInteractions),
        lastInteraction: parseInt(lastInteraction),
      };
    } catch (error: any) {
      // Handle both direct error messages and nested error structures
      const errorMessage = error?.message || error?.toString() || '';
      const isPlayerNotFound = errorMessage.includes('MISSING_DATA') || 
                              errorMessage.includes('Failed to borrow global resource') ||
                              errorMessage.includes('Resource not found');
      
      if (isPlayerNotFound) {
        console.log('Player profile not found - user needs to initialize profile first');
        return null;
      }
      
      console.error('Error fetching player profile:', error);
      return null;
    }
  }

  // Quest Functions
  async createQuest(
    account: Account,
    title: string,
    description: string,
    npcCharacter: string,
    rewardAmount: number,
    experienceReward: number,
    requiredLevel: number
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::create_quest`,
        functionArguments: [title, description, npcCharacter, rewardAmount, experienceReward, requiredLevel],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  async completeQuest(
    account: Account,
    questId: number,
    questOwner: string
  ): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::complete_quest`,
        functionArguments: [questId, questOwner],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  async getActiveQuests(): Promise<number[]> {
    try {
      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::npc_ecosystem::get_total_quests`,
          functionArguments: [],
        },
      });

      return (response as any[]).map(q => parseInt(q));
    } catch (error: any) {
      console.error('Error fetching active quests:', error);
      return [];
    }
  }

  // Utility Functions
  async getAccountBalance(address: string): Promise<number> {
    try {
      const balance = await this.aptos.getAccountCoinAmount({
        accountAddress: address,
        coinType: '0x1::aptos_coin::AptosCoin',
      });
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async fundAccount(address: string, amount: number = 100000000): Promise<void> {
    if (this.network === Network.TESTNET) {
      await this.aptos.fundAccount({
        accountAddress: address,
        amount,
      });
    }
  }

  // Initialize the contract (call this once after deployment)
  async initializeContract(account: Account): Promise<string> {
    const transaction = await this.aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: {
        function: `${this.moduleAddress}::npc_ecosystem::initialize_game_registry`,
        functionArguments: [],
      },
    });

    const committedTxn = await this.aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });

    return committedTxn.hash;
  }

  // Demo Helper: Create a demo account without funding (SDK no longer supports auto-funding)
  async createDemoAccountWithoutFunding(): Promise<Account> {
    const account = Account.generate();
    return account;
  }

  // Demo Helper: Create a demo account with some APT (deprecated - use faucet manually)
  async createDemoAccount(): Promise<Account> {
    const account = Account.generate();
    
    if (this.network === Network.TESTNET) {
      try {
        await this.fundAccount(account.accountAddress.toString(), 200000000); // 2 APT
        // Wait a bit for funding to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.warn('Auto-funding failed, use manual faucet:', error);
      }
    }

    return account;
  }

  // Get network info
  getNetworkInfo() {
    return {
      network: this.network,
      explorerUrl: this.network === Network.MAINNET 
        ? 'https://explorer.aptoslabs.com'
        : 'https://explorer.aptoslabs.com/?network=testnet'
    };
  }
}

export const aptosService = new AptosService();
export type { StoryFragment, PlayerProfile, Quest };