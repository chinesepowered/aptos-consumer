module npc_ecosystem::npc_ecosystem {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    // Story Fragment NFT structure
    struct StoryFragment has key {
        id: u64,
        title: String,
        content: String,
        author: address,
        npc_character: String,
        rarity: u8,
        timestamp: u64,
        interaction_count: u64,
    }

    // Player profile
    struct PlayerProfile has key {
        level: u64,
        experience: u64,
        completed_quests: vector<u64>,
        story_fragments_owned: u64,
        npc_interactions: u64,
        last_interaction: u64,
    }

    // Quest structure
    struct Quest has key {
        id: u64,
        title: String,
        description: String,
        npc_character: String,
        reward_amount: u64,
        experience_reward: u64,
        required_level: u64,
        is_active: bool,
        completion_count: u64,
    }

    // Global registry
    struct GameRegistry has key {
        next_fragment_id: u64,
        next_quest_id: u64,
        total_fragments: u64,
        total_quests: u64,
        total_rewards_distributed: u64,
    }

    // Events
    #[event]
    struct StoryFragmentMinted has drop, store {
        fragment_id: u64,
        author: address,
        title: String,
        npc_character: String,
        rarity: u8,
    }

    #[event]
    struct QuestCompleted has drop, store {
        quest_id: u64,
        player: address,
        reward_amount: u64,
        experience_gained: u64,
    }

    #[event]
    struct PlayerLevelUp has drop, store {
        player: address,
        new_level: u64,
        total_experience: u64,
    }

    // Initialize the module
    fun init_module(account: &signer) {
        let registry = GameRegistry {
            next_fragment_id: 1,
            next_quest_id: 1,
            total_fragments: 0,
            total_quests: 0,
            total_rewards_distributed: 0,
        };
        move_to(account, registry);
    }

    // Initialize player profile
    public entry fun initialize_player_profile(account: &signer) {
        let profile = PlayerProfile {
            level: 1,
            experience: 0,
            completed_quests: vector::empty(),
            story_fragments_owned: 0,
            npc_interactions: 0,
            last_interaction: timestamp::now_seconds(),
        };
        move_to(account, profile);
    }

    // Mint a story fragment
    public entry fun mint_story_fragment(
        account: &signer,
        title: String,
        content: String,
        npc_character: String,
        rarity: u8,
    ) acquires GameRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<GameRegistry>(@npc_ecosystem);
        
        let fragment_id = registry.next_fragment_id;
        registry.next_fragment_id = registry.next_fragment_id + 1;
        registry.total_fragments = registry.total_fragments + 1;

        let fragment = StoryFragment {
            id: fragment_id,
            title,
            content,
            author: account_addr,
            npc_character,
            rarity,
            timestamp: timestamp::now_seconds(),
            interaction_count: 0,
        };

        move_to(account, fragment);

        // Emit event
        event::emit(StoryFragmentMinted {
            fragment_id,
            author: account_addr,
            title,
            npc_character,
            rarity,
        });
    }

    // Create a quest
    public entry fun create_quest(
        account: &signer,
        title: String,
        description: String,
        npc_character: String,
        reward_amount: u64,
        experience_reward: u64,
        required_level: u64,
    ) acquires GameRegistry {
        let registry = borrow_global_mut<GameRegistry>(@npc_ecosystem);
        let quest_id = registry.next_quest_id;
        registry.next_quest_id = registry.next_quest_id + 1;
        registry.total_quests = registry.total_quests + 1;

        let quest = Quest {
            id: quest_id,
            title,
            description,
            npc_character,
            reward_amount,
            experience_reward,
            required_level,
            is_active: true,
            completion_count: 0,
        };

        move_to(account, quest);
    }

    // Complete a quest
    public entry fun complete_quest(
        account: &signer,
        quest_id: u64,
        quest_owner: address,
    ) acquires PlayerProfile, Quest, GameRegistry {
        let player_addr = signer::address_of(account);
        
        // Initialize profile if it doesn't exist
        if (!exists<PlayerProfile>(player_addr)) {
            initialize_player_profile(account);
        };

        let profile = borrow_global_mut<PlayerProfile>(player_addr);
        let quest = borrow_global_mut<Quest>(quest_owner);
        let registry = borrow_global_mut<GameRegistry>(@npc_ecosystem);

        // Check requirements
        assert!(quest.is_active, 1);
        assert!(profile.level >= quest.required_level, 2);
        assert!(!vector::contains(&profile.completed_quests, &quest_id), 3);

        // Award experience
        profile.experience = profile.experience + quest.experience_reward;
        let new_level = calculate_level_from_experience(profile.experience);
        let leveled_up = new_level > profile.level;
        profile.level = new_level;

        // Mark quest as completed
        vector::push_back(&mut profile.completed_quests, quest_id);
        quest.completion_count = quest.completion_count + 1;
        registry.total_rewards_distributed = registry.total_rewards_distributed + quest.reward_amount;

        // Update interaction stats
        profile.npc_interactions = profile.npc_interactions + 1;
        profile.last_interaction = timestamp::now_seconds();

        // Emit events
        event::emit(QuestCompleted {
            quest_id,
            player: player_addr,
            reward_amount: quest.reward_amount,
            experience_gained: quest.experience_reward,
        });

        if (leveled_up) {
            event::emit(PlayerLevelUp {
                player: player_addr,
                new_level: profile.level,
                total_experience: profile.experience,
            });
        };
    }

    // Interact with a story fragment
    public entry fun interact_with_fragment(
        _account: &signer,
        fragment_owner: address,
    ) acquires StoryFragment {
        let fragment = borrow_global_mut<StoryFragment>(fragment_owner);
        fragment.interaction_count = fragment.interaction_count + 1;
    }

    // Helper function to calculate level from experience
    fun calculate_level_from_experience(experience: u64): u64 {
        if (experience < 100) return 1;
        if (experience < 250) return 2;
        if (experience < 500) return 3;
        if (experience < 1000) return 4;
        if (experience < 2000) return 5;
        if (experience < 4000) return 6;
        if (experience < 8000) return 7;
        if (experience < 16000) return 8;
        if (experience < 32000) return 9;
        return 10 + (experience - 32000) / 10000
    }

    // View functions
    #[view]
    public fun get_player_profile(player: address): (u64, u64, vector<u64>, u64, u64, u64) acquires PlayerProfile {
        let profile = borrow_global<PlayerProfile>(player);
        (
            profile.level,
            profile.experience,
            profile.completed_quests,
            profile.story_fragments_owned,
            profile.npc_interactions,
            profile.last_interaction
        )
    }

    #[view]
    public fun get_fragment_details(fragment_owner: address): (u64, String, String, address, String, u8, u64, u64) acquires StoryFragment {
        let fragment = borrow_global<StoryFragment>(fragment_owner);
        (
            fragment.id,
            fragment.title,
            fragment.content,
            fragment.author,
            fragment.npc_character,
            fragment.rarity,
            fragment.timestamp,
            fragment.interaction_count
        )
    }

    #[view]
    public fun get_total_fragments(): u64 acquires GameRegistry {
        let registry = borrow_global<GameRegistry>(@npc_ecosystem);
        registry.total_fragments
    }

    #[view]
    public fun get_total_quests(): u64 acquires GameRegistry {
        let registry = borrow_global<GameRegistry>(@npc_ecosystem);
        registry.total_quests
    }
}