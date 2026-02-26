// ============================================================
// MARTHA VIRTUAL ASSISTANT — TypeScript Type Definitions
// ============================================================

// ---- Transaction Types ----

export type TransactionType = 'receipt' | 'payment';

export type TransactionCategory =
  | 'donation_received'
  | 'donation_given'
  | 'circuit_contribution'
  | 'merchandise_sale'
  | 'merchandise_purchase'
  | 'transportation'
  | 'postage'
  | 'event_income'
  | 'event_expense'
  | 'airtime'
  | 'stationery'
  | 'gift'
  | 'debt_repayment'
  | 'opening_balance'
  | 'honorarium'
  | 'other';

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Transaction {
  id?: number;
  uid: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  subcategory?: string;
  description: string;
  amount: number;
  circuitId?: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  eventId?: string;
  items?: TransactionItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Circuit Types ----

export interface Circuit {
  id?: number;
  uid: string;
  name: string;
  country: string;
  subBranches?: string[];
  contactPerson?: string;
  isActive: boolean;
  createdAt: string;
}

// ---- Product / Inventory Types ----

export type ProductCategory = 'regalia' | 'badge' | 'clothing' | 'publication' | 'accessory';

export interface Product {
  id?: number;
  uid: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  category: ProductCategory;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id?: number;
  uid: string;
  productId: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  unitPrice: number;
  circuitId?: string;
  transactionId?: string;
  date: string;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  notes?: string;
  createdAt: string;
}

// ---- Event Types ----

export type EventType = 'retreat' | 'conference' | 'inauguration' | 'other';

export interface MissionEvent {
  id?: number;
  uid: string;
  name: string;
  type: EventType;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
}

// ---- Document Types ----

export type DocumentType =
  | 'quarterly_report'
  | 'annual_report'
  | 'circuit_report'
  | 'stock_report'
  | 'invoice'
  | 'receipt'
  | 'pnl_report';

export interface GeneratedDocument {
  id?: number;
  uid: string;
  type: DocumentType;
  title: string;
  quarter?: number;
  year: number;
  data?: string; // JSON serialized report data
  generatedAt: string;
}

// ---- Martha Types ----

export type MarthaPose =
  | 'greeting'
  | 'presenting'
  | 'thinking'
  | 'celebrating'
  | 'pointing'
  | 'clipboard'
  | 'warning'
  | 'desk'
  | 'thumbsup'
  | 'waving';

export interface MarthaTip {
  id: string;
  message: string;
  action?: string;
  actionRoute?: string;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

// ---- UI Types ----

export type Quarter = 1 | 2 | 3 | 4;

export interface QuarterYear {
  quarter: Quarter;
  year: number;
}

export interface CategoryOption {
  value: TransactionCategory;
  label: string;
  icon: string;
  type: TransactionType;
}

// ---- Summary / Analytics Types ----

export interface FinancialSummary {
  totalReceipts: number;
  totalPayments: number;
  balance: number;
  openingBalance: number;
  closingBalance: number;
  byCategory: Record<TransactionCategory, number>;
}

export interface CircuitSummary {
  circuitId: string;
  circuitName: string;
  totalContributed: number;
  totalPurchased: number;
  outstandingDebt: number;
}

export interface ProductSummary {
  productId: string;
  productName: string;
  openingStock: number;
  purchased: number;
  sold: number;
  closingStock: number;
  costValue: number;
  saleValue: number;
  profit: number;
}
