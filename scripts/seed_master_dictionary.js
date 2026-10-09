const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../assets/dictionary.db');
const POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/ytuzo_db';

async function run() {
    console.log('Menghubungkan ke PostgreSQL...');
    const pool = new Pool({ connectionString: POSTGRES_URL });
    const client = await pool.connect();

    console.log('Membaca file dict.json (310 kata)...');
    const dict = require('./dict.json');

    console.log(`Ditemukan ${dict.length} kata! Memulai migrasi ke PostgreSQL...`);
    const now = new Date().toISOString();

    try {
        await client.query('BEGIN');
        
        // Kosongkan tabel jika sudah ada isinya
        await client.query('TRUNCATE TABLE master_dictionary CASCADE');

        let count = 0;
        for (let i = 0; i < dict.length; i++) {
            const item = dict[i];
            const id = `dict-seed-${String(i + 1).padStart(4, '0')}`;

            await client.query(
                `INSERT INTO master_dictionary (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, created_at, updated_at, sync_status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)`,
                [
                    id, 
                    item.word, 
                    item.translation, 
                    item.type, 
                    item.v2 || null, 
                    item.v3 || null, 
                    item.v_ing || null, 
                    item.example || null, 
                    now, 
                    now
                ]
            );
            count++;

            if (count % 50 === 0) {
                console.log(`Berhasil insert ${count} kata ke PostgreSQL...`);
            }
        }

        await client.query('COMMIT');
        console.log(`=================================`);
        console.log(`✅ BERHASIL! ${count} kata dimasukkan ke PostgreSQL 'master_dictionary'.`);
        console.log(`=================================`);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error migrating to Postgres:', e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
