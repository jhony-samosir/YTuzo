export interface Wallet {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'WALLET' | 'E-WALLET' | 'CREDIT' | 'INVEST';
  balance: number;
  color_theme: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parent_id?: string;
}

export interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
  category_name: string;
  category_icon: string;
  category_color: string;
  spent: number;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  billing_cycle: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  next_billing_date: number; // timestamp
  icon: string;
  color: string;
  wallet_id?: string;
  is_paused?: boolean;
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  created_at: number;  // Unix timestamp in milliseconds
  updated_at?: number; // Unix timestamp in milliseconds
  sync_status?: number; // 0 = pending sync, 1 = synced
  wallet_id?: string;
  category_id?: string;
}

export type SQLiteParam = string | number | null | boolean;

