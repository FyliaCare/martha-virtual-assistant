// ============================================================
// Database Seed — Pre-populate circuits & products
// ============================================================

import { db } from './database';
import { DEFAULT_CIRCUITS, DEFAULT_PRODUCTS } from '../utils/constants';
import { generateId, now } from '../utils/helpers';
import { seedHistoricalData } from './seedHistoricalData';

export async function seedDatabase() {
  // Only seed if empty
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

  // Seed historical financial data (checks internally if already done)
  await seedHistoricalData();
}
