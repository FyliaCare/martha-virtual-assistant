// ============================================================
// Transaction Store — Zustand + Dexie
// ============================================================

import { create } from 'zustand';
import { db } from '../db/database';
import type { Transaction, TransactionType, Quarter } from '../types';
import { generateId, now } from '../utils/helpers';

interface TransactionStore {
  transactions: Transaction[];
  loading: boolean;

  loadTransactions: (quarter?: Quarter, year?: number) => Promise<void>;
  loadAll: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (uid: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (uid: string) => Promise<void>;

  getByType: (type: TransactionType) => Transaction[];
  getByQuarterYear: (quarter: Quarter, year: number) => Transaction[];
  getTotalReceipts: (quarter?: Quarter, year?: number) => number;
  getTotalPayments: (quarter?: Quarter, year?: number) => number;
  getBalance: (quarter?: Quarter, year?: number) => number;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  loading: false,

  loadTransactions: async (quarter, year) => {
    set({ loading: true });
    let txns: Transaction[];
    if (quarter && year) {
      txns = await db.transactions.where({ quarter, year }).toArray();
    } else {
      txns = await db.transactions.orderBy('date').reverse().toArray();
    }
    set({ transactions: txns, loading: false });
  },

  loadAll: async () => {
    set({ loading: true });
    const txns = await db.transactions.orderBy('date').reverse().toArray();
    set({ transactions: txns, loading: false });
  },

  addTransaction: async (data) => {
    const transaction: Transaction = {
      ...data,
      uid: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    await db.transactions.add(transaction);
    await get().loadAll();
  },

  updateTransaction: async (uid, data) => {
    const existing = await db.transactions.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.transactions.update(existing.id, { ...data, updatedAt: now() });
      await get().loadAll();
    }
  },

  deleteTransaction: async (uid) => {
    const existing = await db.transactions.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.transactions.delete(existing.id);
      await get().loadAll();
    }
  },

  getByType: (type) => get().transactions.filter((t) => t.type === type),

  getByQuarterYear: (quarter, year) =>
    get().transactions.filter((t) => t.quarter === quarter && t.year === year),

  getTotalReceipts: (quarter, year) => {
    let txns = get().transactions.filter((t) => t.type === 'receipt');
    if (quarter && year) txns = txns.filter((t) => t.quarter === quarter && t.year === year);
    return txns.reduce((sum, t) => sum + t.amount, 0);
  },

  getTotalPayments: (quarter, year) => {
    let txns = get().transactions.filter((t) => t.type === 'payment');
    if (quarter && year) txns = txns.filter((t) => t.quarter === quarter && t.year === year);
    return txns.reduce((sum, t) => sum + t.amount, 0);
  },

  getBalance: (quarter, year) => {
    return get().getTotalReceipts(quarter, year) - get().getTotalPayments(quarter, year);
  },
}));
