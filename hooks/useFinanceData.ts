import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Wallet, Budget, Subscription, Transaction, Category } from '../types/finance';

export function useFinanceData() {
  const db = useSQLiteContext();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadWallets = useCallback(async () => {
    const wData = await db.getAllAsync<Wallet>('SELECT * FROM wallets');
    setWallets(wData);
  }, [db]);

  const loadTransactions = useCallback(async () => {
    // Limits fetch to 50 to prevent N+1 overfetching issues
    const tData = await db.getAllAsync<Transaction>('SELECT * FROM finance_logs ORDER BY created_at DESC LIMIT 50');
    setTransactions(tData);
  }, [db]);

  const fetchFilteredTransactions = useCallback(async (filters: { type?: string, startDate?: number, endDate?: number, month?: number, year?: number }) => {
    let query = 'SELECT * FROM finance_logs WHERE 1=1';
    const params: any[] = [];
    
    if (filters.type && filters.type !== 'ALL') {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    
    if (filters.startDate && filters.endDate) {
      query += ' AND created_at >= ? AND created_at <= ?';
      params.push(filters.startDate, filters.endDate);
    } else if (filters.year !== undefined && filters.month !== undefined) {
       const startOfMonth = new Date(filters.year, filters.month, 1).getTime();
       const endOfMonth = new Date(filters.year, filters.month + 1, 0, 23, 59, 59, 999).getTime();
       query += ' AND created_at >= ? AND created_at <= ?';
       params.push(startOfMonth, endOfMonth);
    }
  
    query += ' ORDER BY created_at DESC LIMIT 500';
    return await db.getAllAsync<Transaction>(query, params);
  }, [db]);

  const loadStaticData = useCallback(async () => {
    const bData = await db.getAllAsync<Budget>(`
      SELECT b.*, c.name as category_name, c.icon as category_icon, c.color as category_color 
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
    `);
    setBudgets(bData);

    const cData = await db.getAllAsync<Category>('SELECT * FROM categories');
    setCategories(cData);

    const sData = await db.getAllAsync<Subscription>('SELECT * FROM subscriptions ORDER BY next_billing_date ASC');
    setSubscriptions(sData);
  }, [db]);

  const processScheduledTransactions = useCallback(async () => {
    try {
      const now = Date.now();
      const dueSchedules = await db.getAllAsync<Subscription>('SELECT * FROM subscriptions WHERE next_billing_date <= ? AND (is_paused IS NULL OR is_paused = 0)', [now]);
      
      if (dueSchedules.length > 0) {
        await db.withExclusiveTransactionAsync(async (txn) => {
          for (const schedule of dueSchedules) {
            const id = 'fin-' + Date.now() + Math.floor(Math.random() * 1000);
            
            // Log to ledger
            await txn.runAsync(
              'INSERT INTO finance_logs (id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
              [id, schedule.name, 'Scheduled', schedule.amount, schedule.type, schedule.icon, schedule.color, schedule.next_billing_date, now, schedule.wallet_id || 'w-1', 'cat-1']
            );
            
            // Adjust wallet
            const balanceModifier = schedule.type === 'INCOME' ? schedule.amount : -schedule.amount;
            await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, schedule.wallet_id || 'w-1']);
            
            // Bump next_billing_date
            const nextDate = new Date(schedule.next_billing_date);
            if (schedule.billing_cycle === 'DAILY') nextDate.setDate(nextDate.getDate() + 1);
            else if (schedule.billing_cycle === 'WEEKLY') nextDate.setDate(nextDate.getDate() + 7);
            else if (schedule.billing_cycle === 'MONTHLY') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (schedule.billing_cycle === 'YEARLY') nextDate.setFullYear(nextDate.getFullYear() + 1);
            
            await txn.runAsync('UPDATE subscriptions SET next_billing_date = ? WHERE id = ?', [nextDate.getTime(), schedule.id]);
          }
        });
        return true; // Indicates we processed something
      }
      return false;
    } catch (e) {
      console.error('Failed to process scheduled transactions', e);
      return false;
    }
  }, [db]);

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Run the automation engine first
      await processScheduledTransactions();
      
      await Promise.all([loadWallets(), loadTransactions(), loadStaticData()]);
    } catch (e) {
      console.warn('Database not fully migrated yet.', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setIsLoading(false);
    }
  }, [loadWallets, loadTransactions, loadStaticData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);



  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const txToDelete = transactions.find(t => t.id === id);
      if (!txToDelete) return;

      // 1. Optimistic Update
      setTransactions(prev => prev.filter(t => t.id !== id));
      const balanceModifier = txToDelete.type === 'INCOME' ? -txToDelete.amount : txToDelete.amount;
      setWallets(prev => prev.map(w => w.id === txToDelete.wallet_id ? { ...w, balance: w.balance + balanceModifier } : w));

      // 2. Database Sync using Transactions
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync('DELETE FROM finance_logs WHERE id = ?', [id]);
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, txToDelete.wallet_id || 'w-1']);
      });
    } catch (e) {
      console.error('Failed to delete transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, transactions, loadWallets, loadTransactions]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'> & { created_at?: string | number }) => {
    try {
      const txTime = tx.created_at ? (typeof tx.created_at === 'string' ? new Date(tx.created_at).getTime() : tx.created_at) : Date.now();
      const id = 'fin-' + Date.now() + Math.floor(Math.random() * 1000); // Generate unique ID
      const walletId = tx.wallet_id || 'w-1';
      
      const newTx = {
        ...tx,
        id,
        created_at: txTime as number,
        updated_at: Date.now(),
        sync_status: 0,
        icon: tx.icon || 'cash',
        color: tx.color || '#10B981',
        wallet_id: walletId,
        category_id: tx.category_id || 'cat-1'
      } as Transaction;

      // 1. Optimistic Update
      setTransactions(prev => [newTx, ...prev]);
      const balanceModifier = tx.type === 'INCOME' ? tx.amount : -tx.amount;
      setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: w.balance + balanceModifier } : w));

      // 2. Database Sync using Transactions
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          'INSERT INTO finance_logs (id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
          [id, tx.title, tx.subtitle, tx.amount, tx.type, newTx.icon, newTx.color, txTime, Date.now(), walletId, newTx.category_id || 'cat-1']
        );
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, walletId]);
      });
    } catch (e) {
      console.error('Failed to add transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, loadWallets, loadTransactions]);

  const updateTransaction = useCallback(async (id: string, tx: Partial<Transaction>) => {
    try {
      const oldTx = transactions.find(t => t.id === id);
      if (!oldTx) return;

      const now = Date.now();
      const txTime = tx.created_at ? (typeof tx.created_at === 'string' ? new Date(tx.created_at).getTime() : tx.created_at) : oldTx.created_at;
      
      const newType = tx.type || oldTx.type;
      const newAmount = tx.amount ?? oldTx.amount;
      const newWalletId = tx.wallet_id || oldTx.wallet_id;

      // Calculate diff for wallets
      const revertModifier = oldTx.type === 'INCOME' ? -oldTx.amount : oldTx.amount;
      const applyModifier = newType === 'INCOME' ? newAmount : -newAmount;

      // 1. Optimistic Update
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...tx, updated_at: now, created_at: txTime as number } : t));
      
      setWallets(prev => prev.map(w => {
        let newBalance = w.balance;
        if (w.id === oldTx.wallet_id) newBalance += revertModifier;
        if (w.id === newWalletId) newBalance += applyModifier;
        return { ...w, balance: newBalance };
      }));

      // 2. Database Sync using Transactions
      await db.withExclusiveTransactionAsync(async (txn) => {
        // Adjust old wallet
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [revertModifier, oldTx.wallet_id || 'w-1']);
        // Adjust new wallet
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [applyModifier, newWalletId || 'w-1']);
        
        await txn.runAsync(
          'UPDATE finance_logs SET title = COALESCE(?, title), subtitle = COALESCE(?, subtitle), amount = COALESCE(?, amount), type = COALESCE(?, type), wallet_id = COALESCE(?, wallet_id), category_id = COALESCE(?, category_id), created_at = COALESCE(?, created_at), updated_at = ? WHERE id = ?',
          [tx.title ?? null, tx.subtitle ?? null, tx.amount ?? null, tx.type ?? null, tx.wallet_id ?? null, tx.category_id ?? null, txTime, now, id]
        );
      });
    } catch (e) {
      console.error('Failed to update transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, transactions, loadWallets, loadTransactions]);

  const deleteSubscription = useCallback(async (id: string) => {
    try {
      setSubscriptions(prev => prev.filter(s => s.id !== id));
      await db.runAsync('DELETE FROM subscriptions WHERE id = ?', [id]);
    } catch (e) {
      console.error('Failed to delete subscription', e);
      loadStaticData(); // Revert
    }
  }, [db, loadStaticData]);

  const addSubscription = useCallback(async (sub: Omit<Subscription, 'id'>) => {
    try {
      const id = 'sub-' + Date.now() + Math.floor(Math.random() * 1000);
      const newSub = { ...sub, id } as Subscription;
      
      setSubscriptions(prev => [...prev, newSub].sort((a, b) => a.next_billing_date - b.next_billing_date));
      
      await db.runAsync(
        'INSERT INTO subscriptions (id, name, amount, type, billing_cycle, next_billing_date, icon, color, wallet_id, is_paused) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, sub.name, sub.amount, sub.type, sub.billing_cycle, sub.next_billing_date, sub.icon || 'calendar', sub.color || '#38BDF8', sub.wallet_id || 'w-1', sub.is_paused || 0]
      );
    } catch (e) {
      console.error('Failed to add subscription', e);
      loadStaticData();
    }
  }, [db, loadStaticData]);

  const updateSubscription = useCallback(async (id: string, sub: Partial<Subscription>) => {
    try {
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, ...sub } : s).sort((a, b) => a.next_billing_date - b.next_billing_date));
      
      await db.runAsync(
        'UPDATE subscriptions SET name = COALESCE(?, name), amount = COALESCE(?, amount), type = COALESCE(?, type), billing_cycle = COALESCE(?, billing_cycle), next_billing_date = COALESCE(?, next_billing_date), icon = COALESCE(?, icon), color = COALESCE(?, color), wallet_id = COALESCE(?, wallet_id), is_paused = COALESCE(?, is_paused) WHERE id = ?',
        [sub.name ?? null, sub.amount ?? null, sub.type ?? null, sub.billing_cycle ?? null, sub.next_billing_date ?? null, sub.icon ?? null, sub.color ?? null, sub.wallet_id ?? null, sub.is_paused ?? null, id]
      );
    } catch (e) {
      console.error('Failed to update subscription', e);
      loadStaticData();
    }
  }, [db, loadStaticData]);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  return {
    wallets,
    budgets,
    subscriptions,
    transactions,
    categories,
    totalBalance,
    isLoading,
    error,
    refreshData: loadAllData,
    fetchFilteredTransactions,
    deleteTransaction,
    addTransaction,
    updateTransaction,
    deleteSubscription,
    addSubscription,
    updateSubscription
  };
}
