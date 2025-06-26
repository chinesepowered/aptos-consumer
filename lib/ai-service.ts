import axios from 'axios';

export interface NPCCharacter {
  id: string;
  name: string;
  personality: string;
  background: string;
  currentContext: string;
  questObjectives?: string[];
}

export interface AIResponse {
  dialogue: string;
  questGenerated?: {
    title: string;
    description: string;
    objectives: string[];
    rewardAmount: number;
    experienceReward: number;
    requiredLevel: number;
  };
  storyFragment?: {
    title: string;
    content: string;
    rarity: number;
  };
  nextContext: string;
}

class AIService {
  private provider: 'together' | 'groq';
  private apiKey: string;

  constructor() {
    this.provider = (process.env.AI_PROVIDER as 'together' | 'groq') || 'together';
    this.apiKey = this.provider === 'together' 
      ? process.env.TOGETHER_API_KEY!
      : process.env.GROQ_API_KEY!;
  }

  async generateNPCResponse(
    character: NPCCharacter,
    playerMessage: string,
    playerLevel: number,
    gameContext: any = {}
  ): Promise<AIResponse> {
    const prompt = this.buildNPCPrompt(character, playerMessage, playerLevel, gameContext);
    
    try {
      const response = await this.callAIProvider(prompt);
      return this.parseAIResponse(response, character);
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(character);
    }
  }

  private buildNPCPrompt(
    character: NPCCharacter,
    playerMessage: string,
    playerLevel: number,
    gameContext: any
  ): string {
    return `You are ${character.name}, an intelligent NPC in a GameFi ecosystem. 

Character Details:
- Name: ${character.name}
- Personality: ${character.personality}
- Background: ${character.background}
- Current Context: ${character.currentContext}
- Player Level: ${playerLevel}

Game Context: ${JSON.stringify(gameContext)}

Player says: "${playerMessage}"

Respond as ${character.name} would, and consider:
1. Generate engaging dialogue that fits your personality
2. Potentially create a quest if appropriate for the interaction
3. Sometimes generate a story fragment NFT from this interaction
4. Update your context based on this conversation

Respond in this exact JSON format:
{
  "dialogue": "Your response as the NPC",
  "questGenerated": {
    "title": "Quest Title",
    "description": "Quest description",
    "objectives": ["objective1", "objective2"],
    "rewardAmount": 1000000,
    "experienceReward": 100,
    "requiredLevel": 1
  },
  "storyFragment": {
    "title": "Fragment Title",
    "content": "Memorable story content from this interaction",
    "rarity": 3
  },
  "nextContext": "Updated context after this interaction"
}

Only include questGenerated if a quest should be created. Only include storyFragment if this interaction creates a memorable story moment. Always include dialogue and nextContext.`;
  }

  private async callAIProvider(prompt: string): Promise<string> {
    // Try primary provider first
    try {
      if (this.provider === 'together') {
        return await this.callTogetherAI(prompt);
      } else {
        return await this.callGroqAI(prompt);
      }
    } catch (error: any) {
      if (error.message === 'RATE_LIMITED') {
        console.log('Primary provider rate limited, trying fallback...');
        // Try the other provider as fallback
        try {
          if (this.provider === 'together') {
            return await this.callGroqAI(prompt);
          } else {
            return await this.callTogetherAI(prompt);
          }
        } catch (fallbackError) {
          console.log('Fallback provider also failed');
          throw fallbackError;
        }
      }
      throw error;
    }
  }

