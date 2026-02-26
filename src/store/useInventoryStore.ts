// ============================================================
// Inventory Store — Zustand + Dexie
// ============================================================

import { create } from 'zustand';
import { db } from '../db/database';
import type { Product, StockMovement } from '../types';
import { generateId, now } from '../utils/helpers';

interface InventoryStore {
  products: Product[];
  movements: StockMovement[];
  loading: boolean;

  loadProducts: () => Promise<void>;
  loadMovements: () => Promise<void>;
  addProduct: (data: Omit<Product, 'id' | 'uid' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (uid: string, data: Partial<Product>) => Promise<void>;
  addStockMovement: (data: Omit<StockMovement, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  getProductByUid: (uid: string) => Product | undefined;
  getLowStockProducts: () => Product[];
}

export const useInventoryStore = create<InventoryStore>((set, get) => ({
  products: [],
  movements: [],
  loading: false,

  loadProducts: async () => {
    set({ loading: true });
    const products = await db.products.toArray();
    set({ products, loading: false });
  },

  loadMovements: async () => {
    const movements = await db.stockMovements.orderBy('date').reverse().toArray();
    set({ movements });
  },

  addProduct: async (data) => {
    const product: Product = {
      ...data,
      uid: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    await db.products.add(product);
    await get().loadProducts();
  },

  updateProduct: async (uid, data) => {
    const existing = await db.products.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.products.update(existing.id, { ...data, updatedAt: now() });
      await get().loadProducts();
    }
  },

  addStockMovement: async (data) => {
    const movement: StockMovement = {
      ...data,
      uid: generateId(),
      createdAt: now(),
    };
    await db.stockMovements.add(movement);

    // Update product stock
    const product = await db.products.where('uid').equals(data.productId).first();
    if (product?.id) {
      const stockChange = data.type === 'sale' ? -data.quantity : data.quantity;
      await db.products.update(product.id, {
        currentStock: Math.max(0, product.currentStock + stockChange),
        updatedAt: now(),
      });
    }

    await get().loadProducts();
    await get().loadMovements();
  },

  getProductByUid: (uid) => get().products.find((p) => p.uid === uid),

  getLowStockProducts: () =>
    get().products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock >= 0),
}));
