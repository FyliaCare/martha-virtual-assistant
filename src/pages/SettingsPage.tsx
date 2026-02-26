// ============================================================
// Settings Page — App preferences, data management, about
// ============================================================

import { useState } from 'react';
import type { ComponentType } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Trash2,
  Info,
  HelpCircle,
  Heart,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useMarthaStore } from '../store/useMarthaStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { db } from '../db/database';
import { seedDatabase } from '../db/seed';
import { APP_NAME, ORGANIZATION_NAME } from '../utils/constants';

export default function SettingsPage() {
  const { speak } = useMarthaStore();
  const { loadAll } = useTransactionStore();
  const { loadCircuits } = useCircuitStore();
  const { loadProducts, loadMovements } = useInventoryStore();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // ---- Export all data as JSON ----
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        transactions: await db.transactions.toArray(),
        circuits: await db.circuits.toArray(),
        products: await db.products.toArray(),
        stockMovements: await db.stockMovements.toArray(),
        events: await db.events.toArray(),
        documents: await db.documents.toArray(),
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `martha-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);

      speak('All data exported successfully! Keep this backup safe.', 'thumbsup');
    } catch (e) {
      speak('Failed to export data. Please try again.', 'warning');
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  // ---- Import from JSON backup ----
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.version || !data.transactions) {
          speak('Invalid backup file. Please use a Martha backup.', 'warning');
          return;
        }

        // Clear existing and import
        await db.transactions.clear();
        await db.circuits.clear();
        await db.products.clear();
        await db.stockMovements.clear();
        await db.events.clear();
        await db.documents.clear();

        if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions);
        if (data.circuits?.length) await db.circuits.bulkAdd(data.circuits);
        if (data.products?.length) await db.products.bulkAdd(data.products);
        if (data.stockMovements?.length) await db.stockMovements.bulkAdd(data.stockMovements);
        if (data.events?.length) await db.events.bulkAdd(data.events);
        if (data.documents?.length) await db.documents.bulkAdd(data.documents);

        // Reload stores
        await loadAll();
        await loadCircuits();
        await loadProducts();
        await loadMovements();

        speak('Data imported successfully! All your records have been restored.', 'celebrating');
      } catch (err) {
        speak('Failed to import data. The file may be corrupted.', 'warning');
        console.error(err);
      } finally {
        setIsImporting(false);
      }
    };
    input.click();
  };

  // ---- Delete all data ----
  const handleDeleteAll = async () => {
    try {
      await db.transactions.clear();
      await db.circuits.clear();
      await db.products.clear();
      await db.stockMovements.clear();
      await db.events.clear();
      await db.documents.clear();

      // Re-seed defaults
      await seedDatabase();

      await loadAll();
      await loadCircuits();
      await loadProducts();
      await loadMovements();

      speak('All data has been cleared. Default circuits and products have been restored.', 'presenting');
      setShowDeleteConfirm(false);
    } catch (e) {
      speak('Failed to clear data. Please try again.', 'warning');
      console.error(e);
    }
  };

  interface SettingItem {
    icon: ComponentType<Record<string, unknown>>;
    label: string;
    description: string;
    action: () => void;
    loading?: boolean;
    danger?: boolean;
  }

  const settingsSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Data Management',
      items: [
        {
          icon: Download,
          label: 'Export Backup',
          description: 'Download all data as JSON',
          action: handleExport,
          loading: isExporting,
        },
        {
          icon: Upload,
          label: 'Import Backup',
          description: 'Restore from a backup file',
          action: handleImport,
          loading: isImporting,
        },
        {
          icon: Trash2,
          label: 'Clear All Data',
          description: 'Delete everything and start fresh',
          action: () => setShowDeleteConfirm(true),
          danger: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: Info,
          label: 'About Martha',
          description: `v1.0.0 • ${ORGANIZATION_NAME}`,
          action: () => setShowAbout(true),
        },
        {
          icon: HelpCircle,
          label: 'Help & Guide',
          description: 'How to use Martha',
          action: () => speak("I'm here to help! Just navigate through the app — I'll guide you on every page.", 'greeting'),
        },
      ],
    },
  ];

  return (
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold text-navy">Settings</h1>
        <p className="text-xs text-text-secondary">Manage your data and preferences</p>
      </div>

      {/* Martha */}
      <div className="mb-6">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 px-1">
            {section.title}
          </h2>
          <Card>
            {section.items.map((item, ii) => (
              <motion.button
                key={item.label}
                whileTap={{ scale: 0.99 }}
                onClick={item.action}
                disabled={item.loading}
                className={`w-full flex items-center gap-3 p-4 transition-colors ${
                  ii < section.items.length - 1 ? 'border-b border-border/30' : ''
                } ${item.danger ? 'text-alert' : 'text-text-primary'}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    item.danger ? 'bg-alert/10' : 'bg-navy/5'
                  }`}
                >
                  <item.icon size={16} className={item.danger ? 'text-alert' : 'text-navy'} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[10px] text-text-secondary">{item.description}</p>
                </div>
                {item.loading && (
                  <div className="w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                )}
              </motion.button>
            ))}
          </Card>
        </div>
      ))}

      {/* App Version */}
      <div className="text-center py-4">
        <p className="text-[10px] text-text-light">
          {APP_NAME} v1.0.0
        </p>
        <p className="text-[10px] text-text-light flex items-center justify-center gap-1 mt-0.5">
          Built with <Heart size={8} className="text-alert" /> for {ORGANIZATION_NAME}
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Clear All Data?"
      >
        <div className="space-y-4">
          <div className="p-4 bg-alert/5 rounded-xl border border-alert/20">
            <p className="text-sm text-text-primary mb-2">
              This will permanently delete:
            </p>
            <ul className="space-y-1">
              <li className="text-xs text-text-secondary">• All transactions</li>
              <li className="text-xs text-text-secondary">• All stock movements</li>
              <li className="text-xs text-text-secondary">• All generated documents</li>
            </ul>
            <p className="text-xs text-text-secondary mt-2">
              Default circuits and products will be restored.
            </p>
          </div>
          <p className="text-xs text-alert font-semibold">
            This action cannot be undone. Consider exporting a backup first.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="lg" className="flex-1" onClick={handleDeleteAll}>
              <Trash2 size={14} className="mr-1" />
              Delete All
            </Button>
          </div>
        </div>
      </Modal>

      {/* About Modal */}
      <Modal isOpen={showAbout} onClose={() => setShowAbout(false)} title="About Martha">
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 bg-navy rounded-2xl mx-auto flex items-center justify-center">
            <span className="text-2xl font-bold text-gold">M</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy">{APP_NAME}</h3>
            <p className="text-xs text-text-secondary">Version 1.0.0</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Martha is your virtual financial assistant for {ORGANIZATION_NAME}. 
            She helps you manage receipts, payments, circuits, inventory, 
            and generate beautiful reports — all from your phone.
          </p>
          <div className="pt-2 border-t border-border/30">
            <p className="text-[10px] text-text-light">
              Offline-first PWA • Data stored on your device
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
