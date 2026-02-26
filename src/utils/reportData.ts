// ============================================================
// Report Data Builder — Computes advanced statistics for reports
// ============================================================

import type { Transaction, Circuit, Quarter } from '../types';
import { ALL_CATEGORIES, QUARTER_LABELS, ORGANIZATION_NAME, CURRENCY_SYMBOL } from './constants';
import { formatCurrency } from './helpers';

export interface CategoryBreakdown {
  category: string;
  label: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface CircuitBreakdown {
  name: string;
  receipts: number;
  payments: number;
  net: number;
  txnCount: number;
}

export interface MonthlyBreakdown {
  month: string;
  monthIndex: number;
  receipts: number;
  payments: number;
  net: number;
  txnCount: number;
}

export interface AdvancedStats {
  avgTransactionSize: number;
  avgReceiptSize: number;
  avgPaymentSize: number;
  medianTransaction: number;
  largestReceipt: Transaction | null;
  largestPayment: Transaction | null;
  receiptGrowthVsPrevQ: number | null;
  paymentGrowthVsPrevQ: number | null;
  balanceGrowthVsPrevQ: number | null;
  prevQReceipts: number;
  prevQPayments: number;
  prevQBalance: number;
  topReceiptCategories: CategoryBreakdown[];
  topPaymentCategories: CategoryBreakdown[];
  busyMonth: string;
  quietMonth: string;
  operatingRatio: number; // payments / receipts
  surplusDeficit: 'surplus' | 'deficit' | 'balanced';
}

export interface ReportData {
  // Header
  organization: string;
  currencySymbol: string;
  quarter: Quarter;
  year: number;
  quarterLabel: string;
  generatedAt: string;

  // Core totals
  totalReceipts: number;
  totalPayments: number;
  netBalance: number;
  totalTransactions: number;
  receiptCount: number;
  paymentCount: number;

  // Breakdowns
  receiptsByCategory: CategoryBreakdown[];
  paymentsByCategory: CategoryBreakdown[];
  circuitBreakdown: CircuitBreakdown[];
  monthlyBreakdown: MonthlyBreakdown[];

  // Advanced
  advanced: AdvancedStats;

