# Intelligent NPC Ecosystem

An AI-powered GameFi platform built on Aptos blockchain where NPCs create dynamic storylines, generate quests in real-time, and evolve based on player interactions. Players can mint unique story fragments as NFTs and experience procedural game worlds.

## 🌟 Features

- **AI-Powered NPCs**: NPCs powered by Together AI and Groq create dynamic dialogue and evolving personalities
- **Story Fragment NFTs**: Mint unique story moments as NFTs during memorable NPC interactions
- **Dynamic Quest Generation**: AI generates quests and rewards in real-time based on gameplay
- **Procedural World Generation**: AI creates immersive game worlds with unique NPCs and storylines
- **Player Progression**: Level up, gain experience, and track achievements on-chain
- **Demo-Friendly**: Automatic wallet creation with testnet APT for immediate gameplay

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Together AI API key (get from [together.ai](https://together.ai))
- Groq API key (get from [groq.com](https://groq.com))

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repository>
   cd aptos-consumer
   pnpm install
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your API keys in `.env.local`:
   ```
   AI_PROVIDER=together  # or 'groq'
   TOGETHER_API_KEY=your_together_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Deploy Smart Contracts (Optional):**
   ```bash
   cd contracts
   aptos init --network testnet
   aptos move publish --named-addresses npc_ecosystem=<your_address>
   ```

4. **Run the Development Server:**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎮 How to Demo

The app is designed for easy demonstration:

1. **Landing Page**: Showcases the concept with beautiful UI
2. **One-Click Wallet**: Creates a demo wallet with testnet APT automatically
3. **Immediate Gameplay**: Start interacting with NPCs right away
4. **Visual Feedback**: All actions show immediate results in the UI

### Demo Flow:
1. Visit the homepage
2. Click "Connect Wallet" (creates demo wallet automatically)
3. Navigate to "Game World" tab
4. Generate a procedural world
5. Select an NPC and start chatting
6. Watch as story fragments and quests are generated
7. Check "Profile" and "Story Fragments" tabs to see progress

## 🏗️ Architecture

### Frontend (Next.js)
- **Components**: Modular React components with Tailwind CSS
- **Wallet Integration**: Demo-friendly wallet provider for Aptos
- **AI Integration**: Direct API calls to Together AI/Groq
- **State Management**: Zustand for global state

### Smart Contracts (Move)
- **story_fragments.move**: NFT collection for story fragments
- **npc_rewards.move**: Player progression and quest system

### AI Services
- **Together AI**: Primary LLM provider (Llama 3.2 90B)
- **Groq**: Alternative provider (Llama 3.3 70B)
- **Dynamic Prompting**: Context-aware NPC responses

## 🔧 Technical Details

### Smart Contract Functions

**Story Fragments:**
- `mint_story_fragment()`: Create new story NFTs
- `interact_with_fragment()`: Like/favorite fragments
- `get_fragment_details()`: View fragment metadata

**Player Progression:**
- `initialize_player_profile()`: Create player account
- `create_quest()`: Generate new quests
- `complete_quest()`: Claim rewards and XP

### AI Integration

The AI service supports multiple providers and generates:
- Dynamic NPC dialogue based on personality and context
- Procedural quest generation with rewards
- Story fragment creation for memorable moments
- World generation with themed NPCs

## 📦 Deployment

### Vercel Deployment

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add Environment Variables** in Vercel dashboard
4. **Deploy**

The app will work immediately with demo wallets on Aptos testnet.

### Contract Deployment

For production, deploy contracts to Aptos mainnet:

```bash
cd contracts
aptos init --network mainnet
aptos move publish --named-addresses npc_ecosystem=<your_mainnet_address>
```

Update `NEXT_PUBLIC_MODULE_ADDRESS` in environment variables.

## 🎯 Hackathon Highlights

**Why This Wins:**

1. **Innovation**: First truly intelligent NPC ecosystem with AI-generated content
2. **Technical Excellence**: Clean Move contracts + modern React frontend
3. **Demo Ready**: Works immediately without complex setup
4. **User Experience**: Beautiful, intuitive interface
5. **Aptos Integration**: Meaningful use of Aptos features (NFTs, coin transfers, events)
6. **Scalability**: Modular architecture ready for production

**Aptos-Specific Features:**
- Move smart contracts for story fragments and rewards
- Aptos Coin integration for quest rewards
- Event emission for on-chain activity tracking
- Object-based NFT standard implementation

## 🛠️ Development

### Project Structure
```
├── app/                    # Next.js app router
├── components/            # React components
├── contracts/             # Move smart contracts
├── lib/                   # Utility libraries
└── public/               # Static assets
```

### Available Scripts
- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint

## 📝 License

MIT License - see LICENSE file for details.

---

Built with ❤️ for the Aptos hackathon using Next.js, Move, Together AI, and Groq.