import * as SQLite from 'expo-sqlite';
import { DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID } from '../constants/defaults';

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 10;
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  if (currentDbVersion < 1) {
    // Initial schema (v1)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS finance_logs (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sport_logs (
        id TEXT PRIMARY KEY NOT NULL,
        sport_type TEXT NOT NULL,
        distance_km REAL NOT NULL,
        duration_mins INTEGER NOT NULL,
        calories INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS fuel_logs (
        id TEXT PRIMARY KEY NOT NULL,
        odometer INTEGER NOT NULL,
        liters REAL NOT NULL,
        price_per_liter REAL NOT NULL,
        total_cost REAL NOT NULL,
        location TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
      CREATE VIEW IF NOT EXISTS daily_activities AS
        SELECT id, 'FINANCE' as module_type, title as primary_text, subtitle as secondary_text, amount as main_value, type as sub_value, icon, color, created_at, sync_status FROM finance_logs
        UNION ALL
        SELECT id, 'SPORTS' as module_type, sport_type as primary_text, distance_km || ' km • ' || duration_mins || ' mins' as secondary_text, calories as main_value, 'KCAL' as sub_value, 'bicycle' as icon, '#38BDF8' as color, created_at, sync_status FROM sport_logs
        UNION ALL
        SELECT id, 'FUEL' as module_type, location as primary_text, liters || ' L • Odo: ' || odometer as secondary_text, total_cost as main_value, 'EXPENSE' as sub_value, 'water' as icon, '#F43F5E' as color, created_at, sync_status FROM fuel_logs;
      CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        avatar_url TEXT,
        reputation_level TEXT NOT NULL,
        join_date INTEGER NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS app_preferences (
        id TEXT PRIMARY KEY NOT NULL,
        is_biometric_enabled INTEGER NOT NULL,
        is_push_notif_enabled INTEGER NOT NULL,
        is_dark_theme INTEGER NOT NULL,
        language TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS quick_actions_config (
        id TEXT PRIMARY KEY NOT NULL,
        action_id TEXT NOT NULL,
        slot_index INTEGER NOT NULL,
        icon_name TEXT NOT NULL,
        icon_color TEXT NOT NULL,
        icon_bg TEXT NOT NULL,
        label_text TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS wallets (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        balance REAL NOT NULL,
        color_theme TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        category_id TEXT NOT NULL,
        monthly_limit REAL NOT NULL
      );
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        billing_cycle TEXT NOT NULL,
        next_billing_date INTEGER NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL
      );
    `);
  }

  // Migration logic for v5 (Add missing columns to finance_logs safely)
  if (currentDbVersion < 5) {
    try {
      await db.execAsync(`
        ALTER TABLE finance_logs ADD COLUMN wallet_id TEXT DEFAULT '${DEFAULT_WALLET_ID}';
        ALTER TABLE finance_logs ADD COLUMN category_id TEXT DEFAULT '${DEFAULT_CATEGORY_ID}';
      `);
    } catch (e) {
      console.warn('Columns wallet_id or category_id already exist');
    }
  }

  // Migration logic for v6 (Add type column to subscriptions)
  if (currentDbVersion < 6) {
    try {
      await db.execAsync(`
        ALTER TABLE subscriptions ADD COLUMN type TEXT NOT NULL DEFAULT 'EXPENSE';
      `);
    } catch (e) {
      console.warn('Column type might already exist on subscriptions');
    }
  }

  // Migration logic for v7 (Add wallet_id to subscriptions)
  if (currentDbVersion < 7) {
    try {
      await db.execAsync(`
        ALTER TABLE subscriptions ADD COLUMN wallet_id TEXT DEFAULT '${DEFAULT_WALLET_ID}';
      `);
    } catch (e) {
      console.warn('Column wallet_id might already exist on subscriptions');
    }
  }

  // Migration logic for v8 (Add is_paused to subscriptions)
  if (currentDbVersion < 8) {
    try {
      await db.execAsync(`
        ALTER TABLE subscriptions ADD COLUMN is_paused INTEGER DEFAULT 0;
      `);
    } catch (e) {
      console.warn('Column is_paused might already exist on subscriptions');
    }
  }

  // Migration logic for v9 (Add parent_id to categories for Sub-Categories support)
  if (currentDbVersion < 9) {
    try {
      await db.execAsync(`
        ALTER TABLE categories ADD COLUMN parent_id TEXT;
      `);
      // Seed initial sub-categories as an example based on the idea
      await db.execAsync(`
        INSERT OR IGNORE INTO categories (id, name, icon, color, parent_id) VALUES
        ('cat-sub-1', 'Jepang', 'airplane', '#38BDF8', 'cat-2'),
        ('cat-sub-2', 'Prancis', 'airplane', '#38BDF8', 'cat-2'),
        ('cat-sub-3', 'Makan Siang', 'fast-food', '#FACC15', '${DEFAULT_CATEGORY_ID}'),
        ('cat-sub-4', 'Makan Malam', 'restaurant', '#FACC15', '${DEFAULT_CATEGORY_ID}');
      `);
    } catch (e) {
      console.warn('Migration v9 failed', e);
    }
  }

  // Migration logic for v10 (Retry adding parent_id if it failed previously)
  if (currentDbVersion < 10) {
    try {
      await db.execAsync(`
        ALTER TABLE categories ADD COLUMN parent_id TEXT;
      `);
    } catch (e) {
      // Ignored: it means the column probably already exists
    }
  }
  
  // Seed data only on fresh install (version 0 = new device / first install)
  if (currentDbVersion === 0) {
    const now = Date.now();
    await db.execAsync(`
      INSERT OR IGNORE INTO finance_logs (id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id) VALUES
      ('fin-1', 'Salary', 'Income', 3200.00, 'INCOME', 'briefcase', '#10B981', ${now-5000}, ${now-5000}, 0, '${DEFAULT_WALLET_ID}', '${DEFAULT_CATEGORY_ID}'),
      ('fin-2', 'Coffee Shop', 'Food & Beverage', 4.50, 'EXPENSE', 'cafe', '#FACC15', ${now-1000}, ${now-1000}, 0, 'w-2', '${DEFAULT_CATEGORY_ID}');
      
      INSERT OR IGNORE INTO sport_logs (id, sport_type, distance_km, duration_mins, calories, created_at, updated_at, sync_status) VALUES
      ('spt-1', 'Morning Run', 5.2, 32, 410, ${now-4000}, ${now-4000}, 0);
      
      INSERT OR IGNORE INTO fuel_logs (id, odometer, liters, price_per_liter, total_cost, location, created_at, updated_at, sync_status) VALUES
      ('fuel-1', 12450, 10.5, 1.20, 12.60, 'Shell Station', ${now-3000}, ${now-3000}, 0);
      
      INSERT OR IGNORE INTO user_profile (id, first_name, last_name, avatar_url, reputation_level, join_date, sync_status) VALUES
      ('usr-1', 'Jhony', 'Samosir', null, 'Vanguard', ${now}, 0);

      INSERT OR IGNORE INTO app_preferences (id, is_biometric_enabled, is_push_notif_enabled, is_dark_theme, language, sync_status) VALUES
      ('pref-1', 1, 1, 1, 'English', 0);

      INSERT OR IGNORE INTO quick_actions_config (id, action_id, slot_index, icon_name, icon_color, icon_bg, label_text) VALUES
      ('qa-1', 'ADD_EXPENSE', 1, 'wallet', '#FACC15', 'rgba(250, 204, 21, 0.1)', 'Finance'),
      ('qa-2', 'LOG_RUN', 2, 'bicycle', '#38BDF8', 'rgba(56, 189, 248, 0.1)', 'Sports'),
      ('qa-3', 'LOG_FUEL', 3, 'car', '#F43F5E', 'rgba(244, 63, 94, 0.1)', 'Vehicle');
      
      INSERT OR IGNORE INTO wallets (id, name, type, balance, color_theme) VALUES
      ('${DEFAULT_WALLET_ID}', 'Bank BCA', 'BANK', 12450.00, '#0284C7'),
      ('w-2', 'GoPay', 'EWALLET', 320.50, '#10B981'),
      ('w-3', 'Cash', 'CASH', 50.00, '#FACC15');

      INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES
      ('${DEFAULT_CATEGORY_ID}', 'Food & Beverage', 'fast-food', '#FACC15'),
      ('cat-2', 'Transport', 'bus', '#38BDF8'),
      ('cat-3', 'Entertainment', 'game-controller', '#F43F5E');

      INSERT OR IGNORE INTO budgets (id, category_id, monthly_limit) VALUES
      ('b-1', '${DEFAULT_CATEGORY_ID}', 400.00),
      ('b-2', 'cat-2', 150.00),
      ('b-3', 'cat-3', 100.00);

      INSERT OR IGNORE INTO subscriptions (id, name, amount, type, billing_cycle, next_billing_date, icon, color) VALUES
      ('sub-1', 'Netflix', 15.99, 'EXPENSE', 'MONTHLY', ${now + 86400000 * 5}, 'tv', '#E50914'),
      ('sub-2', 'Spotify', 9.99, 'EXPENSE', 'MONTHLY', ${now + 86400000 * 12}, 'musical-notes', '#1DB954'),
      ('sub-3', 'Salary', 3200.00, 'INCOME', 'MONTHLY', ${now + 86400000 * 15}, 'briefcase', '#10B981');
    `);
  }

  // Always bump the version after all migrations complete
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

