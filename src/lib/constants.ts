export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const DEFAULT_CATEGORIES = [
  { name: 'Groceries', icon: '🛒', color: '#10B981' },
  { name: 'Dining', icon: '🍽️', color: '#F59E0B' },
  { name: 'Fuel', icon: '⛽', color: '#EF4444' },
  { name: 'Shopping', icon: '🛍️', color: '#8B5CF6' },
  { name: 'Bills', icon: '📄', color: '#06B6D4' },
  { name: 'Entertainment', icon: '🎬', color: '#EC4899' },
  { name: 'Transport', icon: '🚕', color: '#3B82F6' },
  { name: 'Healthcare', icon: '⚕️', color: '#14B8A6' },
  { name: 'Other', icon: '📦', color: '#6B7280' },
];

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.5,
};

export const DEMO_TRANSACTIONS = [
  {
    description: 'STARBUCKS COFFEE #2390',
    amount: 5.45,
    merchant_name: 'Starbucks',
    category: 'Dining',
  },
  {
    description: 'SHELL PETROL STATION',
    amount: 45.00,
    merchant_name: 'Shell',
    category: 'Fuel',
  },
  {
    description: 'AMAZON MARKETPLACE PURCHASE',
    amount: 89.99,
    merchant_name: 'Amazon',
    category: 'Shopping',
  },
  {
    description: 'WHOLE FOODS MARKET',
    amount: 73.45,
    merchant_name: 'Whole Foods',
    category: 'Groceries',
  },
  {
    description: 'NETFLIX SUBSCRIPTION',
    amount: 15.99,
    merchant_name: 'Netflix',
    category: 'Entertainment',
  },
  {
    description: 'UBER RIDE 2024',
    amount: 24.50,
    merchant_name: 'Uber',
    category: 'Transport',
  },
  {
    description: 'ELECTRIC BILL PAYMENT',
    amount: 120.00,
    merchant_name: 'Power Co',
    category: 'Bills',
  },
  {
    description: 'CVS PHARMACY',
    amount: 32.15,
    merchant_name: 'CVS',
    category: 'Healthcare',
  },
];
