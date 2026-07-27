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
  | "fee";

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
  | "system";

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
