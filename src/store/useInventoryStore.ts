// ============================================================
// Inventory Store — Zustand + Dexie
// ============================================================

import { create } from 'zustand';
import { db } from '../db/database';
import { syncDocToCloud, deleteDocFromCloud } from '../db/sync';
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
  deleteProduct: (uid: string) => Promise<void>;
  addStockMovement: (data: Omit<StockMovement, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateStockMovement: (uid: string, data: Partial<StockMovement>, oldMovement: StockMovement) => Promise<void>;
  deleteStockMovement: (uid: string) => Promise<void>;
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
    syncDocToCloud('products', product.uid, { ...product, id: undefined });
    await get().loadProducts();
  },

  updateProduct: async (uid, data) => {
    const existing = await db.products.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.products.update(existing.id, { ...data, updatedAt: now() });
      const full = await db.products.where('uid').equals(uid).first();
      if (full) syncDocToCloud('products', uid, { ...full, id: undefined });
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
    syncDocToCloud('stockMovements', movement.uid, { ...movement, id: undefined });

    // Update product stock
    const product = await db.products.where('uid').equals(data.productId).first();
    if (product?.id) {
      const stockChange = data.type === 'sale' ? -data.quantity : data.quantity;
      await db.products.update(product.id, {
        currentStock: Math.max(0, product.currentStock + stockChange),
        updatedAt: now(),
      });
      const updated = await db.products.where('uid').equals(data.productId).first();
      if (updated) syncDocToCloud('products', updated.uid, { ...updated, id: undefined });
    }

    await get().loadProducts();
    await get().loadMovements();
  },

  getProductByUid: (uid) => get().products.find((p) => p.uid === uid),

  getLowStockProducts: () =>
    get().products.filter((p) => p.currentStock <= p.reorderLevel && p.currentStock >= 0),

  deleteProduct: async (uid) => {
    const existing = await db.products.where('uid').equals(uid).first();
    if (existing?.id) {
      // Delete all stock movements for this product
      const movements = await db.stockMovements.where('productId').equals(uid).toArray();
      for (const m of movements) {
        if (m.id) await db.stockMovements.delete(m.id);
        deleteDocFromCloud('stockMovements', m.uid);
      }
      await db.products.delete(existing.id);
      deleteDocFromCloud('products', uid);
      await get().loadProducts();
      await get().loadMovements();
    }
  },

  updateStockMovement: async (uid, data, oldMovement) => {
    const existing = await db.stockMovements.where('uid').equals(uid).first();
    if (!existing?.id) return;

    // Reverse the old movement's effect on stock
    const product = await db.products.where('uid').equals(oldMovement.productId).first();
    if (product?.id) {
      const oldStockChange = oldMovement.type === 'sale' ? -oldMovement.quantity : oldMovement.quantity;
      const newType = data.type ?? oldMovement.type;
      const newQty = data.quantity ?? oldMovement.quantity;
      const newStockChange = newType === 'sale' ? -newQty : newQty;
      const netChange = newStockChange - oldStockChange;
      await db.products.update(product.id, {
        currentStock: Math.max(0, product.currentStock + netChange),
        updatedAt: now(),
      });
      const updatedProduct = await db.products.where('uid').equals(oldMovement.productId).first();
      if (updatedProduct) syncDocToCloud('products', updatedProduct.uid, { ...updatedProduct, id: undefined });
    }

    await db.stockMovements.update(existing.id, data);
    const full = await db.stockMovements.where('uid').equals(uid).first();
    if (full) syncDocToCloud('stockMovements', uid, { ...full, id: undefined });

    await get().loadProducts();
    await get().loadMovements();
  },

  deleteStockMovement: async (uid) => {
    const existing = await db.stockMovements.where('uid').equals(uid).first();
    if (!existing?.id) return;

    // Reverse the movement's effect on stock
    const product = await db.products.where('uid').equals(existing.productId).first();
    if (product?.id) {
      const stockChange = existing.type === 'sale' ? -existing.quantity : existing.quantity;
      await db.products.update(product.id, {
        currentStock: Math.max(0, product.currentStock - stockChange),
        updatedAt: now(),
      });
      const updatedProduct = await db.products.where('uid').equals(existing.productId).first();
      if (updatedProduct) syncDocToCloud('products', updatedProduct.uid, { ...updatedProduct, id: undefined });
    }

    await db.stockMovements.delete(existing.id);
    deleteDocFromCloud('stockMovements', uid);

    await get().loadProducts();
    await get().loadMovements();
  },
}));
