import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as SQLite from 'expo-sqlite';

export interface BackupMetadata {
  appName: string;
  version: number;
  exportedAt: string;
  counts: {
    wallets: number;
    categories: number;
    financeLogs: number;
    budgets: number;
    subscriptions: number;
    sportLogs: number;
    fuelLogs: number;
    vocabProgress: number;
  };
}

export interface BackupPayload {
  appName: 'YTuzo';
  version: number;
  exportedAt: string;
  data: {
    wallets: any[];
    categories: any[];
    finance_logs: any[];
    budgets: any[];
    subscriptions: any[];
    sport_logs: any[];
    fuel_logs: any[];
    user_profile: any[];
    app_preferences: any[];
    quick_actions_config: any[];
    user_vocab_progress: any[];
  };
}

/**
 * Ekspor seluruh data offline pengguna ke file JSON dan buka dialog share/save
 */
export async function exportBackupToFile(db: SQLite.SQLiteDatabase): Promise<{ success: boolean; message: string; metadata?: BackupMetadata }> {
  try {
    // 1. Ambil seluruh data dari tabel lokal
    const wallets = await db.getAllAsync('SELECT * FROM wallets');
    const categories = await db.getAllAsync('SELECT * FROM categories');
    const finance_logs = await db.getAllAsync('SELECT * FROM finance_logs');
    const budgets = await db.getAllAsync('SELECT * FROM budgets');
    const subscriptions = await db.getAllAsync('SELECT * FROM subscriptions');
    const sport_logs = await db.getAllAsync('SELECT * FROM sport_logs');
    const fuel_logs = await db.getAllAsync('SELECT * FROM fuel_logs');
    const user_profile = await db.getAllAsync('SELECT * FROM user_profile');
    const app_preferences = await db.getAllAsync('SELECT * FROM app_preferences');
    const quick_actions_config = await db.getAllAsync('SELECT * FROM quick_actions_config');
    const user_vocab_progress = await db.getAllAsync('SELECT * FROM user_vocab_progress');

    const metadataCounts = {
      wallets: wallets.length,
      categories: categories.length,
      financeLogs: finance_logs.length,
      budgets: budgets.length,
      subscriptions: subscriptions.length,
      sportLogs: sport_logs.length,
      fuelLogs: fuel_logs.length,
      vocabProgress: user_vocab_progress.length,
    };

    const payload: BackupPayload = {
      appName: 'YTuzo',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        wallets,
        categories,
        finance_logs,
        budgets,
        subscriptions,
        sport_logs,
        fuel_logs,
        user_profile,
        app_preferences,
        quick_actions_config,
        user_vocab_progress,
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);

    // 2. Tulis file JSON ke cache lokal
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `YTuzo_Backup_${timestamp}.json`;
    const fileUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 3. Buka Sheet Berbagi Sistem (WhatsApp, Drive, File Explorer)
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Simpan Cadangan Data YTuzo',
        UTI: 'public.json',
      });
    } else {
      return {
        success: false,
        message: 'Fitur berbagi file tidak didukung pada perangkat ini.',
      };
    }

    return {
      success: true,
      message: 'Cadangan berhasil dibuat!',
      metadata: {
        appName: 'YTuzo',
        version: 1,
        exportedAt: payload.exportedAt,
        counts: metadataCounts,
      },
    };
  } catch (error: any) {
    console.error('Export backup error:', error);
    return {
      success: false,
      message: error?.message || 'Gagal mengekspor data cadangan.',
    };
  }
}

/**
 * Pilih file cadangan JSON dan pulihkan ke database lokal SQLite
 */
