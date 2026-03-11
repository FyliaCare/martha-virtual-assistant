// ============================================================
// Database Seed — Pre-populate circuits & products
// ============================================================

import { db } from './database';
import { DEFAULT_CIRCUITS, DEFAULT_PRODUCTS } from '../utils/constants';
import { generateId, now } from '../utils/helpers';
import { seedHistoricalData } from './seedHistoricalData';

// Bump this version whenever seed data changes to force a re-seed.
// The app stores the last-applied seed version in localStorage.
const SEED_DATA_VERSION = 3; // v3: Q1 2026 data, updated debts (+€40 handbook), Ghana cost prices, stock balances, Hamburg cloth Nov 2026
const SEED_VERSION_KEY = 'martha_seed_version';

export async function seedDatabase() {
  const lastVersion = Number(localStorage.getItem(SEED_VERSION_KEY) || '0');
  const needsReseed = lastVersion < SEED_DATA_VERSION;

  // Only seed circuits/products if empty
  const circuitCount = await db.circuits.count();
  if (circuitCount === 0) {
    console.log('[Martha] Seeding database with default data...');

    // Seed circuits
    const circuits = DEFAULT_CIRCUITS.map((c) => ({
      uid: generateId(),
      name: c.name,
      country: c.country,
      subBranches: c.subBranches,
      isActive: true,
      createdAt: now(),
    }));
    await db.circuits.bulkAdd(circuits);

    // Seed products
    const products = DEFAULT_PRODUCTS.map((p) => ({
      uid: generateId(),
      name: p.name,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      currentStock: 0,
      reorderLevel: p.reorderLevel,
      category: p.category,
      createdAt: now(),
      updatedAt: now(),
    }));
    await db.products.bulkAdd(products);

    console.log('[Martha] Database seeded successfully!');
  }

  // If seed data version has changed, clear old data and re-seed
  if (needsReseed) {
    console.log(`[Martha] Seed data updated (v${lastVersion} → v${SEED_DATA_VERSION}). Clearing old transactions for re-seed...`);
    await db.transactions.clear();
    await db.stockMovements.clear();
    await db.events.clear();
  }

  // Seed historical financial data (checks internally if already done)
  await seedHistoricalData();

  // Mark current seed version as applied
  localStorage.setItem(SEED_VERSION_KEY, String(SEED_DATA_VERSION));
}
