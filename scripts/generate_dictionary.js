const fs = require('fs');
const https = require('https');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../assets/dictionary.db');
// Menggunakan kamus English murni dari adambom (berisi 100k+ kata)
const JSON_URL = 'https://raw.githubusercontent.com/adambom/dictionary/master/dictionary.json';

const assetsDir = path.dirname(DB_PATH);
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
}

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS words (id INTEGER PRIMARY KEY AUTOINCREMENT, word TEXT, definition TEXT)");
    
    console.log('Downloading dictionary data (this might take a few seconds)...');
    
    https.get(JSON_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Download complete. Parsing JSON...');
            try {
                const dictionary = JSON.parse(data);
                const entries = Object.entries(dictionary);
                
                console.log(`Inserting ${entries.length} words into SQLite...`);
                
                db.run("BEGIN TRANSACTION");
                const stmt = db.prepare("INSERT INTO words (word, definition) VALUES (?, ?)");
                
                let count = 0;
                for (const [word, definition] of entries) {
                    stmt.run(word, definition);
                    count++;
                    
                    if (count % 20000 === 0) {
                        console.log(`Inserted ${count} words...`);
                    }
                }
                
                stmt.finalize();
                db.run("COMMIT", () => {
                    console.log(`=================================`);
                    console.log(`✅ Successfully seeded ${count} words!`);
                    console.log(`📁 Database saved to: ${DB_PATH}`);
                    console.log(`=================================`);
                    db.close();
                });
            } catch (err) {
                console.error("Error parsing JSON:", err);
            }
        });
    }).on('error', (err) => {
        console.error('Error downloading dictionary:', err);
    });
});
