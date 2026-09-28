import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { Wallet, Budget, Subscription, Transaction, Category, SQLiteParam } from '../types/finance';
import { DEFAULT_WALLET_ID, DEFAULT_CATEGORY_ID } from '../constants/defaults';

interface LoadingState {
  wallets: boolean;
  transactions: boolean;
  static: boolean;
}

export function useFinanceData() {
  const db = useSQLiteContext();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [loadingState, setLoadingState] = useState<LoadingState>({
    wallets: true,
    transactions: true,
    static: true,
  });
  
  const [error, setError] = useState<Error | null>(null);

  const updateLoading = useCallback((key: keyof LoadingState, value: boolean) => {
    setLoadingState(prev => ({ ...prev, [key]: value }));
  }, []);

  const loadWallets = useCallback(async () => {
    try {
      updateLoading('wallets', true);
      const wData = await db.getAllAsync<Wallet>('SELECT * FROM wallets');
      setWallets(wData);
    } catch (e) {
      console.error('Failed to load wallets', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      updateLoading('wallets', false);
    }
  }, [db]);

  const loadTransactions = useCallback(async () => {
    try {
      updateLoading('transactions', true);
      const tData = await db.getAllAsync<Transaction>('SELECT * FROM finance_logs ORDER BY created_at DESC LIMIT 50');
      setTransactions(tData);
    } catch (e) {
      console.error('Failed to load transactions', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      updateLoading('transactions', false);
    }
  }, [db]);

  const fetchFilteredTransactions = useCallback(async (filters: { type?: string, startDate?: number, endDate?: number, month?: number, year?: number }) => {
    let query = 'SELECT * FROM finance_logs WHERE 1=1';
    const params: SQLiteParam[] = [];
    
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
    try {
      updateLoading('static', true);
      const bData = await db.getAllAsync<Budget>(`
        SELECT 
          b.*,
          c.name as category_name,
          c.icon as category_icon,
          c.color as category_color,
          COALESCE((
            SELECT SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) 
            FROM finance_logs 
            WHERE category_id = b.category_id 
              AND created_at >= cast(strftime('%s', 'now', 'start of month') as integer) * 1000
          ), 0) as spent
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
      `);
      setBudgets(bData);

      const cData = await db.getAllAsync<Category>('SELECT * FROM categories');
      setCategories(cData);

      const sData = await db.getAllAsync<Omit<Subscription, 'is_paused'> & { is_paused: number }>('SELECT * FROM subscriptions ORDER BY next_billing_date ASC');
      setSubscriptions(sData.map(s => ({ ...s, is_paused: s.is_paused === 1 })));
    } catch (e) {
      console.error('Failed to load static data', e);
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      updateLoading('static', false);
    }
  }, [db]);

  const loadAllData = useCallback(async () => {
    try {
      setError(null);
      await Promise.all([loadWallets(), loadTransactions(), loadStaticData()]);
    } catch (e) {
      console.warn('Database not fully migrated yet.', e);
      setError(e instanceof Error ? e : new Error(String(e)));
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
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, txToDelete.wallet_id || DEFAULT_WALLET_ID]);
      });
      loadStaticData(); // Reload budgets
    } catch (e) {
      console.error('Failed to delete transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, transactions, loadWallets, loadTransactions, loadStaticData]);

  const addTransaction = useCallback(async (tx: Omit<Transaction, 'id' | 'created_at'> & { created_at?: number }) => {
    try {
      const txTime = tx.created_at || Date.now();
      const id = 'fin-' + Crypto.randomUUID();
      const walletId = tx.wallet_id || DEFAULT_WALLET_ID;
      
      const newTx = {
        ...tx,
        id,
        created_at: txTime,
        updated_at: Date.now(),
        sync_status: 0,
        icon: tx.icon || 'cash',
        color: tx.color || '#10B981',
        wallet_id: walletId,
        category_id: tx.category_id || DEFAULT_CATEGORY_ID
      } as Transaction;

      // 1. Optimistic Update
      setTransactions(prev => [newTx, ...prev]);
      const balanceModifier = tx.type === 'INCOME' ? tx.amount : -tx.amount;
      setWallets(prev => prev.map(w => w.id === walletId ? { ...w, balance: w.balance + balanceModifier } : w));

      // 2. Database Sync using Transactions
      await db.withExclusiveTransactionAsync(async (txn) => {
        await txn.runAsync(
          'INSERT INTO finance_logs (id, title, subtitle, amount, type, icon, color, created_at, updated_at, sync_status, wallet_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
          [id, tx.title, tx.subtitle, tx.amount, tx.type, newTx.icon, newTx.color, txTime, Date.now(), walletId, newTx.category_id || DEFAULT_CATEGORY_ID]
        );
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [balanceModifier, walletId]);
      });
      loadStaticData(); // Reload budgets
    } catch (e) {
      console.error('Failed to add transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, loadWallets, loadTransactions, loadStaticData]);

  const updateTransaction = useCallback(async (id: string, tx: Partial<Transaction>) => {
    try {
      const oldTx = transactions.find(t => t.id === id);
      if (!oldTx) return;

      const now = Date.now();
      const txTime = tx.created_at ?? oldTx.created_at;
      
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
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [revertModifier, oldTx.wallet_id || DEFAULT_WALLET_ID]);
        // Adjust new wallet
        await txn.runAsync('UPDATE wallets SET balance = balance + ? WHERE id = ?', [applyModifier, newWalletId || DEFAULT_WALLET_ID]);
        
        await txn.runAsync(
          'UPDATE finance_logs SET title = COALESCE(?, title), subtitle = COALESCE(?, subtitle), amount = COALESCE(?, amount), type = COALESCE(?, type), wallet_id = COALESCE(?, wallet_id), category_id = COALESCE(?, category_id), created_at = COALESCE(?, created_at), updated_at = ? WHERE id = ?',
          [tx.title ?? null, tx.subtitle ?? null, tx.amount ?? null, tx.type ?? null, tx.wallet_id ?? null, tx.category_id ?? null, txTime, now, id]
        );
      });
      loadStaticData(); // Reload budgets
    } catch (e) {
      console.error('Failed to update transaction', e);
      // Revert if failed
      loadWallets();
      loadTransactions();
    }
  }, [db, transactions, loadWallets, loadTransactions, loadStaticData]);

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
      const id = 'sub-' + Crypto.randomUUID();
      const newSub = { ...sub, id } as Subscription;
      
      setSubscriptions(prev => [...prev, newSub].sort((a, b) => a.next_billing_date - b.next_billing_date));
      
      await db.runAsync(
        'INSERT INTO subscriptions (id, name, amount, type, billing_cycle, next_billing_date, icon, color, wallet_id, is_paused) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, sub.name, sub.amount, sub.type, sub.billing_cycle, sub.next_billing_date, sub.icon || 'calendar', sub.color || '#38BDF8', sub.wallet_id || DEFAULT_WALLET_ID, sub.is_paused ? 1 : 0]
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
        [sub.name ?? null, sub.amount ?? null, sub.type ?? null, sub.billing_cycle ?? null, sub.next_billing_date ?? null, sub.icon ?? null, sub.color ?? null, sub.wallet_id ?? null, sub.is_paused !== undefined ? (sub.is_paused ? 1 : 0) : null, id]
      );
    } catch (e) {
      console.error('Failed to update subscription', e);
      loadStaticData();
    }
  }, [db, loadStaticData]);

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const isLoading = loadingState.wallets || loadingState.transactions || loadingState.static;

  return {
    wallets,
    budgets,
    subscriptions,
    transactions,
    categories,
    totalBalance,
    isLoading,
    loadingState,
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
