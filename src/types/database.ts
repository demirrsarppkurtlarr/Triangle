export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountStatus = "active" | "frozen" | "closed";

export type TransactionType =
  | "transfer"
  | "deposit"
  | "withdrawal"
  | "stock_buy"
  | "stock_sell"
  | "admin_mint"
  | "fee"
  | "game_purchase"
  | "game_sale"
  | "item_trade"
  | "daily_reward"
  | "interest"
  | "rent"
  | "job_pay"
  | "lottery"
  | "quest_reward"
  | "loan_disbursement"
  | "loan_repayment"
  | "deposit_lock"
  | "deposit_unlock"
  | "forex_trade"
  | "crypto_trade"
  | "insurance_premium"
  | "insurance_claim"
  | "prediction_bet"
  | "prediction_win"
  | "battle_pass_reward"
  | "theme_purchase";

export type TransactionStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type NotificationType =
  | "transfer_received"
  | "transfer_sent"
  | "transfer_failed"
  | "account_frozen"
  | "account_unfrozen"
  | "stock_order_filled"
  | "stock_order_rejected"
  | "admin_action"
  | "system"
  | "game_item"
  | "daily_reward"
  | "market_news"
  | "income"
  | "loan"
  | "deposit_matured"
  | "chat_message"
  | "prediction"
  | "battle_pass";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          triangle_id: string;
          username: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          is_frozen: boolean;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          triangle_id: string;
          username: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_frozen?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          triangle_id?: string;
          username?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          is_frozen?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          account_number: string;
          balance: number;
          currency: string;
          status: AccountStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          account_number: string;
          balance?: number;
          currency?: string;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          account_number?: string;
          balance?: number;
          currency?: string;
          status?: AccountStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          reference_id: string;
          type: TransactionType;
          status: TransactionStatus;
          amount: number;
          fee: number;
          from_account_id: string | null;
          to_account_id: string | null;
          initiated_by: string;
          description: string | null;
          metadata: Json;
          idempotency_key: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          is_read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          body: string;
          is_read?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [];
      };
      stock_symbols: {
        Row: {
          symbol: string;
          name: string;
          sector: string | null;
          exchange: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      stock_prices: {
        Row: {
          id: string;
          symbol: string;
          price: number;
          change_amount: number;
          change_percent: number;
          volume: number;
          recorded_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          price: number;
          change_amount?: number;
          change_percent?: number;
          volume?: number;
          recorded_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          quantity: number;
          average_cost: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          quantity?: number;
          average_cost?: number;
        };
        Update: {
          quantity?: number;
          average_cost?: number;
        };
        Relationships: [];
      };
      trades: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          symbol: string;
          side: "buy" | "sell";
          quantity: number;
          price: number;
          total: number;
          executed_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      stock_favorites: {
        Row: {
          user_id: string;
          symbol: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          symbol: string;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          last_active_at: string;
          created_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          created_at?: string;
          revoked_at?: string | null;
        };
        Relationships: [];
      };
      game_items: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          category: string;
          rarity: string;
          shop_price: number;
          sell_back_rate: number;
          icon: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_inventory: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          quantity: number;
          purchase_price: number;
          acquired_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      item_listings: {
        Row: {
          id: string;
          seller_id: string;
          item_id: string;
          quantity: number;
          price: number;
          status: string;
          buyer_id: string | null;
          created_at: string;
          sold_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      daily_reward_claims: {
        Row: {
          id: string;
          user_id: string;
          claim_date: string;
          amount: number;
          streak: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          locale: string;
          email_notifications: boolean;
          transfer_notifications: boolean;
          market_notifications: boolean;
          showcase_vehicle_id: string | null;
          showcase_property_id: string | null;
          showcase_gadget_id: string | null;
          showcase_collectible_id: string | null;
          active_theme: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      transfer_contacts: {
        Row: {
          id: string;
          user_id: string;
          contact_user_id: string;
          transfer_count: number;
          last_transfer_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      market_news: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_tr: string;
          body_en: string;
          body_tr: string;
          sentiment: string;
          impact_percent: number;
          symbols: string[];
          published_at: string;
          expires_at: string | null;
          is_active: boolean;
          applied_at: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      income_cooldowns: {
        Row: {
          user_id: string;
          kind: string;
          last_at: string;
          meta: Json;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      side_jobs: {
        Row: {
          id: string;
          slug: string;
          title_en: string;
          title_tr: string;
          pay_min: number;
          pay_max: number;
          duration_sec: number;
          icon: string;
          is_active: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      active_jobs: {
        Row: {
          user_id: string;
          job_id: string;
          started_at: string;
          completes_at: string;
          claimed: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      loans: {
        Row: {
          id: string;
          user_id: string;
          principal: number;
          interest_rate: number;
          total_due: number;
          amount_paid: number;
          installments: number;
          paid_count: number;
          status: string;
          due_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      credit_scores: {
        Row: {
          user_id: string;
          score: number;
          loans_taken: number;
          loans_repaid: number;
          defaults: number;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      term_deposits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          interest_rate: number;
          term_days: number;
          maturity_amount: number;
          status: string;
          matures_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      forex_pairs: {
        Row: {
          pair: string;
          base_currency: string;
          quote_currency: string;
          rate: number;
          prev_rate: number;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      forex_holdings: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      crypto_assets: {
        Row: {
          symbol: string;
          name: string;
          price: number;
          prev_price: number;
          volatility: number;
          is_active: boolean;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      crypto_holdings: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          quantity: number;
          average_cost: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      insurance_policies: {
        Row: {
          id: string;
          user_id: string;
          policy_type: string;
          coverage_amount: number;
          premium: number;
          status: string;
          expires_at: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string | null;
          channel: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id?: string | null;
          channel?: string;
          content: string;
          created_at?: string;
        };
        Update: Record<string, unknown>;
        Relationships: [];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      season_missions: {
        Row: {
          id: string;
          season_id: string;
          title_en: string;
          title_tr: string;
          description_en: string;
          description_tr: string;
          mission_type: string;
          target_value: number;
          xp_reward: number;
          cash_reward: number;
          sort_order: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_season_progress: {
        Row: {
          id: string;
          user_id: string;
          season_id: string;
          mission_id: string;
          current_value: number;
          completed: boolean;
          claimed: boolean;
          completed_at: string | null;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_season_xp: {
        Row: {
          user_id: string;
          season_id: string;
          total_xp: number;
          level: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          symbol: string;
          question_en: string;
          question_tr: string;
          direction: string;
          target_price: number | null;
          resolves_at: string;
          resolved: boolean;
          outcome: string | null;
          snapshot_price: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      prediction_bets: {
        Row: {
          id: string;
          prediction_id: string;
          user_id: string;
          bet_direction: string;
          amount: number;
          payout: number | null;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      custom_themes: {
        Row: {
          id: string;
          name: string;
          description_en: string;
          description_tr: string;
          price: number;
          css_vars: Json;
          is_free: boolean;
          sort_order: number;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      user_themes: {
        Row: {
          user_id: string;
          theme_id: string;
          purchased_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_users: {
        Args: { p_query: string };
        Returns: {
          triangle_id: string;
          username: string;
          full_name: string | null;
        }[];
      };
      transfer_funds: {
        Args: {
          p_to_triangle_id: string;
          p_amount: number;
          p_description?: string | null;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      admin_mint_funds: {
        Args: {
          p_target_triangle_id: string;
          p_amount: number;
          p_reason?: string;
        };
        Returns: Json;
      };
      admin_freeze_user: {
        Args: {
          p_target_triangle_id: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      admin_unfreeze_user: {
        Args: {
          p_target_triangle_id: string;
        };
        Returns: Json;
      };
      buy_stock: {
        Args: {
          p_symbol: string;
          p_quantity: number;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      sell_stock: {
        Args: {
          p_symbol: string;
          p_quantity: number;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      tick_game_prices: {
        Args: Record<string, never>;
        Returns: Json;
      };
      buy_game_item: {
        Args: {
          p_item_id: string;
          p_quantity?: number;
        };
        Returns: Json;
      };
      sell_game_item: {
        Args: {
          p_item_id: string;
          p_quantity?: number;
        };
        Returns: Json;
      };
      list_inventory_item: {
        Args: {
          p_item_id: string;
          p_quantity: number;
          p_price: number;
        };
        Returns: Json;
      };
      cancel_item_listing: {
        Args: {
          p_listing_id: string;
        };
        Returns: Json;
      };
      buy_item_listing: {
        Args: {
          p_listing_id: string;
        };
        Returns: Json;
      };
      ensure_user_preferences: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      get_daily_reward_status: {
        Args: Record<string, never>;
        Returns: Json;
      };
      claim_daily_reward: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_leaderboard: {
        Args: {
          p_limit?: number;
        };
        Returns: {
          rank: number;
          user_id: string;
          username: string;
          triangle_id: string;
          cash: number;
          portfolio_value: number;
          inventory_value: number;
          net_worth: number;
        }[];
      };
      apply_market_news: {
        Args: {
          p_news_id?: string | null;
        };
        Returns: Json;
      };
      upsert_transfer_contact: {
        Args: {
          p_user_id: string;
          p_contact_user_id: string;
        };
        Returns: undefined;
      };
      equip_showcase_item: {
        Args: {
          p_slot: string;
          p_item_id: string | null;
        };
        Returns: Json;
      };
      update_user_preferences: {
        Args: {
          p_locale?: string | null;
          p_email_notifications?: boolean | null;
          p_transfer_notifications?: boolean | null;
          p_market_notifications?: boolean | null;
        };
        Returns: Json;
      };
      admin_upsert_market_news: {
        Args: {
          p_slug: string;
          p_title_en: string;
          p_title_tr: string;
          p_body_en: string;
          p_body_tr: string;
          p_sentiment: string;
          p_impact_percent: number;
          p_symbols: string[];
        };
        Returns: string;
      };
      admin_set_game_item_active: {
        Args: {
          p_item_id: string;
          p_is_active: boolean;
        };
        Returns: undefined;
      };
      admin_update_economy_setting: {
        Args: {
          p_key: string;
          p_value: Json;
        };
        Returns: undefined;
      };
      spawn_market_news: {
        Args: Record<string, never>;
        Returns: Json;
      };
      claim_bank_interest: {
        Args: Record<string, never>;
        Returns: Json;
      };
      claim_property_rent: {
        Args: Record<string, never>;
        Returns: Json;
      };
      start_side_job: {
        Args: { p_job_id: string };
        Returns: Json;
      };
      claim_side_job: {
        Args: Record<string, never>;
        Returns: Json;
      };
      play_lucky_spin: {
        Args: Record<string, never>;
        Returns: Json;
      };
      claim_quest_reward: {
        Args: { p_quest: string };
        Returns: Json;
      };
      take_loan: {
        Args: { p_amount: number; p_installments?: number };
        Returns: Json;
      };
      repay_loan: {
        Args: { p_loan_id: string };
        Returns: Json;
      };
      create_term_deposit: {
        Args: { p_amount: number; p_term_days?: number };
        Returns: Json;
      };
      withdraw_term_deposit: {
        Args: { p_deposit_id: string };
        Returns: Json;
      };
      tick_forex_rates: {
        Args: Record<string, never>;
        Returns: Json;
      };
      buy_forex: {
        Args: { p_pair: string; p_usd_amount: number };
        Returns: Json;
      };
      sell_forex: {
        Args: { p_pair: string; p_currency_amount: number };
        Returns: Json;
      };
      tick_crypto_prices: {
        Args: Record<string, never>;
        Returns: Json;
      };
      buy_crypto: {
        Args: { p_symbol: string; p_usd_amount: number };
        Returns: Json;
      };
      sell_crypto: {
        Args: { p_symbol: string; p_quantity: number };
        Returns: Json;
      };
      buy_insurance: {
        Args: { p_type: string; p_coverage: number };
        Returns: Json;
      };
      send_chat_message: {
        Args: { p_content: string; p_receiver_id?: string | null; p_channel?: string };
        Returns: Json;
      };
      place_prediction_bet: {
        Args: { p_prediction_id: string; p_direction: string; p_amount: number };
        Returns: Json;
      };
      resolve_predictions: {
        Args: Record<string, never>;
        Returns: Json;
      };
      spawn_prediction: {
        Args: Record<string, never>;
        Returns: Json;
      };
      buy_theme: {
        Args: { p_theme_id: string };
        Returns: Json;
      };
      claim_season_mission: {
        Args: { p_mission_id: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
