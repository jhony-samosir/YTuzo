import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { Subscription } from '../types/finance';
import { DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID } from '../constants/defaults';

export async function processScheduledTransactions(db: SQLite.SQLiteDatabase) {
  try {
    const lastRun = await AsyncStorage.getItem('scheduler_last_run');
    const today = new Date().toDateString();
    if (lastRun === today) {
      return false; // Already ran today
    }

    const now = Date.now();
    const dueSchedules = await db.getAllAsync<Omit<Subscription, 'is_paused'> & { is_paused: number }>(
      'SELECT * FROM subscriptions WHERE next_billing_date <= ? AND (is_paused IS NULL OR is_paused = 0)',
      [now]
    );

    if (dueSchedules.length > 0) {
      await db.withExclusiveTransactionAsync(async (txn) => {
        for (const schedule of dueSchedules) {
          const id = 'fin-' + Crypto.randomUUID();

          // Log to ledger
          await txn.runAsync(
            'INSERT INTO finance_logs (id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
            [id, schedule.name, 'Scheduled', schedule.amount, schedule.type, schedule.icon, schedule.color, schedule.next_billing_date, now, schedule.wallet_id || DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID]
          );

          // Adjust wallet
          const balanceModifier = schedule.type === 'INCOME' ? schedule.amount : -schedule.amount;
          await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, schedule.wallet_id || DEFAULT_WALLET_ID]);

          // Bump next_billing_date
          const nextDate = new Date(schedule.next_billing_date);
          if (schedule.billing_cycle === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
          else if (schedule.billing_cycle === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
          else if (schedule.billing_cycle === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (schedule.billing_cycle === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);

          await txn.runAsync('UPDATE subscriptions SET next_billing_date = ? WHERE id = ?', [nextDate.getTime(), schedule.id]);
        }
      });
    }
    
    await AsyncStorage.setItem('scheduler_last_run', today);
    return true;
  } catch (e) {
    console.error('Failed to process scheduled transactions', e);
    return false;
  }
}