export async function importBackupFromFile(db: SQLite.SQLiteDatabase): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    // 1. Pilih file menggunakan DocumentPicker
    const pickerResult = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/json', 'text/plain'],
      copyToCacheDirectory: true,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return { success: false, message: 'Pemilihan file dibatalkan.' };
    }

    const selectedFile = pickerResult.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(selectedFile.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // 2. Validasi struktur JSON cadangan
    let parsed: BackupPayload;
    try {
      parsed = JSON.parse(fileContent);
    } catch {
      return { success: false, message: 'Format file tidak valid atau rusak.' };
    }

    if (parsed.appName !== 'YTuzo' || !parsed.data) {
      return {
        success: false,
        message: 'File ini bukan file cadangan resmi YTuzo.',
      };
    }

    const { data } = parsed;
    let totalRestored = 0;

    // 3. Masukkan data ke SQLite dalam satu transaksi aman
    await db.withExclusiveTransactionAsync(async (txn) => {
      // Wallets
      if (Array.isArray(data.wallets)) {
        for (const row of data.wallets) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO wallets (id, user_id, name, type, balance, color_theme)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.user_id, row.name, row.type, row.balance, row.color_theme]
          );
          totalRestored++;
        }
      }

      // Categories
      if (Array.isArray(data.categories)) {
        for (const row of data.categories) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO categories (id, user_id, name, icon, color, parent_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [row.id, row.user_id, row.name, row.icon, row.color, row.parent_id ?? null]
          );
          totalRestored++;
        }
      }

      // Finance Logs
      if (Array.isArray(data.finance_logs)) {
        for (const row of data.finance_logs) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO finance_logs (id, user_id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.title,
              row.subtitle,
              row.amount,
              row.type,
              row.icon,
              row.color,
              row.created_at,
              row.updated_at,
              row.sync_status ?? 0,
              row.wallet_id,
              row.category_id,
            ]
          );
          totalRestored++;
        }
      }

      // Budgets
      if (Array.isArray(data.budgets)) {
        for (const row of data.budgets) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO budgets (id, user_id, category_id, monthly_limit)
             VALUES (?, ?, ?, ?)`,
            [row.id, row.user_id, row.category_id, row.monthly_limit]
          );
          totalRestored++;
        }
      }

      // Subscriptions
      if (Array.isArray(data.subscriptions)) {
        for (const row of data.subscriptions) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO subscriptions (id, user_id, name, amount, billing_cycle, next_billing_date, icon, color, wallet_id, type, is_paused)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.name,
              row.amount,
              row.billing_cycle,
              row.next_billing_date,
              row.icon,
              row.color,
              row.wallet_id ?? null,
              row.type ?? 'EXPENSE',
              row.is_paused ?? 0,
            ]
          );
          totalRestored++;
        }
      }

      // Sport Logs
      if (Array.isArray(data.sport_logs)) {
        for (const row of data.sport_logs) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO sport_logs (id, user_id, sport_type, distance_km, duration_mins, calories, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.sport_type,
              row.distance_km,
              row.duration_mins,
              row.calories,
              row.created_at,
              row.updated_at,
              row.sync_status ?? 0,
            ]
          );
          totalRestored++;
        }
      }

      // Fuel Logs
      if (Array.isArray(data.fuel_logs)) {
        for (const row of data.fuel_logs) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO fuel_logs (id, user_id, odometer, liters, price_per_liter, total_cost, location, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.odometer,
              row.liters,
              row.price_per_liter,
              row.total_cost,
              row.location,
              row.created_at,
              row.updated_at,
              row.sync_status ?? 0,
            ]
          );
          totalRestored++;
        }
      }

      // User Profile
      if (Array.isArray(data.user_profile) && data.user_profile.length > 0) {
        for (const row of data.user_profile) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO user_profile (id, user_id, first_name, last_name, avatar_url, reputation_level, join_date, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.first_name,
              row.last_name,
              row.avatar_url ?? null,
              row.reputation_level,
              row.join_date,
              row.sync_status ?? 0,
            ]
          );
        }
      }

      // User Vocab Progress
      if (Array.isArray(data.user_vocab_progress)) {
        for (const row of data.user_vocab_progress) {
          await txn.runAsync(
            `INSERT OR REPLACE INTO user_vocab_progress (id, user_id, word_id, status, is_favorite, last_read_at, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.user_id,
              row.word_id,
              row.status ?? 'LEARNING',
              row.is_favorite ?? 0,
              row.last_read_at ?? null,
              row.created_at,
              row.updated_at,
              row.sync_status ?? 0,
            ]
          );
          totalRestored++;
        }
      }
    });

    return {
      success: true,
      message: `Berhasil memulihkan ${totalRestored} data ke aplikasi!`,
      count: totalRestored,
    };
  } catch (error: any) {
    console.error('Import backup error:', error);
    return {
      success: false,
      message: error?.message || 'Gagal memulihkan data cadangan.',
    };
  }
}
