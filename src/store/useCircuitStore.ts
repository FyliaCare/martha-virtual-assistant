// ============================================================
// Circuit Store — Zustand + Dexie
// ============================================================

import { create } from 'zustand';
import { db } from '../db/database';
import { syncDocToCloud, deleteDocFromCloud } from '../db/sync';
import type { Circuit } from '../types';
import { generateId, now } from '../utils/helpers';

interface CircuitStore {
  circuits: Circuit[];
  loading: boolean;
  loadCircuits: () => Promise<void>;
  addCircuit: (data: Omit<Circuit, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateCircuit: (uid: string, data: Partial<Circuit>) => Promise<void>;
  deleteCircuit: (uid: string) => Promise<void>;
  getCircuitByUid: (uid: string) => Circuit | undefined;
}

export const useCircuitStore = create<CircuitStore>((set, get) => ({
  circuits: [],
  loading: false,

  loadCircuits: async () => {
    set({ loading: true });
    const circuits = await db.circuits.toArray();
    set({ circuits, loading: false });
  },

  addCircuit: async (data) => {
    const circuit: Circuit = {
      ...data,
      uid: generateId(),
      createdAt: now(),
    };
    await db.circuits.add(circuit);
    syncDocToCloud('circuits', circuit.uid, { ...circuit, id: undefined });
    await get().loadCircuits();
  },

  updateCircuit: async (uid, data) => {
    const existing = await db.circuits.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.circuits.update(existing.id, data);
      const full = await db.circuits.where('uid').equals(uid).first();
      if (full) syncDocToCloud('circuits', uid, { ...full, id: undefined });
      await get().loadCircuits();
    }
  },

  getCircuitByUid: (uid) => get().circuits.find((c) => c.uid === uid),

  deleteCircuit: async (uid) => {
    const existing = await db.circuits.where('uid').equals(uid).first();
    if (existing?.id) {
      await db.circuits.delete(existing.id);
      deleteDocFromCloud('circuits', uid);
      await get().loadCircuits();
    }
  },
}));
