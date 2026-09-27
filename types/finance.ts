export interface Wallet {
  id: string;
  name: string;
  type: 'BANK' | 'CASH' | 'WALLET';
  balance: number;
  color_theme: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  category_id: string;
  monthly_limit: number;
  category_name: string;
  category_icon: string;
  category_color: string;
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
  is_paused?: number; // 0 for active, 1 for paused
}

export interface Transaction {
  id: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  created_at: string | number; // ISO string or timestamp
  wallet_id?: string;
  category_id?: string;
}
