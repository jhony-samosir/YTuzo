import * as SQLite from 'expo-sqlite';
import { DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID } from '../constants/defaults';
import { seedInitialData } from './seed';

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 1; // Reset kembali ke 1
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  
  await db.execAsync(`PRAGMA journal_mode = 'wal';`);

  if (currentDbVersion < 1) {
    // Initial schema gabungan yang bersih
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
        sync_status INTEGER DEFAULT 0,
        wallet_id TEXT DEFAULT '${DEFAULT_WALLET_ID}',
        category_id TEXT DEFAULT '${DEFAULT_CATEGORY_ID}'
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
        color TEXT NOT NULL,
        parent_id TEXT
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
        color TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'EXPENSE',
        wallet_id TEXT DEFAULT '${DEFAULT_WALLET_ID}',
        is_paused INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS english_dictionary (
        id TEXT PRIMARY KEY NOT NULL,
        base_word TEXT NOT NULL,
        translation TEXT NOT NULL,
        word_type TEXT NOT NULL,
        v2 TEXT,
        v3 TEXT,
        v_ing TEXT,
        example_sentence TEXT,
        is_favorite INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        last_read_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }
  
  // Seed data only on fresh install (version 0 = new device / first install)
  if (currentDbVersion === 0) {
    await seedInitialData(db);
  }

  // Always bump the version after all migrations complete
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

