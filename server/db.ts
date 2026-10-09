import { Pool } from 'pg';

// Kita menggunakan connection string postgres
// Sesuaikan username, password, port, dan dbname dengan Postgres lokal kamu
const POSTGRES_URL = process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/ytuzo_db';

const pool = new Pool({
  connectionString: POSTGRES_URL,
});

// Menangkap error di background agar server tidak crash
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  getClient: () => pool.connect(),
};
