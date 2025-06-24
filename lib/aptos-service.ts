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
        function: `${this.moduleAddress}::story_fragments::mint_story_fragment`,
        functionArguments: [title, content, npcCharacter, questContext, rarity],
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
      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::story_fragments::get_fragment_details`,
          functionArguments: [fragmentAddress],
        },
      });

      const [id, title, content, author, npcCharacter, questContext, rarity, timestamp, interactionCount] = response as any[];
      
      return {
        id: parseInt(id),
        title,
        content,
        author,
        npcCharacter,
        questContext,
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
      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::story_fragments::get_all_fragments`,
          functionArguments: [],
        },
      });

      return response as string[];
    } catch (error) {
      console.error('Error fetching all story fragments:', error);
      return [];
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
        function: `${this.moduleAddress}::story_fragments::interact_with_fragment`,
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
        function: `${this.moduleAddress}::npc_rewards::initialize_player_profile`,
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
      const response = await this.aptos.view({
        payload: {
          function: `${this.moduleAddress}::npc_rewards::get_player_profile`,
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
    } catch (error) {
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
        function: `${this.moduleAddress}::npc_rewards::create_quest`,
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
        function: `${this.moduleAddress}::npc_rewards::complete_quest`,
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
          function: `${this.moduleAddress}::npc_rewards::get_active_quests`,
          functionArguments: [],
        },
      });

      return (response as any[]).map(q => parseInt(q));
    } catch (error) {
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

  // Demo Helper: Create a demo account with some APT
  async createDemoAccount(): Promise<Account> {
    const account = Account.generate();
    
    if (this.network === Network.TESTNET) {
      await this.fundAccount(account.accountAddress.toString(), 200000000); // 2 APT
      
      // Wait a bit for funding to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
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