  private async callTogetherAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo-Free',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at roleplaying as game NPCs and generating engaging content. Always respond with valid JSON. Ensure all strings are properly quoted and escaped.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log('Together AI rate limited, falling back to Groq');
        throw new Error('RATE_LIMITED');
      }
      throw error;
    }
  }

  private async callGroqAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at roleplaying as game NPCs and generating engaging content. Always respond with valid JSON. Ensure all strings are properly quoted and escaped.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log('Groq rate limited');
        throw new Error('RATE_LIMITED');
      }
      throw error;
    }
  }

  private parseAIResponse(response: string, character: NPCCharacter): AIResponse {
    try {
      // Clean up the response in case it has markdown formatting
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanResponse);
      
      return {
        dialogue: parsed.dialogue || "Hello, traveler!",
        questGenerated: parsed.questGenerated,
        storyFragment: parsed.storyFragment,
        nextContext: parsed.nextContext || character.currentContext
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.getFallbackResponse(character);
    }
  }

  private getFallbackResponse(character: NPCCharacter): AIResponse {
    const fallbackDialogues = [
      `Greetings, traveler! I am ${character.name}. What brings you to these lands?`,
      `*${character.name} looks up from their work* Oh, hello there! How can I assist you today?`,
      `Welcome! I've been expecting someone like you. There are many adventures to be had here.`,
    ];

    return {
      dialogue: fallbackDialogues[Math.floor(Math.random() * fallbackDialogues.length)],
      nextContext: character.currentContext
    };
  }

  async generateProceduralWorld(theme: string, playerLevel: number): Promise<{
    description: string;
    npcs: NPCCharacter[];
    questHooks: string[];
  }> {
    const prompt = `Generate a procedural game world for a GameFi NPC ecosystem.

Theme: ${theme}
Player Level: ${playerLevel}

Create a world with:
1. An engaging description of the environment
2. 3-4 NPCs with distinct personalities and backgrounds
3. Potential quest hooks that emerge from this world

Respond in this JSON format:
{
  "description": "Rich description of the world/area",
  "npcs": [
    {
      "id": "npc_1",
      "name": "NPC Name",
      "personality": "personality description",
      "background": "background story",
      "currentContext": "what they're currently doing/thinking"
    }
  ],
  "questHooks": ["potential quest idea 1", "potential quest idea 2"]
}`;

    try {
      const response = await this.callAIProvider(prompt);
      let cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Additional cleaning for common JSON issues
      cleanResponse = this.sanitizeJsonResponse(cleanResponse);
      
      const parsed = JSON.parse(cleanResponse);
      
      // Validate the required structure
      if (!parsed.description || !parsed.npcs || !parsed.questHooks) {
        throw new Error('Invalid response structure');
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to generate procedural world:', error);
      return this.getFallbackWorld(theme);
    }
  }

  private sanitizeJsonResponse(response: string): string {
    // Remove any text before the first { and after the last }
    const firstBrace = response.indexOf('{');
    const lastBrace = response.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No valid JSON structure found');
    }
    
    const cleaned = response.substring(firstBrace, lastBrace + 1);
    return cleaned;
  }

  private getFallbackWorld(theme: string): {
    description: string;
    npcs: NPCCharacter[];
    questHooks: string[];
  } {
    // Provide a few different fallback worlds for variety
    const fallbackWorlds = [
      {
        description: `A mystical ${theme} realm where ancient magic meets cutting-edge technology. Floating islands drift through ethereal mists, connected by bridges of pure energy.`,
        npcs: [
          {
            id: 'elder_sage',
            name: 'Elder Zephyr',
            personality: 'Wise and mysterious, speaks in riddles',
            background: 'An ancient guardian of this realm who has witnessed countless travelers',
            currentContext: 'Meditating by the central energy nexus, sensing disturbances in the realm'
          },
          {
            id: 'young_inventor',
            name: 'Kaia the Tinkerer',
            personality: 'Enthusiastic and innovative, always building something new',
            background: 'A young genius who combines magic with technology',
            currentContext: 'Working on a new device that could revolutionize travel between realms'
          }
        ],
        questHooks: [
          'The energy nexus is showing strange fluctuations that could destabilize the realm',
          'Ancient artifacts have been discovered that could unlock new powers'
        ]
      },
      {
        description: `A vibrant ${theme} marketplace where traders from across dimensions gather to exchange exotic goods and share tales of distant worlds.`,
        npcs: [
          {
            id: 'merchant_captain',
            name: 'Captain Thorne',
            personality: 'Charismatic and well-traveled, full of stories',
            background: 'A legendary trader who has visited realms beyond imagination',
            currentContext: 'Organizing a caravan for a dangerous but profitable expedition'
          },
          {
            id: 'mystical_oracle',
            name: 'Seer Lyralei',
            personality: 'Enigmatic and prophetic, speaks of futures untold',
            background: 'A fortune teller whose visions have saved countless lives',
            currentContext: 'Reading the cosmic signs and sensing great change approaching'
          }
        ],
        questHooks: [
          'A valuable shipment has gone missing on the interdimensional trade routes',
          'Strange omens suggest a legendary treasure will soon be revealed'
        ]
      }
    ];

    return fallbackWorlds[Math.floor(Math.random() * fallbackWorlds.length)];
  }
}

export const aiService = new AIService();