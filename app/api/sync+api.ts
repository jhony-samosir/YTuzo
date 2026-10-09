import { db } from '../../server/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { finance_logs, dictionary_logs, vocab_progress_logs } = body;

    const hasFinance = finance_logs && finance_logs.length > 0;
    const hasDict = dictionary_logs && dictionary_logs.length > 0;
    const hasProgress = vocab_progress_logs && vocab_progress_logs.length > 0;

    if (hasFinance || hasDict || hasProgress) {
      const client = await db.getClient();
      try {
        await client.query('BEGIN');
        
        if (hasFinance) {
          for (const log of finance_logs) {
            await client.query(`
              INSERT INTO finance_logs (id, user_id, title, subtitle, amount, type, icon, color, created_at, updated_at, wallet_id, category_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              ON CONFLICT (id) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                title = EXCLUDED.title,
                subtitle = EXCLUDED.subtitle,
                amount = EXCLUDED.amount,
                type = EXCLUDED.type,
                icon = EXCLUDED.icon,
                color = EXCLUDED.color,
                updated_at = EXCLUDED.updated_at,
                wallet_id = EXCLUDED.wallet_id,
                category_id = EXCLUDED.category_id;
            `, [
              log.id, log.user_id, log.title, log.subtitle, log.amount, log.type, 
              log.icon, log.color, log.created_at, log.updated_at, 
              log.wallet_id, log.category_id
            ]);
          }
        }

        if (hasDict) {
          for (const log of dictionary_logs) {
            await client.query(`
              INSERT INTO master_dictionary (id, base_word, translation, word_type, v2, v3, v_ing, example_sentence, created_at, updated_at, sync_status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 1)
              ON CONFLICT (id) DO UPDATE SET
                base_word = EXCLUDED.base_word,
                translation = EXCLUDED.translation,
                word_type = EXCLUDED.word_type,
                v2 = EXCLUDED.v2,
                v3 = EXCLUDED.v3,
                v_ing = EXCLUDED.v_ing,
                example_sentence = EXCLUDED.example_sentence,
                updated_at = EXCLUDED.updated_at,
                sync_status = 1;
            `, [
              log.id, log.base_word, log.translation, log.word_type, log.v2, log.v3, log.v_ing, log.example_sentence, log.created_at, log.updated_at
            ]);
          }
        }

        if (hasProgress) {
          for (const log of vocab_progress_logs) {
            await client.query(`
              INSERT INTO user_vocab_progress (id, user_id, word_id, status, last_read_at, created_at, updated_at, sync_status)
              VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
              ON CONFLICT (id) DO UPDATE SET
                status = EXCLUDED.status,
                last_read_at = EXCLUDED.last_read_at,
                updated_at = EXCLUDED.updated_at,
                sync_status = 1;
            `, [
              log.id, log.user_id, log.word_id, log.status, log.last_read_at, log.created_at, log.updated_at
            ]);
          }
        }
        
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    return Response.json({ success: true, message: 'Sync berhasil!' });
  } catch (error: any) {
    console.error('Sync API error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
