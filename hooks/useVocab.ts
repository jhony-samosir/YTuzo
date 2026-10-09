import { useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';

export type WordType = 'VERB' | 'NOUN' | 'ADJECTIVE' | 'ADVERB' | 'PHRASE';

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
    let sql = `SELECT * FROM english_dictionary WHERE base_word LIKE ? OR translation LIKE ? ORDER BY base_word ASC`;
    let params: any[] = [`%${query}%`, `%${query}%`];

    if (typeFilter !== 'ALL') {
      sql = `SELECT * FROM english_dictionary WHERE (base_word LIKE ? OR translation LIKE ?) AND word_type = ? ORDER BY base_word ASC`;
      params.push(typeFilter);
    }

    try {
      const result = await db.getAllAsync<VocabItem>(sql, params);
      setVocabs(result);
    } catch (error) {
      console.error('Error fetching vocabs:', error);
      setError('Gagal memuat kamus.');
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  const markAsRead = async (id: string) => {
    setVocabs(prev => prev.map(vocab => vocab.id === id ? { ...vocab, is_read: 1 } : vocab));
    try {
      await db.runAsync('UPDATE english_dictionary SET is_read = 1, last_read_at = ? WHERE id = ?', [Date.now(), id]);
    } catch (error) {
      console.error('Failed to update read status', error);
      setError('Gagal menandai telah dibaca.');
    }
  };

  const addVocab = async (vocab: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => {
    try {
      const id = Date.now().toString();
      await db.runAsync(
        `INSERT INTO english_dictionary (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, is_favorite, is_read) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [id, vocab.base_word, vocab.translation, vocab.word_type, vocab.v2 || null, vocab.v3 || null, vocab.v_ing || null, vocab.example_sentence || null]
      );
      // Optimistic update
      setVocabs(prev => [{ id, is_favorite: 0, is_read: 0, ...vocab } as VocabItem, ...prev].sort((a, b) => a.base_word.localeCompare(b.base_word)));
      return true;
    } catch (error) {
      console.error('Failed to add vocab', error);
      setError('Gagal menambahkan kosakata.');
      return false;
    }
  };

  const updateVocab = async (id: string, vocab: Omit<VocabItem, 'id' | 'is_favorite' | 'is_read' | 'last_read_at'>) => {
    try {
      await db.runAsync(
        `UPDATE english_dictionary SET base_word = ?, translation = ?, word_type = ?, v2 = ?, v3 = ?, v_ing = ?, example_sentence = ? WHERE id = ?`,
        [vocab.base_word, vocab.translation, vocab.word_type, vocab.v2 || null, vocab.v3 || null, vocab.v_ing || null, vocab.example_sentence || null, id]
      );
      // Optimistic update
      setVocabs(prev => prev.map(item => item.id === id ? { ...item, ...vocab } : item).sort((a, b) => a.base_word.localeCompare(b.base_word)));
      return true;
    } catch (error) {
      console.error('Failed to update vocab', error);
      setError('Gagal memperbarui kosakata.');
      return false;
    }
  };

  const deleteVocab = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM english_dictionary WHERE id = ?', [id]);
      setVocabs(prev => prev.filter(item => item.id !== id));
      return true;
    } catch (error) {
      console.error('Failed to delete vocab', error);
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
    addVocab,
    updateVocab,
    deleteVocab
  };
}
