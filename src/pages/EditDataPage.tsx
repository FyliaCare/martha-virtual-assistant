// ============================================================
// Edit Data Page — View, search, edit & delete all transactions
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  X,
  Calendar,
  Save,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input, { AmountInput } from '../components/ui/Input';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, formatDate, getQuarterFromDate } from '../utils/helpers';
import { ALL_CATEGORIES, RECEIPT_CATEGORIES, PAYMENT_CATEGORIES } from '../utils/constants';
import type { Transaction, TransactionType, TransactionCategory, Quarter } from '../types';

export default function EditDataPage() {
  const navigate = useNavigate();
  const { transactions, loading, loadAll, updateTransaction, deleteTransaction } = useTransactionStore();
  const { circuits, loadCircuits } = useCircuitStore();
  const { speak } = useMarthaStore();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receipt' | 'payment'>('all');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');

  // Edit state
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    date: '',
    type: 'receipt' as TransactionType,
    category: '' as TransactionCategory | '',
    circuitId: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteUid, setDeleteUid] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
    loadCircuits();
    speak('Here you can view and edit all your data. Tap the pencil icon to fix any errors.', 'presenting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Available years
  const yearOptions = useMemo(() => {
    const years = new Set(transactions.map((t) => t.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filtered & searched transactions
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType);
    }
    if (filterQuarter !== 'all') {
      result = result.filter((t) => t.quarter === parseInt(filterQuarter));
    }
    if (filterYear !== 'all') {
      result = result.filter((t) => t.year === parseInt(filterYear));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          t.notes?.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      );
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterQuarter, filterYear, search]);

  const getCategoryLabel = (val: string) =>
    ALL_CATEGORIES.find((c) => c.value === val)?.label ?? val;

  const getCircuitName = (id: string) =>
    circuits.find((c) => c.uid === id)?.name ?? '';

  // Start editing a transaction
  const startEdit = (txn: Transaction) => {
    setEditingUid(txn.uid);
    setEditForm({
      description: txn.description,
      amount: String(txn.amount),
      date: txn.date,
      type: txn.type,
      category: txn.category,
      circuitId: txn.circuitId || '',
      notes: txn.notes || '',
    });
  };

  const cancelEdit = () => {
    setEditingUid(null);
  };

  const handleSave = async () => {
    if (saving || !editingUid) return;
    const parsedAmount = parseFloat(editForm.amount);
    if (!editForm.description.trim() || isNaN(parsedAmount) || parsedAmount < 0 || !editForm.date || !editForm.category) {
      speak('Please fill in all required fields correctly.', 'warning');
      return;
    }

    setSaving(true);
    try {
      const quarter = getQuarterFromDate(editForm.date) as Quarter;
      const year = new Date(editForm.date).getFullYear();

      await updateTransaction(editingUid, {
        description: editForm.description.trim(),
        amount: parsedAmount,
        date: editForm.date,
        type: editForm.type,
        category: editForm.category as TransactionCategory,
        circuitId: editForm.circuitId || undefined,
        notes: editForm.notes.trim() || undefined,
        quarter,
        year,
      });

      setEditingUid(null);
      speak('Saved! The record has been updated.', 'thumbsup');
    } catch (e) {
      console.error('Failed to update', e);
      speak('Failed to save. Please try again.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUid || saving) return;
    setSaving(true);
    try {
      await deleteTransaction(deleteUid);
      setDeleteUid(null);
      setEditingUid(null);
      speak('Transaction deleted.', 'thumbsup');
    } catch (e) {
      console.error('Failed to delete', e);
      speak('Failed to delete. Please try again.', 'warning');
    } finally {
      setSaving(false);
    }
  };

  const editCategories = editForm.type === 'receipt' ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES;

  return (
    <div className="pb-24 px-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <div className="text-right">
            <p className="text-xs text-text-secondary">{filtered.length} records</p>
          </div>
        </div>
        <h1 className="text-xl font-bold text-navy">Edit Data</h1>
        <p className="text-xs text-text-secondary mt-1">
          View, search & correct any transaction. Tap the pencil to edit.
        </p>
      </div>

      {/* Martha */}
      <div className="mb-4">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Search by description, notes, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={16} />}
        />
      </div>

      {/* Filters */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={14} className="text-text-secondary" />
          <span className="text-xs font-semibold text-text-secondary">Filters</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'receipt' | 'payment')}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'receipt', label: 'Receipts' },
              { value: 'payment', label: 'Payments' },
            ]}
          />
          <Select
            value={filterQuarter}
            onChange={(e) => setFilterQuarter(e.target.value)}
            options={[
              { value: 'all', label: 'All Quarters' },
              { value: '1', label: 'Q1' },
              { value: '2', label: 'Q2' },
              { value: '3', label: 'Q3' },
              { value: '4', label: 'Q4' },
            ]}
          />
          <Select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            options={[
              { value: 'all', label: 'All Years' },
              ...yearOptions.map((y) => ({ value: String(y), label: String(y) })),
            ]}
          />
        </div>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card className="p-8 text-center">
          <FileText size={32} className="mx-auto text-text-light mb-3" />
          <p className="text-sm text-text-secondary mb-1">No transactions found</p>
          <p className="text-xs text-text-light">Try adjusting your search or filters</p>
        </Card>
      )}

      {/* Transaction list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.map((txn) => (
            <motion.div
              key={txn.uid}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {editingUid === txn.uid ? (
                /* ═══════════ EDIT MODE ═══════════ */
                <Card className="p-4 border-2 border-gold/40">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                      <Pencil size={14} />
                      Editing Transaction
                    </h3>
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-gray-100">
                      <X size={16} className="text-text-secondary" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Type toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setEditForm((f) => ({
                            ...f,
                            type: 'receipt',
                            category: '' as TransactionCategory | '',
                          }))
                        }
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          editForm.type === 'receipt'
                            ? 'bg-success/10 text-success border-2 border-success/30'
                            : 'bg-gray-50 text-text-secondary border-2 border-transparent'
                        }`}
                      >
                        <ArrowUpRight size={14} className="inline mr-1" />
                        Receipt
                      </button>
                      <button
                        onClick={() =>
                          setEditForm((f) => ({
                            ...f,
                            type: 'payment',
                            category: '' as TransactionCategory | '',
                          }))
                        }
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                          editForm.type === 'payment'
                            ? 'bg-alert/10 text-alert border-2 border-alert/30'
                            : 'bg-gray-50 text-text-secondary border-2 border-transparent'
                        }`}
                      >
                        <ArrowDownRight size={14} className="inline mr-1" />
                        Payment
                      </button>
                    </div>

                    {/* Description */}
                    <Input
                      label="Description"
                      value={editForm.description}
                      onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="What was this for?"
                    />

                    {/* Amount & Date row */}
                    <div className="grid grid-cols-2 gap-2">
                      <AmountInput
                        label="Amount"
                        value={editForm.amount}
                        onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                      />
                      <Input
                        label="Date"
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                        icon={<Calendar size={14} />}
                      />
                    </div>

                    {/* Category */}
                    <Select
                      label="Category"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm((f) => ({
                          ...f,
                          category: e.target.value as TransactionCategory,
                        }))
                      }
                      options={editCategories.map((c) => ({ value: c.value, label: c.label }))}
                      placeholder="Select category..."
                    />

                    {/* Circuit */}
                    <Select
                      label="Circuit (optional)"
                      value={editForm.circuitId}
                      onChange={(e) => setEditForm((f) => ({ ...f, circuitId: e.target.value }))}
                      options={[
                        { value: '', label: 'No circuit' },
                        ...circuits.map((c) => ({ value: c.uid, label: c.name })),
                      ]}
                      placeholder="Select circuit..."
                    />

                    {/* Notes */}
                    <Input
                      label="Notes (optional)"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder="Additional notes..."
                    />

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteUid(txn.uid)}
                        className="shrink-0"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                      <div className="flex-1" />
                      <Button variant="secondary" size="sm" onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Save size={14} className="mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                /* ═══════════ VIEW MODE ═══════════ */
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Type icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        txn.type === 'receipt'
                          ? 'bg-success/10 text-success'
                          : 'bg-alert/10 text-alert'
                      }`}
                    >
                      {txn.type === 'receipt' ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {txn.description}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {formatDate(txn.date)} &bull; {getCategoryLabel(txn.category)}
                        {txn.circuitId ? ` • ${getCircuitName(txn.circuitId)}` : ''}
                      </p>
                      {txn.notes && (
                        <p className="text-[9px] text-text-light mt-0.5 truncate">
                          {txn.notes}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <p
                      className={`text-sm font-bold font-mono shrink-0 ${
                        txn.type === 'receipt' ? 'text-success' : 'text-alert'
                      }`}
                    >
                      {txn.type === 'receipt' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </p>

                    {/* Edit button */}
                    <button
                      onClick={() => startEdit(txn)}
                      className="p-2 rounded-lg hover:bg-gold/10 transition-colors shrink-0"
                      title="Edit this transaction"
                    >
                      <Pencil size={14} className="text-gold" />
                    </button>
                  </div>
                </Card>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteUid && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-overlay z-50"
              onClick={() => setDeleteUid(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <Card className="p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-alert/10 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-alert" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-navy">Delete Transaction?</h3>
                    <p className="text-xs text-text-secondary">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" size="sm" onClick={() => setDeleteUid(null)}>
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
