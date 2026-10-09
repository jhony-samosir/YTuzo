import { db } from '../../server/db';

export async function GET(request: Request) {
  try {
    // Test koneksi ke database Postgres
    const result = await db.query('SELECT NOW() as current_time');
    
    return Response.json({ 
      success: true, 
      message: 'Hello dari Backend YTuzo!',
      postgres_time: result.rows[0].current_time
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return Response.json({ 
      success: false, 
      error: 'Gagal terhubung ke database Postgres',
      details: error.message
    }, { status: 500 });
  }
}
