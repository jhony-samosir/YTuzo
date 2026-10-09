import { useCallback, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

  const syncData = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      console.log('🔄 Memulai proses Sinkronisasi...');

      // 1. PULL (Ambil data) dari lokal yang BELUM TERSINKRONISASI (sync_status = 0)
      const unsyncedFinanceLogs = await db.getAllAsync(
        'SELECT * FROM finance_logs WHERE sync_status = 0'
      );
      
      const unsyncedDictionaryLogs = await db.getAllAsync(
        'SELECT * FROM master_dictionary WHERE sync_status = 0'
      );
      
      const unsyncedVocabProgressLogs = await db.getAllAsync(
        'SELECT * FROM user_vocab_progress WHERE sync_status = 0'
      );

      if (unsyncedFinanceLogs.length === 0 && unsyncedDictionaryLogs.length === 0 && unsyncedVocabProgressLogs.length === 0) {
        console.log('✅ Semua data sudah tersinkronisasi.');
        setIsSyncing(false);
        return;
      }

      console.log(`📤 Ditemukan ${unsyncedFinanceLogs.length} pengeluaran, ${unsyncedDictionaryLogs.length} kamus, dan ${unsyncedVocabProgressLogs.length} progres belajar yang belum tersinkron. Mendorong ke server...`);

      // 2. PUSH (Kirim) ke API PostgreSQL Backend kita
      const response = await fetch(`${getApiBaseUrl()}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finance_logs: unsyncedFinanceLogs,
          dictionary_logs: unsyncedDictionaryLogs,
          vocab_progress_logs: unsyncedVocabProgressLogs,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Push sukses! Mengupdate status di SQLite lokal...');
        // 3. UPDATE status lokal menjadi TERSINKRON (sync_status = 1)
        
        // Update Finance
        for (const log of unsyncedFinanceLogs) {
          await db.runAsync('UPDATE finance_logs SET sync_status = 1 WHERE id = ?', [(log as any).id]);
        }
        
        // Update Dictionary
        for (const log of unsyncedDictionaryLogs) {
          await db.runAsync('UPDATE master_dictionary SET sync_status = 1 WHERE id = ?', [(log as any).id]);
        }
        
        // Update Vocab Progress
        for (const log of unsyncedVocabProgressLogs) {
          await db.runAsync('UPDATE user_vocab_progress SET sync_status = 1 WHERE id = ?', [(log as any).id]);
        }
        
        console.log('🎉 Sinkronisasi selesai!');
      } else {
        console.error('❌ Server merespons dengan error:', result.error);
      }
    } catch (error) {
      console.error('❌ Terjadi kesalahan saat sinkronisasi:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [db, isSyncing]);

  return { syncData, isSyncing };
}
