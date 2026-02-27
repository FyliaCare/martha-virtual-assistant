// ============================================================
// Constants — Categories, Circuits, Products
// ============================================================

import { CategoryOption } from '../types';

// ---- Transaction Categories ----

export const RECEIPT_CATEGORIES: CategoryOption[] = [
  { value: 'circuit_contribution', label: 'Circuit Contribution', icon: 'Building2', type: 'receipt' },
  { value: 'donation_received', label: 'Donation Received', icon: 'Heart', type: 'receipt' },
  { value: 'merchandise_sale', label: 'Merchandise Sale', icon: 'ShoppingBag', type: 'receipt' },
  { value: 'event_income', label: 'Event Income', icon: 'Calendar', type: 'receipt' },
  { value: 'debt_repayment', label: 'Debt Repayment', icon: 'RotateCcw', type: 'receipt' },
  { value: 'opening_balance', label: 'Opening Balance', icon: 'Wallet', type: 'receipt' },
  { value: 'other', label: 'Other Income', icon: 'Plus', type: 'receipt' },
];

export const PAYMENT_CATEGORIES: CategoryOption[] = [
  { value: 'donation_given', label: 'Donation Given', icon: 'HeartHandshake', type: 'payment' },
  { value: 'merchandise_purchase', label: 'Merchandise Purchase', icon: 'Package', type: 'payment' },
  { value: 'transportation', label: 'Transportation', icon: 'Truck', type: 'payment' },
  { value: 'postage', label: 'Postage', icon: 'Mail', type: 'payment' },
  { value: 'event_expense', label: 'Event Expense', icon: 'CalendarMinus', type: 'payment' },
  { value: 'airtime', label: 'Airtime / Zoom', icon: 'Phone', type: 'payment' },
  { value: 'stationery', label: 'Stationery', icon: 'Pencil', type: 'payment' },
  { value: 'gift', label: 'Gift / Send-off', icon: 'Gift', type: 'payment' },
  { value: 'honorarium', label: 'Honorarium', icon: 'Award', type: 'payment' },
  { value: 'other', label: 'Other Expense', icon: 'Minus', type: 'payment' },
];

export const ALL_CATEGORIES = [...RECEIPT_CATEGORIES, ...PAYMENT_CATEGORIES];

// ---- Default Circuits ----

export const DEFAULT_CIRCUITS = [
  { name: 'Hamburg', country: 'Germany', subBranches: ['Hannover', 'Wesley'] },
  { name: 'Stuttgart', country: 'Germany', subBranches: [] },
  { name: 'Dusseldorf', country: 'Germany', subBranches: [] },
  { name: 'Holland', country: 'Netherlands', subBranches: [] },
  { name: 'Italy', country: 'Italy', subBranches: ['Modena'] },
  { name: 'Belgium', country: 'Belgium', subBranches: [] },
  { name: 'Finland', country: 'Finland', subBranches: [] },
  { name: 'UK', country: 'United Kingdom', subBranches: [] },
];

// ---- Default Products ----

export const DEFAULT_PRODUCTS = [
  { name: 'Jacket (New)', costPrice: 35.00, sellingPrice: 37.00, category: 'clothing' as const, reorderLevel: 10 },
  { name: 'Tree of Life (Big)', costPrice: 38.00, sellingPrice: 70.00, category: 'accessory' as const, reorderLevel: 5 },
  { name: 'Regalia', costPrice: 3.00, sellingPrice: 8.00, category: 'regalia' as const, reorderLevel: 10 },
  { name: "Officer's Badge", costPrice: 3.00, sellingPrice: 5.00, category: 'badge' as const, reorderLevel: 10 },
  { name: 'Gold Badge', costPrice: 6.00, sellingPrice: 10.00, category: 'badge' as const, reorderLevel: 3 },
  { name: 'Enrolment Badge', costPrice: 2.00, sellingPrice: 4.00, category: 'badge' as const, reorderLevel: 10 },
  { name: 'Headgear (Cap)', costPrice: 2.00, sellingPrice: 4.00, category: 'accessory' as const, reorderLevel: 10 },
  { name: 'Handbook', costPrice: 2.50, sellingPrice: 4.00, category: 'publication' as const, reorderLevel: 20 },
  { name: 'Lacoste T-Shirt', costPrice: 5.00, sellingPrice: 8.00, category: 'clothing' as const, reorderLevel: 10 },
  { name: 'Dues Card', costPrice: 0.30, sellingPrice: 2.00, category: 'accessory' as const, reorderLevel: 20 },
  { name: 'Scarf', costPrice: 3.60, sellingPrice: 6.00, category: 'accessory' as const, reorderLevel: 10 },
  { name: 'Europe Cloth', costPrice: 21.43, sellingPrice: 30.00, category: 'clothing' as const, reorderLevel: 10 },
  { name: 'Enrolment Service Book', costPrice: 1.36, sellingPrice: 3.00, category: 'publication' as const, reorderLevel: 5 },
];

// ---- Quarter Labels ----

export const QUARTER_LABELS: Record<number, string> = {
  1: 'January – March',
  2: 'April – June',
  3: 'July – September',
  4: 'October – December',
};

export const QUARTER_MONTHS: Record<number, string[]> = {
  1: ['January', 'February', 'March'],
  2: ['April', 'May', 'June'],
  3: ['July', 'August', 'September'],
  4: ['October', 'November', 'December'],
};

// ---- App Config ----

export const APP_NAME = 'Martha Virtual Assistant';
export const CURRENCY_SYMBOL = '€';
export const ORGANIZATION_NAME = 'Europe Mission';
