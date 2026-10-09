import { useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';

export type WordType = 'VERB' | 'NOUN' | 'ADJECTIVE' | 'ADVERB' | 'PHRASE' | 'UNKNOWN';

export interface VocabItem {
  id: string;
  base_word: string;
  translation: string;
  word_type: WordType;
  v2?: string;
  v3?: string;
  v_ing?: string;
  example_sentence?: string;
  is_favorite: number;
  is_read: number;
  last_read_at?: number;
}

export function useVocab() {
  const [vocabs, setVocabs] = useState<VocabItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const db = SQLite.useSQLiteContext();

  const fetchVocabs = useCallback(async (query = '', typeFilter = 'ALL') => {
    setIsLoading(true);
    setError(null);

    let sql: string;
    let params: any[];

    if (typeFilter !== 'ALL') {
      sql = `
        SELECT m.id, m.base_word, m.translation, m.word_type, m.v2, m.v3, m.v_ing, m.example_sentence,
               CASE WHEN p.last_read_at IS NOT NULL THEN 1 ELSE 0 END as is_read,
               COALESCE(p.is_favorite, 0) as is_favorite,
               p.last_read_at
        FROM master_dictionary m
        LEFT JOIN user_vocab_progress p ON m.id = p.word_id AND p.user_id = 'user-1'
        WHERE (m.base_word LIKE ? OR m.translation LIKE ?) AND m.word_type = ?
        ORDER BY m.base_word ASC
      `;
      params = [`%${query}%`, `%${query}%`, typeFilter];
    } else {
      sql = `
        SELECT m.id, m.base_word, m.translation, m.word_type, m.v2, m.v3, m.v_ing, m.example_sentence,
               CASE WHEN p.last_read_at IS NOT NULL THEN 1 ELSE 0 END as is_read,
               COALESCE(p.is_favorite, 0) as is_favorite,
               p.last_read_at
        FROM master_dictionary m
        LEFT JOIN user_vocab_progress p ON m.id = p.word_id AND p.user_id = 'user-1'
        WHERE (m.base_word LIKE ? OR m.translation LIKE ?)
        ORDER BY m.base_word ASC
      `;
      params = [`%${query}%`, `%${query}%`];
    }

    try {
      const result = await db.getAllAsync<VocabItem>(sql, params);
      setVocabs(result);
    } catch (err) {
      console.error('Error fetching vocabs:', err);
      setError('Gagal memuat kamus. Pastikan database sudah terinisialisasi.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const markAsRead = async (id: string) => {
    const now = Date.now();
    const nowIso = new Date().toISOString();
    
    // Optimistic update
    setVocabs(prev =>
      prev.map(vocab => vocab.id === id ? { ...vocab, is_read: 1, last_read_at: now } : vocab)
    );
    try {
      // Insert or update learning progress into user_vocab_progress
      const progId = `prog-${Date.now()}`;
      await db.runAsync(
        `INSERT INTO user_vocab_progress (id, user_id, word_id, status, last_read_at, created_at, updated_at, sync_status)
         VALUES (?, 'user-1', ?, 'LEARNING', ?, ?, ?, 0)
         ON CONFLICT (user_id, word_id) DO UPDATE SET 
            last_read_at = excluded.last_read_at, 
            updated_at = excluded.updated_at, 
            sync_status = 0`,
        [progId, id, nowIso, nowIso, nowIso]
      );
    } catch (err) {
      console.error('Failed to update read status', err);
      setError('Gagal menandai telah dibaca.');
    }
  };

  const toggleFavorite = async (id: string, currentValue: number) => {
    const newValue = currentValue === 1 ? 0 : 1;
    // Optimistic update
    setVocabs(prev =>
      prev.map(vocab => vocab.id === id ? { ...vocab, is_favorite: newValue } : vocab)
    );
    const nowIso = new Date().toISOString();
    try {
      const progId = `prog-${Date.now()}`;
      await db.runAsync(
        `INSERT INTO user_vocab_progress (id, user_id, word_id, is_favorite, created_at, updated_at, sync_status)
         VALUES (?, 'user-1', ?, ?, ?, ?, 0)
         ON CONFLICT (user_id, word_id) DO UPDATE SET 
            is_favorite = excluded.is_favorite, 
            updated_at = excluded.updated_at, 
            sync_status = 0`,
        [progId, id, newValue, nowIso, nowIso]
      );
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      setError('Gagal memperbarui favorit.');
    }
  };

  const addVocab = async (vocab: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => {
    try {
      const id = `dict-${Date.now()}`;
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO master_dictionary 
           (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, created_at, updated_at, sync_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          id,
          vocab.base_word,
          vocab.translation,
          vocab.word_type,
          vocab.v2 ?? null,
          vocab.v3 ?? null,
          vocab.v_ing ?? null,
          vocab.example_sentence ?? null,
          now,
          now,
        ]
      );
      const newItem: VocabItem = { id, is_favorite: 0, is_read: 0, last_read_at: undefined, ...vocab };
      setVocabs(prev =>
        [newItem, ...prev].sort((a, b) => a.base_word.localeCompare(b.base_word))
      );
      return true;
    } catch (err) {
      console.error('Failed to add vocab', err);
      setError('Gagal menambahkan kosakata.');
      return false;
    }
  };

  const updateVocab = async (id: string, vocab: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => {
    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE master_dictionary 
         SET base_word = ?, translation = ?, word_type = ?, v2 = ?, v3 = ?, v_ing = ?, 
             example_sentence = ?, updated_at = ?, sync_status = 0
         WHERE id = ?`,
        [
          vocab.base_word,
          vocab.translation,
          vocab.word_type,
          vocab.v2 ?? null,
          vocab.v3 ?? null,
          vocab.v_ing ?? null,
          vocab.example_sentence ?? null,
          now,
          id,
        ]
      );
      setVocabs(prev =>
        prev
          .map(item => item.id === id ? { ...item, ...vocab } : item)
          .sort((a, b) => a.base_word.localeCompare(b.base_word))
      );
      return true;
    } catch (err) {
      console.error('Failed to update vocab', err);
      setError('Gagal memperbarui kosakata.');
      return false;
    }
  };

  const deleteVocab = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM master_dictionary WHERE id = ?', [id]);
      setVocabs(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (err) {
      console.error('Failed to delete vocab', err);
      setError('Gagal menghapus kosakata.');
      return false;
    }
  };

  return {
    vocabs,
    searchQuery,
    setSearchQuery,
    isLoading,
    error,
    fetchVocabs,
    markAsRead,
    toggleFavorite,
    addVocab,
    updateVocab,
    deleteVocab,
  };
}
