import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: 'Admin' | 'Researcher' | 'Farmer' | 'Student';
          auth_method: 'email' | 'metamask' | 'did' | 'cognito' | 'social';
          password_hash: string | null;
          wallet_address: string | null;
          did_identifier: string | null;
          cognito_user_id: string | null;
          metadata: Record<string, any>;
          preferences: {
            theme?: 'light' | 'dark' | 'system';
            accessibility?: Record<string, any>;
          };
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          ip_address: string | null;
          user_agent: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_sessions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_sessions']['Insert']>;
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource: string | null;
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_activity']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_activity']['Insert']>;
      };
    };
  };
};
