module npc_ecosystem::story_fragments {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use std::option;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::object;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_STORY_NOT_FOUND: u64 = 2;
    const E_INVALID_FRAGMENT: u64 = 3;

    // Story Fragment NFT structure
    struct StoryFragment has key {
        id: u64,
        title: String,
        content: String,
        author: address,
        npc_character: String,
        quest_context: String,
        rarity: u8, // 1-5 scale
        timestamp: u64,
        interaction_count: u64,
    }

    // Global story registry
    struct StoryRegistry has key {
        next_id: u64,
        fragments: vector<address>, // addresses of story fragment tokens
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
    struct StoryFragmentInteracted has drop, store {
        fragment_id: u64,
        interactor: address,
        interaction_type: String,
    }

    // Initialize the module
    fun init_module(account: &signer) {
        let registry = StoryRegistry {
            next_id: 1,
            fragments: vector::empty(),
        };
        move_to(account, registry);

        // Create the story fragments collection
        collection::create_unlimited_collection(
            account,
            string::utf8(b"Intelligent NPC Story Fragments"),
            string::utf8(b"Procedurally generated story fragments from AI-powered NPCs"),
            option::none(),
            string::utf8(b"https://aptos-npc-ecosystem.vercel.app")
        );
    }

    // Mint a new story fragment NFT
    public entry fun mint_story_fragment(
        account: &signer,
        title: String,
        content: String,
        npc_character: String,
        quest_context: String,
        rarity: u8,
    ) acquires StoryRegistry {
        let account_addr = signer::address_of(account);
        let registry = borrow_global_mut<StoryRegistry>(@npc_ecosystem);
        
        let fragment_id = registry.next_id;
        registry.next_id = registry.next_id + 1;

        // Create the token
        let constructor_ref = token::create_named_token(
            account,
            string::utf8(b"Intelligent NPC Story Fragments"),
            string::utf8(b"Story Fragment #"),
            title,
            option::none(),
            string::utf8(b"https://aptos-npc-ecosystem.vercel.app/api/metadata/")
        );

        let token_signer = object::generate_signer(&constructor_ref);
        let token_addr = signer::address_of(&token_signer);

        // Store fragment data
        let fragment = StoryFragment {
            id: fragment_id,
            title,
            content,
            author: account_addr,
            npc_character,
            quest_context,
            rarity,
            timestamp: timestamp::now_seconds(),
            interaction_count: 0,
        };

        move_to(&token_signer, fragment);
        vector::push_back(&mut registry.fragments, token_addr);

        // Emit event
        event::emit(StoryFragmentMinted {
            fragment_id,
            author: account_addr,
            title,
            npc_character,
            rarity,
        });
    }

    // Interact with a story fragment (like, comment, use in quest)
    public entry fun interact_with_fragment(
        account: &signer,
        fragment_addr: address,
        interaction_type: String,
    ) acquires StoryFragment {
        let fragment = borrow_global_mut<StoryFragment>(fragment_addr);
        fragment.interaction_count = fragment.interaction_count + 1;

        event::emit(StoryFragmentInteracted {
            fragment_id: fragment.id,
            interactor: signer::address_of(account),
            interaction_type,
        });
    }

    // View functions
    #[view]
    public fun get_fragment_details(fragment_addr: address): (u64, String, String, address, String, String, u8, u64, u64) acquires StoryFragment {
        let fragment = borrow_global<StoryFragment>(fragment_addr);
        (
            fragment.id,
            fragment.title,
            fragment.content,
            fragment.author,
            fragment.npc_character,
            fragment.quest_context,
            fragment.rarity,
            fragment.timestamp,
            fragment.interaction_count
        )
    }

    #[view]
    public fun get_total_fragments(): u64 acquires StoryRegistry {
        let registry = borrow_global<StoryRegistry>(@npc_ecosystem);
        registry.next_id - 1
    }

    #[view]
    public fun get_all_fragments(): vector<address> acquires StoryRegistry {
        let registry = borrow_global<StoryRegistry>(@npc_ecosystem);
        registry.fragments
    }
}