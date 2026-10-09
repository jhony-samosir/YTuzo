import * as SQLite from 'expo-sqlite';
import { DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID } from '../constants/defaults';

export async function seedInitialData(db: SQLite.SQLiteDatabase) {
  const now = Date.now();
  
  await db.execAsync(`
    INSERT OR IGNORE INTO app_preferences (id, is_biometric_enabled, is_push_notif_enabled, is_dark_theme, language, sync_status) VALUES
    ('pref-1', 1, 1, 1, 'English', 0);

    INSERT OR IGNORE INTO quick_actions_config (id, action_id, slot_index, icon_name, icon_color, icon_bg, label_text) VALUES
    ('qa-1', 'ADD_EXPENSE', 1, 'wallet', '#FACC15', 'rgba(250, 204, 21, 0.1)', 'Finance'),
    ('qa-2', 'LOG_RUN', 2, 'bicycle', '#38BDF8', 'rgba(56, 189, 248, 0.1)', 'Sports'),
    ('qa-3', 'LOG_FUEL', 3, 'car', '#F43F5E', 'rgba(244, 63, 94, 0.1)', 'Vehicle');
    
    INSERT OR IGNORE INTO wallets (id, name, type, balance, color_theme) VALUES
    ('${DEFAULT_WALLET_ID}', 'Cash', 'CASH', 0.00, '#0284C7');

    INSERT OR IGNORE INTO categories (id, name, icon, color) VALUES
    ('${DEFAULT_CATEGORY_ID}', 'Lainnya', 'list', '#8A8A93'),
    ('cat-2', 'Food & Beverage', 'fast-food', '#FACC15'),
    ('cat-3', 'Transport', 'bus', '#38BDF8'),
    ('cat-4', 'Entertainment', 'game-controller', '#F43F5E');

    INSERT OR IGNORE INTO english_dictionary (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, created_at, updated_at) VALUES
    ('vocab-1', 'go', 'pergi', 'VERB', 'went', 'gone', 'going', 'I go to school.', ${now}, ${now}),
    ('vocab-2', 'eat', 'makan', 'VERB', 'ate', 'eaten', 'eating', 'They eat breakfast.', ${now}, ${now}),
    ('vocab-3', 'see', 'melihat', 'VERB', 'saw', 'seen', 'seeing', 'I see a bird.', ${now}, ${now}),
    ('vocab-4', 'take', 'mengambil', 'VERB', 'took', 'taken', 'taking', 'Take your time.', ${now}, ${now}),
    ('vocab-5', 'come', 'datang', 'VERB', 'came', 'come', 'coming', 'Please come here.', ${now}, ${now}),
    ('vocab-6', 'know', 'mengetahui', 'VERB', 'knew', 'known', 'knowing', 'I know the answer.', ${now}, ${now}),
    ('vocab-7', 'get', 'mendapatkan', 'VERB', 'got', 'gotten', 'getting', 'Did you get the email?', ${now}, ${now}),
    ('vocab-8', 'give', 'memberikan', 'VERB', 'gave', 'given', 'giving', 'Give me a break.', ${now}, ${now}),
    ('vocab-9', 'find', 'menemukan', 'VERB', 'found', 'found', 'finding', 'I found my keys.', ${now}, ${now}),
    ('vocab-10', 'think', 'berpikir', 'VERB', 'thought', 'thought', 'thinking', 'I think so.', ${now}, ${now}),
    ('vocab-11', 'book', 'buku', 'NOUN', null, null, null, 'This is a good book.', ${now}, ${now}),
    ('vocab-12', 'water', 'air', 'NOUN', null, null, null, 'I need some water.', ${now}, ${now}),
    ('vocab-13', 'time', 'waktu', 'NOUN', null, null, null, 'What time is it?', ${now}, ${now}),
    ('vocab-14', 'person', 'orang', 'NOUN', null, null, null, 'He is a nice person.', ${now}, ${now}),
    ('vocab-15', 'year', 'tahun', 'NOUN', null, null, null, 'Happy New Year!', ${now}, ${now}),
    ('vocab-16', 'good', 'bagus/baik', 'ADJECTIVE', null, null, null, 'You did a good job.', ${now}, ${now}),
    ('vocab-17', 'new', 'baru', 'ADJECTIVE', null, null, null, 'I have a new phone.', ${now}, ${now}),
    ('vocab-18', 'first', 'pertama', 'ADJECTIVE', null, null, null, 'He is the first to arrive.', ${now}, ${now}),
    ('vocab-19', 'last', 'terakhir', 'ADJECTIVE', null, null, null, 'This is my last chance.', ${now}, ${now}),
    ('vocab-20', 'long', 'panjang', 'ADJECTIVE', null, null, null, 'It is a long journey.', ${now}, ${now});
  `);
  
  console.log('Master data default (Kategori, Preferensi, Kamus) berhasil di-seed!');
}
