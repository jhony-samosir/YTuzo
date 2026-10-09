import { db } from '../../server/db';

export async function POST(request: Request) {
  try {
    const { word_id, base_word } = await request.json();

    if (!word_id || !base_word) {
      return Response.json({ success: false, error: 'word_id dan base_word wajib diisi' }, { status: 400 });
    }

    // 1. Panggil AI (Mocking untuk sekarang sampai kamu memasukkan GEMINI_API_KEY)
    // Di dunia nyata, ini akan nge-fetch ke https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
    console.log(`Mengontak AI untuk melengkapi kata: ${base_word}...`);
    
    // Anggap ini adalah response dari AI:
    const aiResponse = {
      word_type: 'VERB',
      v2: `${base_word}ed`, // ini hanya contoh kasar
      v3: `${base_word}ed`,
      v_ing: `${base_word}ing`,
      example_sentence: `He decided to ${base_word} the project because it was too difficult.`
    };

    // 2. Update PostgreSQL Database
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const updateQuery = `
        UPDATE master_dictionary 
        SET word_type = $1, v2 = $2, v3 = $3, v_ing = $4, example_sentence = $5, updated_at = NOW(), sync_status = 1
        WHERE id = $6
        RETURNING *;
      `;
      const values = [
        aiResponse.word_type, 
        aiResponse.v2, 
        aiResponse.v3, 
        aiResponse.v_ing, 
        aiResponse.example_sentence, 
        word_id
      ];
      
      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');
      
      return Response.json({
        success: true,
        message: 'Berhasil melakukan AI Enrichment!',
        data: result.rows[0]
      });
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('AI Enrichment Error:', error);
    return Response.json({ success: false, error: 'Gagal memperkaya kata' }, { status: 500 });
  }
}
