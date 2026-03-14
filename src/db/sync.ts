// ============================================================
// Cloud Sync — Firestore ↔ Dexie bidirectional sync
// ============================================================
//
// Strategy:
//   - Dexie remains the fast local database (all reads come from here)
//   - After every local write, mirror the change to Firestore
//   - On app start, pull from Firestore and merge into Dexie
//   - Conflict resolution: most recent `updatedAt` wins
// ============================================================

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../firebase';
import { db } from './database';
import type { Transaction, Circuit, Product, StockMovement } from '../types';

// ── Helpers ──

/** Strip the Dexie auto-increment `id` field before pushing to Firestore */
function stripId<T extends { id?: number }>(record: T): Omit<T, 'id'> {
  const { id: _, ...rest } = record;
  return rest;
}

// ── Push single document to Firestore ──

export async function syncDocToCloud(
  collectionName: string,
  uid: string,
  data: Record<string, unknown>,
) {
  try {
    await setDoc(doc(firestore, collectionName, uid), data);
  } catch (e) {
    console.warn(`[Sync] Push ${collectionName}/${uid} failed:`, e);
  }
}

export async function deleteDocFromCloud(collectionName: string, uid: string) {
  try {
    await deleteDoc(doc(firestore, collectionName, uid));
  } catch (e) {
    console.warn(`[Sync] Delete ${collectionName}/${uid} failed:`, e);
  }
}

// ── Batch push (used after initial seed) ──

async function batchPush(
  collectionName: string,
  records: Array<{ uid: string; id?: number; [k: string]: unknown }>,
) {
  if (records.length === 0) return;

  // Firestore batches are limited to 500 operations
  const BATCH_SIZE = 450;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(firestore);
    for (const record of chunk) {
      const ref = doc(firestore, collectionName, record.uid);
      batch.set(ref, stripId(record));
    }
    await batch.commit();
  }
}

// ── Pull all data from Firestore and merge into Dexie ──

export async function pullFromCloud(): Promise<boolean> {
  try {
    let pulled = false;

    // ── Transactions ──
    const txnSnap = await getDocs(collection(firestore, 'transactions'));
    if (!txnSnap.empty) {
      pulled = true;
      const remoteTxns = txnSnap.docs.map((d) => d.data() as Transaction);
      const localTxns = await db.transactions.toArray();
      const localMap = new Map(localTxns.map((t) => [t.uid, t]));

      for (const remote of remoteTxns) {
        const local = localMap.get(remote.uid);
        if (!local) {
          // Remote-only: add locally
          await db.transactions.add({ ...remote } as Transaction);
        } else if (remote.updatedAt > local.updatedAt) {
          // Remote is newer: update local
          await db.transactions.update(local.id!, stripId(remote));
        }
        localMap.delete(remote.uid);
      }
      // Local-only records (not in Firestore) — push them up
      for (const [, local] of localMap) {
        await syncDocToCloud('transactions', local.uid, stripId(local) as Record<string, unknown>);
      }
    }

    // ── Circuits ──
    const circSnap = await getDocs(collection(firestore, 'circuits'));
    if (!circSnap.empty) {
      pulled = true;
      const remoteCircuits = circSnap.docs.map((d) => d.data() as Circuit);
      const localCircuits = await db.circuits.toArray();
      const localMap = new Map(localCircuits.map((c) => [c.uid, c]));

      for (const remote of remoteCircuits) {
        const local = localMap.get(remote.uid);
        if (!local) {
          await db.circuits.add({ ...remote } as Circuit);
        } else if (remote.createdAt > local.createdAt) {
          await db.circuits.update(local.id!, stripId(remote));
        }
        localMap.delete(remote.uid);
      }
      for (const [, local] of localMap) {
        await syncDocToCloud('circuits', local.uid, stripId(local) as Record<string, unknown>);
      }
    }

    // ── Products ──
    const prodSnap = await getDocs(collection(firestore, 'products'));
    if (!prodSnap.empty) {
      pulled = true;
      const remoteProducts = prodSnap.docs.map((d) => d.data() as Product);
      const localProducts = await db.products.toArray();
      const localMap = new Map(localProducts.map((p) => [p.uid, p]));

      for (const remote of remoteProducts) {
        const local = localMap.get(remote.uid);
        if (!local) {
          await db.products.add({ ...remote } as Product);
        } else if (remote.updatedAt > local.updatedAt) {
          await db.products.update(local.id!, stripId(remote));
        }
        localMap.delete(remote.uid);
      }
      for (const [, local] of localMap) {
        await syncDocToCloud('products', local.uid, stripId(local) as Record<string, unknown>);
      }
    }

    // ── Stock Movements ──
    const smSnap = await getDocs(collection(firestore, 'stockMovements'));
    if (!smSnap.empty) {
      pulled = true;
      const remoteMovements = smSnap.docs.map((d) => d.data() as StockMovement);
      const localMovements = await db.stockMovements.toArray();
      const localMap = new Map(localMovements.map((m) => [m.uid, m]));

      for (const remote of remoteMovements) {
        if (!localMap.has(remote.uid)) {
          await db.stockMovements.add({ ...remote } as StockMovement);
        }
        localMap.delete(remote.uid);
      }
      for (const [, local] of localMap) {
        await syncDocToCloud('stockMovements', local.uid, stripId(local) as Record<string, unknown>);
      }
    }

    console.log('[Sync] Cloud pull complete.');
    return pulled;
  } catch (e) {
    console.warn('[Sync] Pull from cloud failed:', e);
    return false;
  }
}

// ── Push all local data to Firestore (after first seed) ──

export async function pushAllToCloud() {

  try {
    console.log('[Sync] Pushing all local data to cloud...');

    const transactions = await db.transactions.toArray();
    await batchPush('transactions', transactions);

    const circuits = await db.circuits.toArray();
    await batchPush('circuits', circuits);

    const products = await db.products.toArray();
    await batchPush('products', products);

    const stockMovements = await db.stockMovements.toArray();
    await batchPush('stockMovements', stockMovements);

    const events = await db.events.toArray();
    await batchPush('events', events);

    console.log('[Sync] All local data pushed to cloud.');
  } catch (e) {
    console.warn('[Sync] Push all to cloud failed:', e);
  }
}