  // Raw sorted transactions
  allReceipts: Transaction[];
  allPayments: Transaction[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function getPreviousQuarter(q: Quarter, y: number): { quarter: Quarter; year: number } {
  if (q === 1) return { quarter: 4, year: y - 1 };
  return { quarter: (q - 1) as Quarter, year: y };
}

export function buildReportData(
  transactions: Transaction[],
  circuits: Circuit[],
  quarter: Quarter,
  year: number
): ReportData {
  const filtered = transactions.filter((t) => t.quarter === quarter && t.year === year);
  const receipts = filtered.filter((t) => t.type === 'receipt');
  const payments = filtered.filter((t) => t.type === 'payment');

  const totalReceipts = receipts.reduce((s, t) => s + t.amount, 0);
  const totalPayments = payments.reduce((s, t) => s + t.amount, 0);
  const netBalance = totalReceipts - totalPayments;

  // ── Category breakdown ──
  const buildCategoryBreakdown = (txns: Transaction[], total: number): CategoryBreakdown[] => {
    const map = new Map<string, { amount: number; count: number }>();
    txns.forEach((t) => {
      const existing = map.get(t.category) || { amount: 0, count: 0 };
      existing.amount += t.amount;
      existing.count += 1;
      map.set(t.category, existing);
    });
    return Array.from(map.entries())
      .map(([category, data]) => ({
        category,
        label: ALL_CATEGORIES.find((c) => c.value === category)?.label || category,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? (data.amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const receiptsByCategory = buildCategoryBreakdown(receipts, totalReceipts);
  const paymentsByCategory = buildCategoryBreakdown(payments, totalPayments);

  // ── Circuit breakdown ──
  const circuitMap = new Map<string, { receipts: number; payments: number; count: number }>();
  filtered.forEach((t) => {
    if (!t.circuitId) return;
    const existing = circuitMap.get(t.circuitId) || { receipts: 0, payments: 0, count: 0 };
    if (t.type === 'receipt') existing.receipts += t.amount;
    else existing.payments += t.amount;
    existing.count += 1;
    circuitMap.set(t.circuitId, existing);
  });
  const circuitBreakdown: CircuitBreakdown[] = Array.from(circuitMap.entries())
    .map(([circuitId, data]) => ({
      name: circuits.find((c) => c.uid === circuitId)?.name || 'Unknown',
      receipts: data.receipts,
      payments: data.payments,
      net: data.receipts - data.payments,
      txnCount: data.count,
    }))
    .sort((a, b) => b.receipts - a.receipts);

  // ── Monthly breakdown ──
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const startMonth = (quarter - 1) * 3;
  const monthlyBreakdown: MonthlyBreakdown[] = [0, 1, 2].map((offset) => {
    const monthIdx = startMonth + offset;
    const monthTxns = filtered.filter((t) => new Date(t.date).getMonth() === monthIdx);
    const mReceipts = monthTxns.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
    const mPayments = monthTxns.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
    return {
      month: MONTH_NAMES[monthIdx],
      monthIndex: monthIdx,
      receipts: mReceipts,
      payments: mPayments,
      net: mReceipts - mPayments,
      txnCount: monthTxns.length,
    };
  });

  // ── Previous quarter comparison ──
  const prev = getPreviousQuarter(quarter, year);
  const prevFiltered = transactions.filter((t) => t.quarter === prev.quarter && t.year === prev.year);
  const prevReceipts = prevFiltered.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
  const prevPayments = prevFiltered.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
  const prevBalance = prevReceipts - prevPayments;
  const hasPrevData = prevFiltered.length > 0;

  const growth = (current: number, prev: number) =>
    prev > 0 ? ((current - prev) / prev) * 100 : null;

  // ── Advanced stats ──
  const allAmounts = filtered.map((t) => t.amount);
  const busyMonthData = monthlyBreakdown.reduce((max, m) => (m.txnCount > max.txnCount ? m : max), monthlyBreakdown[0]);
  const quietMonthData = monthlyBreakdown.reduce((min, m) => (m.txnCount < min.txnCount ? m : min), monthlyBreakdown[0]);

  const advanced: AdvancedStats = {
    avgTransactionSize: allAmounts.length > 0 ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0,
    avgReceiptSize: receipts.length > 0 ? totalReceipts / receipts.length : 0,
    avgPaymentSize: payments.length > 0 ? totalPayments / payments.length : 0,
    medianTransaction: median(allAmounts),
    largestReceipt: receipts.length > 0 ? receipts.reduce((max, t) => (t.amount > max.amount ? t : max), receipts[0]) : null,
    largestPayment: payments.length > 0 ? payments.reduce((max, t) => (t.amount > max.amount ? t : max), payments[0]) : null,
    receiptGrowthVsPrevQ: hasPrevData ? growth(totalReceipts, prevReceipts) : null,
    paymentGrowthVsPrevQ: hasPrevData ? growth(totalPayments, prevPayments) : null,
    balanceGrowthVsPrevQ: hasPrevData && prevBalance !== 0 ? growth(netBalance, prevBalance) : null,
    prevQReceipts: prevReceipts,
    prevQPayments: prevPayments,
    prevQBalance: prevBalance,
    topReceiptCategories: receiptsByCategory.slice(0, 5),
    topPaymentCategories: paymentsByCategory.slice(0, 5),
    busyMonth: busyMonthData?.month ?? '',
    quietMonth: quietMonthData?.month ?? '',
    operatingRatio: totalReceipts > 0 ? totalPayments / totalReceipts : 0,
    surplusDeficit: netBalance > 0 ? 'surplus' : netBalance < 0 ? 'deficit' : 'balanced',
  };

  return {
    organization: ORGANIZATION_NAME,
    currencySymbol: CURRENCY_SYMBOL,
    quarter,
    year,
    quarterLabel: QUARTER_LABELS[quarter],
    generatedAt: new Date().toISOString(),
    totalReceipts,
    totalPayments,
    netBalance,
    totalTransactions: filtered.length,
    receiptCount: receipts.length,
    paymentCount: payments.length,
    receiptsByCategory,
    paymentsByCategory,
    circuitBreakdown,
    monthlyBreakdown,
    advanced,
    allReceipts: [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    allPayments: [...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  };
}

/** Format a percentage with sign */
export function fmtPct(val: number | null): string {
  if (val === null) return 'N/A';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

/** Format currency without symbol for tables */
export function fmtAmt(amount: number): string {
  return formatCurrency(amount);
}
