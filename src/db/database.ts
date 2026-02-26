// ============================================================
// IndexedDB Database — Dexie.js Schema
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { Transaction, Circuit, Product, StockMovement, MissionEvent, GeneratedDocument } from '../types';

export class MarthaDatabase extends Dexie {
  transactions!: Table<Transaction, number>;
  circuits!: Table<Circuit, number>;
  products!: Table<Product, number>;
  stockMovements!: Table<StockMovement, number>;
  events!: Table<MissionEvent, number>;
  documents!: Table<GeneratedDocument, number>;

  constructor() {
    super('MarthaVirtualAssistant');

    this.version(1).stores({
      transactions: '++id, uid, date, type, category, circuitId, quarter, year, [quarter+year], [type+quarter+year]',
      circuits: '++id, uid, name, country',
      products: '++id, uid, name, category',
      stockMovements: '++id, uid, productId, type, circuitId, date, [quarter+year]',
      events: '++id, uid, name, type, startDate',
      documents: '++id, uid, type, year, [type+year]',
    });
  }
}

export const db = new MarthaDatabase();
