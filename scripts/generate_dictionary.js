/**
 * generate_dictionary.js
 * 
 * Script untuk generate assets/dictionary.db dari:
 * 1. Kosakata starter lokal (instant, 250+ kata)
 * 2. Free Dictionary API enrichment (opsional, butuh internet)
 * 
 * Usage:
 *   node scripts/generate_dictionary.js              (mode lokal saja)
 *   node scripts/generate_dictionary.js --enrich     (+ AI enrichment via Free Dictionary API)
 *   node scripts/generate_dictionary.js --enrich --limit=100 (enrich max 100 kata)
 * 
 * Output: assets/dictionary.db
 */

const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const DB_PATH = path.join(__dirname, '../assets/dictionary.db');
const SHOULD_ENRICH = process.argv.includes('--enrich');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const ENRICH_LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : Infinity;
const DELAY_MS = 300; // delay antar API call agar tidak rate-limited

// ── Kosakata Starter (sama persis dengan database/seed.ts) ───────────────────
const STARTER_WORDS = [
  // VERBS
  { word: 'abandon',   translation: 'meninggalkan / mengabaikan', type: 'VERB', v2: 'abandoned',   v3: 'abandoned',   v_ing: 'abandoning',   example: 'He decided to abandon the project.' },
  { word: 'accept',    translation: 'menerima / menyetujui',      type: 'VERB', v2: 'accepted',    v3: 'accepted',    v_ing: 'accepting',    example: 'She accepted the job offer.' },
  { word: 'achieve',   translation: 'mencapai / meraih',          type: 'VERB', v2: 'achieved',    v3: 'achieved',    v_ing: 'achieving',    example: 'He achieved his goal last year.' },
  { word: 'adapt',     translation: 'beradaptasi / menyesuaikan', type: 'VERB', v2: 'adapted',     v3: 'adapted',     v_ing: 'adapting',     example: 'Animals adapt to their environment.' },
  { word: 'add',       translation: 'menambahkan',                type: 'VERB', v2: 'added',       v3: 'added',       v_ing: 'adding',       example: 'Add some salt to the soup.' },
  { word: 'agree',     translation: 'setuju / menyetujui',        type: 'VERB', v2: 'agreed',      v3: 'agreed',      v_ing: 'agreeing',     example: 'I agree with your point of view.' },
  { word: 'allow',     translation: 'mengizinkan / membolehkan',  type: 'VERB', v2: 'allowed',     v3: 'allowed',     v_ing: 'allowing',     example: 'The teacher allowed us to leave early.' },
  { word: 'analyze',   translation: 'menganalisis',               type: 'VERB', v2: 'analyzed',    v3: 'analyzed',    v_ing: 'analyzing',    example: 'We need to analyze the data carefully.' },
  { word: 'apply',     translation: 'melamar / menerapkan',       type: 'VERB', v2: 'applied',     v3: 'applied',     v_ing: 'applying',     example: 'She applied for the job.' },
  { word: 'begin',     translation: 'memulai / mulai',            type: 'VERB', v2: 'began',       v3: 'begun',       v_ing: 'beginning',    example: 'The meeting will begin at 9 AM.' },
  { word: 'believe',   translation: 'percaya / meyakini',         type: 'VERB', v2: 'believed',    v3: 'believed',    v_ing: 'believing',    example: 'I believe in hard work.' },
  { word: 'break',     translation: 'memecahkan / istirahat',     type: 'VERB', v2: 'broke',       v3: 'broken',      v_ing: 'breaking',     example: 'She broke the glass by accident.' },
  { word: 'bring',     translation: 'membawa',                    type: 'VERB', v2: 'brought',     v3: 'brought',     v_ing: 'bringing',     example: 'Please bring your ID card.' },
  { word: 'build',     translation: 'membangun / membuat',        type: 'VERB', v2: 'built',       v3: 'built',       v_ing: 'building',     example: 'They are building a new school.' },
  { word: 'buy',       translation: 'membeli',                    type: 'VERB', v2: 'bought',      v3: 'bought',      v_ing: 'buying',       example: 'I want to buy a new phone.' },
  { word: 'change',    translation: 'mengubah / berubah',         type: 'VERB', v2: 'changed',     v3: 'changed',     v_ing: 'changing',     example: 'People change over time.' },
  { word: 'choose',    translation: 'memilih',                    type: 'VERB', v2: 'chose',       v3: 'chosen',      v_ing: 'choosing',     example: 'Choose the best option available.' },
  { word: 'create',    translation: 'menciptakan / membuat',      type: 'VERB', v2: 'created',     v3: 'created',     v_ing: 'creating',     example: 'She created a beautiful painting.' },
  { word: 'decide',    translation: 'memutuskan',                 type: 'VERB', v2: 'decided',     v3: 'decided',     v_ing: 'deciding',     example: 'I decided to go on a trip.' },
  { word: 'develop',   translation: 'mengembangkan',              type: 'VERB', v2: 'developed',   v3: 'developed',   v_ing: 'developing',   example: 'The team is developing a new app.' },
  { word: 'discuss',   translation: 'mendiskusikan / membahas',   type: 'VERB', v2: 'discussed',   v3: 'discussed',   v_ing: 'discussing',   example: 'We discussed the plan for tomorrow.' },
  { word: 'do',        translation: 'melakukan / mengerjakan',    type: 'VERB', v2: 'did',         v3: 'done',        v_ing: 'doing',        example: 'What are you doing?' },
  { word: 'drive',     translation: 'mengemudi / mendorong',      type: 'VERB', v2: 'drove',       v3: 'driven',      v_ing: 'driving',      example: 'He drives to work every day.' },
  { word: 'earn',      translation: 'menghasilkan / mendapatkan', type: 'VERB', v2: 'earned',      v3: 'earned',      v_ing: 'earning',      example: 'She earns a good salary.' },
  { word: 'eat',       translation: 'makan',                      type: 'VERB', v2: 'ate',         v3: 'eaten',       v_ing: 'eating',       example: 'We eat dinner at 7 PM.' },
  { word: 'explain',   translation: 'menjelaskan',                type: 'VERB', v2: 'explained',   v3: 'explained',   v_ing: 'explaining',   example: 'Can you explain this concept?' },
  { word: 'find',      translation: 'menemukan / mencari',        type: 'VERB', v2: 'found',       v3: 'found',       v_ing: 'finding',      example: 'I cannot find my keys.' },
  { word: 'give',      translation: 'memberi / memberikan',       type: 'VERB', v2: 'gave',        v3: 'given',       v_ing: 'giving',       example: 'She gave me a gift.' },
  { word: 'go',        translation: 'pergi / berangkat',          type: 'VERB', v2: 'went',        v3: 'gone',        v_ing: 'going',        example: 'Let\'s go to the market.' },
  { word: 'grow',      translation: 'tumbuh / berkembang',        type: 'VERB', v2: 'grew',        v3: 'grown',       v_ing: 'growing',      example: 'The company grew 20% this year.' },
  { word: 'have',      translation: 'memiliki / mempunyai',       type: 'VERB', v2: 'had',         v3: 'had',         v_ing: 'having',       example: 'I have two brothers.' },
  { word: 'help',      translation: 'membantu / menolong',        type: 'VERB', v2: 'helped',      v3: 'helped',      v_ing: 'helping',      example: 'Can you help me with this?' },
  { word: 'improve',   translation: 'meningkatkan / memperbaiki', type: 'VERB', v2: 'improved',    v3: 'improved',    v_ing: 'improving',    example: 'You must improve your English skills.' },
  { word: 'join',      translation: 'bergabung / ikut',           type: 'VERB', v2: 'joined',      v3: 'joined',      v_ing: 'joining',      example: 'She joined the team last month.' },
  { word: 'know',      translation: 'tahu / mengetahui',          type: 'VERB', v2: 'knew',        v3: 'known',       v_ing: 'knowing',      example: 'Do you know the answer?' },
  { word: 'lead',      translation: 'memimpin / mengarahkan',     type: 'VERB', v2: 'led',         v3: 'led',         v_ing: 'leading',      example: 'She leads the marketing team.' },
  { word: 'learn',     translation: 'belajar / mempelajari',      type: 'VERB', v2: 'learned',     v3: 'learned',     v_ing: 'learning',     example: 'I am learning to speak Japanese.' },
  { word: 'make',      translation: 'membuat / menjadikan',       type: 'VERB', v2: 'made',        v3: 'made',        v_ing: 'making',       example: 'He makes good coffee.' },
  { word: 'manage',    translation: 'mengelola / mengatur',       type: 'VERB', v2: 'managed',     v3: 'managed',     v_ing: 'managing',     example: 'She manages a team of 10 people.' },
  { word: 'meet',      translation: 'bertemu / memenuhi',         type: 'VERB', v2: 'met',         v3: 'met',         v_ing: 'meeting',      example: 'Nice to meet you.' },
  { word: 'plan',      translation: 'merencanakan / rencana',     type: 'VERB', v2: 'planned',     v3: 'planned',     v_ing: 'planning',     example: 'We are planning a trip.' },
  { word: 'read',      translation: 'membaca',                    type: 'VERB', v2: 'read',        v3: 'read',        v_ing: 'reading',      example: 'I read a book every week.' },
  { word: 'run',       translation: 'berlari / menjalankan',      type: 'VERB', v2: 'ran',         v3: 'run',         v_ing: 'running',      example: 'She runs 5 km every morning.' },
  { word: 'save',      translation: 'menabung / menyimpan',       type: 'VERB', v2: 'saved',       v3: 'saved',       v_ing: 'saving',       example: 'Save your work regularly.' },
  { word: 'see',       translation: 'melihat / memahami',         type: 'VERB', v2: 'saw',         v3: 'seen',        v_ing: 'seeing',       example: 'I can see the mountain from here.' },
  { word: 'speak',     translation: 'berbicara / berkata',        type: 'VERB', v2: 'spoke',       v3: 'spoken',      v_ing: 'speaking',     example: 'She speaks three languages.' },
  { word: 'start',     translation: 'memulai / mulai',            type: 'VERB', v2: 'started',     v3: 'started',     v_ing: 'starting',     example: 'Let\'s start the meeting.' },
  { word: 'think',     translation: 'berpikir / menganggap',      type: 'VERB', v2: 'thought',     v3: 'thought',     v_ing: 'thinking',     example: 'Think before you speak.' },
  { word: 'try',       translation: 'mencoba / berusaha',         type: 'VERB', v2: 'tried',       v3: 'tried',       v_ing: 'trying',       example: 'Try your best in everything.' },
  { word: 'understand',translation: 'memahami / mengerti',        type: 'VERB', v2: 'understood',  v3: 'understood',  v_ing: 'understanding',example: 'Do you understand the instructions?' },
  { word: 'work',      translation: 'bekerja / berfungsi',        type: 'VERB', v2: 'worked',      v3: 'worked',      v_ing: 'working',      example: 'She works hard every day.' },
  { word: 'write',     translation: 'menulis',                    type: 'VERB', v2: 'wrote',       v3: 'written',     v_ing: 'writing',      example: 'Write a summary of the article.' },

  // NOUNS
  { word: 'ability',     translation: 'kemampuan / kecakapan',    type: 'NOUN', example: 'She has the ability to solve complex problems.' },
  { word: 'achievement', translation: 'pencapaian / prestasi',    type: 'NOUN', example: 'Winning the championship is a great achievement.' },
  { word: 'advantage',   translation: 'keuntungan / kelebihan',   type: 'NOUN', example: 'The advantage of living here is the fresh air.' },
  { word: 'ambition',    translation: 'ambisi / cita-cita',       type: 'NOUN', example: 'His ambition is to become a doctor.' },
  { word: 'career',      translation: 'karier / pekerjaan',       type: 'NOUN', example: 'She has a successful career in medicine.' },
  { word: 'challenge',   translation: 'tantangan / rintangan',    type: 'NOUN', example: 'Learning a new language is a great challenge.' },
  { word: 'confidence',  translation: 'kepercayaan diri',         type: 'NOUN', example: 'She spoke with great confidence.' },
  { word: 'culture',     translation: 'budaya / kultur',          type: 'NOUN', example: 'Indonesia has a rich and diverse culture.' },
  { word: 'deadline',    translation: 'batas waktu / tenggat',    type: 'NOUN', example: 'The deadline for the project is Friday.' },
  { word: 'decision',    translation: 'keputusan',                type: 'NOUN', example: 'Making the right decision is important.' },
  { word: 'economy',     translation: 'ekonomi / perekonomian',   type: 'NOUN', example: 'The global economy is slowly recovering.' },
  { word: 'education',   translation: 'pendidikan',               type: 'NOUN', example: 'Education is the key to a better future.' },
  { word: 'effort',      translation: 'usaha / upaya',            type: 'NOUN', example: 'Success requires a lot of effort.' },
  { word: 'environment', translation: 'lingkungan / alam',        type: 'NOUN', example: 'We must protect our environment.' },
  { word: 'experience',  translation: 'pengalaman',               type: 'NOUN', example: 'I have five years of experience in marketing.' },
  { word: 'failure',     translation: 'kegagalan',                type: 'NOUN', example: 'Failure is the best teacher.' },
  { word: 'goal',        translation: 'tujuan / sasaran',         type: 'NOUN', example: 'Set a clear goal and work towards it.' },
  { word: 'growth',      translation: 'pertumbuhan / perkembangan',type: 'NOUN', example: 'Personal growth takes time.' },
  { word: 'health',      translation: 'kesehatan',                type: 'NOUN', example: 'Health is more important than wealth.' },
  { word: 'innovation',  translation: 'inovasi / pembaruan',      type: 'NOUN', example: 'Innovation drives economic growth.' },
  { word: 'knowledge',   translation: 'pengetahuan / ilmu',       type: 'NOUN', example: 'Knowledge is power.' },
  { word: 'language',    translation: 'bahasa',                   type: 'NOUN', example: 'She speaks four languages fluently.' },
  { word: 'leadership',  translation: 'kepemimpinan',             type: 'NOUN', example: 'Strong leadership is crucial for a team.' },
  { word: 'opportunity', translation: 'kesempatan / peluang',     type: 'NOUN', example: 'Don\'t miss this great opportunity.' },
  { word: 'priority',    translation: 'prioritas / hal utama',    type: 'NOUN', example: 'Family is my first priority.' },
  { word: 'problem',     translation: 'masalah / persoalan',      type: 'NOUN', example: 'We found a solution to the problem.' },
  { word: 'progress',    translation: 'kemajuan / perkembangan',  type: 'NOUN', example: 'We are making good progress.' },
  { word: 'relationship',translation: 'hubungan / relasi',        type: 'NOUN', example: 'A healthy relationship requires trust.' },
  { word: 'skill',       translation: 'keterampilan / keahlian',  type: 'NOUN', example: 'Communication is a key skill.' },
  { word: 'strategy',    translation: 'strategi / rencana',       type: 'NOUN', example: 'We need a new marketing strategy.' },
  { word: 'success',     translation: 'kesuksesan / keberhasilan',type: 'NOUN', example: 'Success is the result of hard work.' },
  { word: 'technology',  translation: 'teknologi',                type: 'NOUN', example: 'Technology changes our way of life.' },
  { word: 'trust',       translation: 'kepercayaan / keyakinan',  type: 'NOUN', example: 'Trust is the foundation of any relationship.' },
  { word: 'vision',      translation: 'visi / pandangan',         type: 'NOUN', example: 'A leader must have a clear vision.' },

  // ADJECTIVES
  { word: 'accurate',    translation: 'akurat / tepat',           type: 'ADJECTIVE', example: 'The weather forecast was accurate.' },
  { word: 'active',      translation: 'aktif / giat',             type: 'ADJECTIVE', example: 'She lives an active lifestyle.' },
  { word: 'amazing',     translation: 'luar biasa / menakjubkan', type: 'ADJECTIVE', example: 'The view from the top is amazing.' },
  { word: 'brave',       translation: 'berani / pemberani',       type: 'ADJECTIVE', example: 'You need to be brave to face your fears.' },
  { word: 'clear',       translation: 'jelas / bersih / cerah',   type: 'ADJECTIVE', example: 'The instructions were very clear.' },
  { word: 'confident',   translation: 'percaya diri / yakin',     type: 'ADJECTIVE', example: 'She felt confident during the interview.' },
  { word: 'creative',    translation: 'kreatif / inovatif',       type: 'ADJECTIVE', example: 'She is a very creative person.' },
  { word: 'effective',   translation: 'efektif / berhasil',       type: 'ADJECTIVE', example: 'This is a very effective method.' },
  { word: 'excellent',   translation: 'sangat baik / luar biasa', type: 'ADJECTIVE', example: 'She did an excellent job.' },
  { word: 'honest',      translation: 'jujur / terus terang',     type: 'ADJECTIVE', example: 'Always be honest with your team.' },
  { word: 'innovative',  translation: 'inovatif / kreatif',       type: 'ADJECTIVE', example: 'We need an innovative approach.' },
  { word: 'positive',    translation: 'positif / optimis',        type: 'ADJECTIVE', example: 'Keep a positive attitude.' },
  { word: 'reliable',    translation: 'andal / dapat diandalkan', type: 'ADJECTIVE', example: 'She is a reliable friend.' },
  { word: 'strong',      translation: 'kuat / kencang',           type: 'ADJECTIVE', example: 'She has a strong work ethic.' },
  { word: 'successful',  translation: 'sukses / berhasil',        type: 'ADJECTIVE', example: 'She is a successful entrepreneur.' },
  { word: 'unique',      translation: 'unik / khas',              type: 'ADJECTIVE', example: 'Everyone has a unique story.' },

  // ADVERBS
  { word: 'always',      translation: 'selalu / senantiasa',      type: 'ADVERB', example: 'She always arrives on time.' },
  { word: 'currently',   translation: 'saat ini / sekarang',      type: 'ADVERB', example: 'She is currently studying in London.' },
  { word: 'definitely',  translation: 'pasti / tentu saja',       type: 'ADVERB', example: 'I will definitely attend the event.' },
  { word: 'especially',  translation: 'terutama / khususnya',     type: 'ADVERB', example: 'I love nature, especially forests.' },
  { word: 'finally',     translation: 'akhirnya / pada akhirnya', type: 'ADVERB', example: 'He finally understood.' },
  { word: 'frequently',  translation: 'sering / kerap kali',      type: 'ADVERB', example: 'She frequently visits her parents.' },
  { word: 'immediately', translation: 'segera / langsung',        type: 'ADVERB', example: 'Please call me immediately.' },
  { word: 'often',       translation: 'sering / kerap',           type: 'ADVERB', example: 'He often works late.' },
  { word: 'quickly',     translation: 'dengan cepat / segera',    type: 'ADVERB', example: 'She quickly solved the problem.' },
  { word: 'recently',    translation: 'baru-baru ini / belakangan',type: 'ADVERB', example: 'I recently started a new job.' },
  { word: 'usually',     translation: 'biasanya / umumnya',       type: 'ADVERB', example: 'I usually wake up at 6 AM.' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchDefinition(word) {
  return new Promise((resolve) => {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            resolve(parsed[0]);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function getExampleFromDefinition(entry) {
  if (!entry || !entry.meanings) return null;
  for (const meaning of entry.meanings) {
    for (const def of meaning.definitions) {
      if (def.example) return def.example;
    }
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const assetsDir = path.dirname(DB_PATH);
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('🗑️  Menghapus dictionary.db lama...');
  }

  const db = new sqlite3.Database(DB_PATH);

  // Create schema
  await new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS master_dictionary (
        id TEXT PRIMARY KEY NOT NULL,
        base_word TEXT NOT NULL,
        translation TEXT NOT NULL,
        word_type TEXT NOT NULL,
        v2 TEXT,
        v3 TEXT,
        v_ing TEXT,
        example_sentence TEXT,
        is_read INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        last_read_at INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        sync_status INTEGER DEFAULT 0
      )
    `, (err) => err ? reject(err) : resolve());
  });

  console.log(`\n📚 Mode: ${SHOULD_ENRICH ? 'Lokal + Free Dictionary API Enrichment' : 'Lokal saja'}`);
  console.log(`📝 Total kata: ${STARTER_WORDS.length}`);
  if (SHOULD_ENRICH) {
    console.log(`🌐 Enrich limit: ${ENRICH_LIMIT === Infinity ? 'semua' : ENRICH_LIMIT} kata`);
  }
  console.log('');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO master_dictionary 
      (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence,
       is_read, is_favorite, last_read_at, created_at, updated_at, sync_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, ?, ?, 1)
  `);

  await new Promise((resolve) => db.run('BEGIN TRANSACTION', resolve));

  let enriched = 0;
  let count = 0;

  for (const item of STARTER_WORDS) {
    const id = 'dict-' + crypto.randomUUID();
    let example = item.example || null;
    let v2 = item.v2 || null;
    let v3 = item.v3 || null;
    let v_ing = item.v_ing || null;

    if (SHOULD_ENRICH && enriched < ENRICH_LIMIT) {
      try {
        const entry = await fetchDefinition(item.word);
        if (entry) {
          const apiExample = getExampleFromDefinition(entry);
          if (apiExample) example = apiExample;

          // Try to get phonetics / additional forms if available
          if (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) {
            // Could add phonetic field in future
          }
        }
        enriched++;
        process.stdout.write(`\r🌐 Enriched ${enriched} kata dari API...`);
        await sleep(DELAY_MS);
      } catch (e) {
        // API error, skip enrichment for this word
      }
    } else if (!SHOULD_ENRICH) {
      // Offline mode — show progress
      if (count % 10 === 0) {
        process.stdout.write(`\r📝 Inserting... ${count}/${STARTER_WORDS.length}`);
      }
    }

    await new Promise((resolve, reject) => {
      stmt.run(id, item.word, item.translation, item.type, v2, v3, v_ing, example, now, now,
        (err) => err ? reject(err) : resolve());
    });
    count++;
  }

  if (SHOULD_ENRICH) console.log(''); // newline after \r

  stmt.finalize();
  await new Promise((resolve) => db.run('COMMIT', resolve));
  db.close();

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ BERHASIL! ${count} kata di-seed ke dictionary.db`);
  if (SHOULD_ENRICH) {
    console.log(`🌐 ${enriched} kata di-enrich via Free Dictionary API`);
  }
  console.log(`📁 Tersimpan di: ${DB_PATH}`);
  console.log(`\n💡 Langkah selanjutnya:`);
  console.log(`   1. Pastikan file ini terdaftar di metro.config.js atau app.json (assetBundlePatterns)`);
  console.log(`   2. Rebuild app agar dictionary.db ikut ter-bundle`);
  console.log(`   3. Untuk update kamus PostgreSQL: node scripts/seed_master_dictionary.js`);
  console.log(`${'='.repeat(50)}\n`);
}

run().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
