import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSyncEngine() {
  const db = useSQLiteContext();
  const [isSyncing, setIsSyncing] = useState(false);

  // Fungsi untuk mendapatkan Base URL API
  const getApiBaseUrl = () => {
    // Jika berjalan di Expo Go (HP fisik/simulator), ambil IP bundler secara otomatis
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      // hostUri formatnya: "192.168.1.5:8081"
      return `http://${hostUri}`;
    }
    
    // Fallback jika bukan Expo Go
    if (Platform.OS === 'android') return 'http://10.0.2.2:8081';
    return 'http://localhost:8081';
  };

  const pushToCloud = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      console.log('🔄 Memulai proses Push ke Cloud...');

      // 1. Ambil data lokal yang BELUM TERSINKRONISASI (sync_status = 0) untuk di PUSH
      const unsyncedFinanceLogs = await db.getAllAsync('SELECT * FROM finance_logs WHERE sync_status = 0');
      const unsyncedDictionaryLogs = await db.getAllAsync('SELECT * FROM master_dictionary WHERE sync_status = 0');
      const unsyncedVocabProgressLogs = await db.getAllAsync('SELECT * FROM user_vocab_progress WHERE sync_status = 0');

      if (unsyncedFinanceLogs.length === 0 && unsyncedDictionaryLogs.length === 0 && unsyncedVocabProgressLogs.length === 0) {
        console.log('✅ Semua data lokal sudah tersinkron ke cloud.');
        setIsSyncing(false);
        return;
      }

      console.log(`📤 Push data: ${unsyncedFinanceLogs.length} finance, ${unsyncedDictionaryLogs.length} dict, ${unsyncedVocabProgressLogs.length} progress...`);

      // 2. PUSH ke server
      const response = await fetch(`${getApiBaseUrl()}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PUSH',
          finance_logs: unsyncedFinanceLogs,
          dictionary_logs: unsyncedDictionaryLogs,
          vocab_progress_logs: unsyncedVocabProgressLogs,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Push sukses! Mengupdate status di SQLite lokal...');
        // 3. UPDATE status lokal menjadi TERSINKRON (sync_status = 1) untuk data yang baru saja di-Push
        for (const log of unsyncedFinanceLogs) { await db.runAsync('UPDATE finance_logs SET sync_status = 1 WHERE id = ?', [(log as any).id]); }
        for (const log of unsyncedDictionaryLogs) { await db.runAsync('UPDATE master_dictionary SET sync_status = 1 WHERE id = ?', [(log as any).id]); }
        for (const log of unsyncedVocabProgressLogs) { await db.runAsync('UPDATE user_vocab_progress SET sync_status = 1 WHERE id = ?', [(log as any).id]); }
        
        console.log('🎉 Push ke Cloud selesai!');
      } else {
        console.error('❌ Server merespons dengan error:', result.error);
      }
    } catch (error) {
      console.error('❌ Terjadi kesalahan saat Push:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isSyncing]);

  const pullFromCloud = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      console.log('🔄 Memulai proses Pull dari Cloud...');
      const lastSyncTimestamp = await AsyncStorage.getItem('last_sync_timestamp');

      const response = await fetch(`${getApiBaseUrl()}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PULL',
          last_sync_timestamp: lastSyncTimestamp,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const { data } = result;
        if (data) {
          console.log(`📥 Pull data: ${data.finance_logs?.length || 0} finance, ${data.dictionary_logs?.length || 0} dict, ${data.vocab_progress_logs?.length || 0} progress...`);
          
          if (data.finance_logs && data.finance_logs.length > 0) {
            for (const log of data.finance_logs) {
              await db.runAsync(`
                INSERT INTO finance_logs (id, user_id, title, subtitle, amount, type, icon, color, created_at, updated_at, wallet_id, category_id, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT (id) DO UPDATE SET
                  user_id = excluded.user_id, title = excluded.title, subtitle = excluded.subtitle, amount = excluded.amount, type = excluded.type,
                  icon = excluded.icon, color = excluded.color, updated_at = excluded.updated_at, wallet_id = excluded.wallet_id, category_id = excluded.category_id, sync_status = 1
              `, [log.id, log.user_id, log.title, log.subtitle, log.amount, log.type, log.icon, log.color, log.created_at, log.updated_at, log.wallet_id, log.category_id]);
            }
          }
          
          if (data.dictionary_logs && data.dictionary_logs.length > 0) {
            for (const log of data.dictionary_logs) {
              await db.runAsync(`
                INSERT INTO master_dictionary (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT (id) DO UPDATE SET
                  base_word = excluded.base_word, translation = excluded.translation, word_type = excluded.word_type,
                  v2 = excluded.v2, v3 = excluded.v3, v_ing = excluded.v_ing, example_sentence = excluded.example_sentence,
                  updated_at = excluded.updated_at, sync_status = 1
              `, [log.id, log.base_word, log.translation, log.word_type, log.v2, log.v3, log.v_ing, log.example_sentence, log.created_at, log.updated_at]);
            }
          }
          
          if (data.vocab_progress_logs && data.vocab_progress_logs.length > 0) {
            for (const log of data.vocab_progress_logs) {
              await db.runAsync(`
                INSERT INTO user_vocab_progress (id, user_id, word_id, status, is_favorite, last_read_at, created_at, updated_at, sync_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT (user_id, word_id) DO UPDATE SET
                  status = excluded.status, is_favorite = excluded.is_favorite, last_read_at = excluded.last_read_at,
                  updated_at = excluded.updated_at, sync_status = 1
              `, [log.id, log.user_id, log.word_id, log.status, log.is_favorite || 0, log.last_read_at || null, log.created_at, log.updated_at]);
            }
          }
        }
        
        await AsyncStorage.setItem('last_sync_timestamp', new Date().toISOString());
        console.log('🎉 Pull dari Cloud selesai!');
      } else {
        console.error('❌ Server merespons dengan error:', result.error);
      }
    } catch (error) {
      console.error('❌ Terjadi kesalahan saat Pull:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isSyncing]);

  return { pushToCloud, pullFromCloud, isSyncing };
}
