import { db } from '../../server/db';

export async function GET(request: Request) {
  try {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      // We create core tables first (referenced by others)
      await client.query(`
        CREATE TABLE IF NOT EXISTS wallets (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance REAL NOT NULL,
          color_theme TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          parent_id TEXT,
          FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS finance_logs (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          subtitle TEXT NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0,
          wallet_id TEXT,
          category_id TEXT,
          FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_finance_user_date ON finance_logs(user_id, created_at);

        CREATE TABLE IF NOT EXISTS sport_logs (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          sport_type TEXT NOT NULL,
          distance_km REAL NOT NULL,
          duration_mins INTEGER NOT NULL,
          calories INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_sport_user_date ON sport_logs(user_id, created_at);

        CREATE TABLE IF NOT EXISTS fuel_logs (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          odometer INTEGER NOT NULL,
          liters REAL NOT NULL,
          price_per_liter REAL NOT NULL,
          total_cost REAL NOT NULL,
          location TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_fuel_user_date ON fuel_logs(user_id, created_at);

        CREATE TABLE IF NOT EXISTS user_profile (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          avatar_url TEXT,
          reputation_level TEXT NOT NULL,
          join_date TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_profile_user ON user_profile(user_id);

        CREATE TABLE IF NOT EXISTS app_preferences (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          is_biometric_enabled INTEGER NOT NULL,
          is_push_notif_enabled INTEGER NOT NULL,
          is_dark_theme INTEGER NOT NULL,
          language TEXT NOT NULL,
          sync_status INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS quick_actions_config (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          action_id TEXT NOT NULL,
          slot_index INTEGER NOT NULL,
          icon_name TEXT NOT NULL,
          icon_color TEXT NOT NULL,
          icon_bg TEXT NOT NULL,
          label_text TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          category_id TEXT NOT NULL,
          monthly_limit REAL NOT NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          billing_cycle TEXT NOT NULL,
          next_billing_date TIMESTAMPTZ NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          wallet_id TEXT,
          type TEXT NOT NULL DEFAULT 'EXPENSE',
          is_paused INTEGER DEFAULT 0,
          FOREIGN KEY (wallet_id) REFERENCES wallets (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS master_dictionary (
          id TEXT PRIMARY KEY NOT NULL,
          base_word TEXT NOT NULL,
          translation TEXT NOT NULL,
          word_type TEXT NOT NULL,
          v2 TEXT,
          v3 TEXT,
          v_ing TEXT,
          example_sentence TEXT,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_dict_word ON master_dictionary(base_word);
        CREATE INDEX IF NOT EXISTS idx_dict_type ON master_dictionary(word_type);

        CREATE TABLE IF NOT EXISTS user_vocab_progress (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          word_id TEXT NOT NULL,
          status TEXT DEFAULT 'LEARNING',
          is_favorite INTEGER NOT NULL DEFAULT 0,
          last_read_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL,
          sync_status INTEGER DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_vocab_user ON user_vocab_progress(user_id);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_vocab_user_word ON user_vocab_progress(user_id, word_id);

        CREATE OR REPLACE VIEW daily_activities AS
          SELECT id, user_id, 'FINANCE' as module_type, title as primary_text, subtitle as secondary_text, amount as main_value, type as sub_value, icon, color, created_at, sync_status FROM finance_logs
          UNION ALL
          SELECT id, user_id, 'SPORTS' as module_type, sport_type as primary_text, distance_km::TEXT || ' km • ' || duration_mins::TEXT || ' mins' as secondary_text, calories::REAL as main_value, 'KCAL' as sub_value, 'bicycle' as icon, '#38BDF8' as color, created_at, sync_status FROM sport_logs
          UNION ALL
          SELECT id, user_id, 'FUEL' as module_type, location as primary_text, liters::TEXT || ' L • Odo: ' || odometer::TEXT as secondary_text, total_cost as main_value, 'EXPENSE' as sub_value, 'water' as icon, '#F43F5E' as color, created_at, sync_status FROM fuel_logs;
      `);

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return Response.json({ 
      success: true, 
      message: 'Semua tabel Enterprise berhasil dibuat di PostgreSQL (dengan TIMESTAMPTZ, user_id, Foreign Keys, & Indexes)!'
    });
  } catch (error: any) {
    console.error('Database init error:', error);
    return Response.json({ 
      success: false, 
      error: 'Gagal membuat tabel',
      details: error.message
    }, { status: 500 });
  }
}
