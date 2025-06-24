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
    if (this.provider === 'together') {
      return this.callTogetherAI(prompt);
    } else {
      return this.callGroqAI(prompt);
    }
  }

  private async callTogetherAI(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at roleplaying as game NPCs and generating engaging content. Always respond with valid JSON.'
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
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callGroqAI(prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at roleplaying as game NPCs and generating engaging content. Always respond with valid JSON.'
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
        }
      }
    );

    return response.data.choices[0].message.content;
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
      const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Failed to generate procedural world:', error);
      return this.getFallbackWorld(theme);
    }
  }

  private getFallbackWorld(theme: string): {
    description: string;
    npcs: NPCCharacter[];
    questHooks: string[];
  } {
    return {
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
    };
  }
}

export const aiService = new AIService();