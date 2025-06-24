module npc_ecosystem::npc_rewards {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::aptos_coin::AptosCoin;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;
    const E_QUEST_NOT_FOUND: u64 = 3;
    const E_QUEST_ALREADY_COMPLETED: u64 = 4;

    // Player progression structure
    struct PlayerProfile has key {
        level: u64,
        experience: u64,
        completed_quests: vector<u64>,
        story_fragments_owned: u64,
        npc_interactions: u64,
        last_interaction: u64,
    }

    // Quest structure
    struct Quest has key, store {
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

    // Global quest registry
    struct QuestRegistry has key {
        next_quest_id: u64,
        active_quests: vector<u64>,
        total_rewards_distributed: u64,
    }

    // Events
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

    #[event]
    struct QuestCreated has drop, store {
        quest_id: u64,
        title: String,
        npc_character: String,
        reward_amount: u64,
    }

    // Initialize the module
    fun init_module(account: &signer) {
        let registry = QuestRegistry {
            next_quest_id: 1,
            active_quests: vector::empty(),
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

    // Create a new quest (called by NPCs/admin)
    public entry fun create_quest(
        account: &signer,
        title: String,
        description: String,
        npc_character: String,
        reward_amount: u64,
        experience_reward: u64,
        required_level: u64,
    ) acquires QuestRegistry {
        let registry = borrow_global_mut<QuestRegistry>(@npc_ecosystem);
        let quest_id = registry.next_quest_id;
        registry.next_quest_id = registry.next_quest_id + 1;

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

        vector::push_back(&mut registry.active_quests, quest_id);
        move_to(account, quest);

        event::emit(QuestCreated {
            quest_id,
            title,
            npc_character,
            reward_amount,
        });
    }

    // Complete a quest and claim rewards
    public entry fun complete_quest(
        account: &signer,
        quest_id: u64,
        quest_owner: address,
    ) acquires PlayerProfile, Quest, QuestRegistry {
        let player_addr = signer::address_of(account);
        
        // Check if player profile exists, create if not
        if (!exists<PlayerProfile>(player_addr)) {
            initialize_player_profile(account);
        };

        let profile = borrow_global_mut<PlayerProfile>(player_addr);
        let quest = borrow_global_mut<Quest>(quest_owner);
        let registry = borrow_global_mut<QuestRegistry>(@npc_ecosystem);

        // Verify quest requirements
        assert!(quest.is_active, E_QUEST_NOT_FOUND);
        assert!(profile.level >= quest.required_level, E_NOT_AUTHORIZED);
        assert!(!vector::contains(&profile.completed_quests, &quest_id), E_QUEST_ALREADY_COMPLETED);

        // Award experience and check for level up
        profile.experience = profile.experience + quest.experience_reward;
        let new_level = calculate_level_from_experience(profile.experience);
        let leveled_up = new_level > profile.level;
        profile.level = new_level;

        // Mark quest as completed
        vector::push_back(&mut profile.completed_quests, quest_id);
        quest.completion_count = quest.completion_count + 1;
        registry.total_rewards_distributed = registry.total_rewards_distributed + quest.reward_amount;

        // Transfer APT reward
        if (quest.reward_amount > 0) {
            coin::transfer<AptosCoin>(account, player_addr, quest.reward_amount);
        };

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

    // Update story fragment count (called when player mints/receives fragments)
    public entry fun update_story_fragments(
        account: &signer,
        count: u64,
    ) acquires PlayerProfile {
        let player_addr = signer::address_of(account);
        if (!exists<PlayerProfile>(player_addr)) {
            initialize_player_profile(account);
        };
        
        let profile = borrow_global_mut<PlayerProfile>(player_addr);
        profile.story_fragments_owned = count;
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
    public fun get_quest_details(quest_owner: address): (u64, String, String, String, u64, u64, u64, bool, u64) acquires Quest {
        let quest = borrow_global<Quest>(quest_owner);
        (
            quest.id,
            quest.title,
            quest.description,
            quest.npc_character,
            quest.reward_amount,
            quest.experience_reward,
            quest.required_level,
            quest.is_active,
            quest.completion_count
        )
    }

    #[view]
    public fun get_active_quests(): vector<u64> acquires QuestRegistry {
        let registry = borrow_global<QuestRegistry>(@npc_ecosystem);
        registry.active_quests
    }

    #[view]
    public fun get_total_rewards_distributed(): u64 acquires QuestRegistry {
        let registry = borrow_global<QuestRegistry>(@npc_ecosystem);
        registry.total_rewards_distributed
    }
}