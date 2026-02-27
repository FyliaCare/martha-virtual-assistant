// ============================================================
// Transaction Detail Modal — View, Edit & Delete a transaction
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Pencil,
  Trash2,
  Check,
  Calendar,
  FileText,
  Hash,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import type { Transaction, TransactionType, TransactionCategory, Quarter } from '../../types';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCircuitStore } from '../../store/useCircuitStore';
import { formatCurrency, getQuarterFromDate } from '../../utils/helpers';
import { RECEIPT_CATEGORIES, PAYMENT_CATEGORIES, QUARTER_LABELS } from '../../utils/constants';
import Input, { AmountInput } from './Input';
import Select from './Select';
import Button from './Button';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'view' | 'edit' | 'delete-confirm';

export default function TransactionDetailModal({
  transaction,
  isOpen,
  onClose,
}: TransactionDetailModalProps) {
  const { updateTransaction, deleteTransaction } = useTransactionStore();
  const { circuits } = useCircuitStore();

  const [mode, setMode] = useState<Mode>('view');
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [txnType, setTxnType] = useState<TransactionType>('receipt');
  const [circuitId, setCircuitId] = useState('');
  const [notes, setNotes] = useState('');

  // Sync form state when transaction changes
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(String(transaction.amount));
      setDate(transaction.date);
      setCategory(transaction.category);
      setTxnType(transaction.type);
      setCircuitId(transaction.circuitId || '');
      setNotes(transaction.notes || '');
      setMode('view');
    }
  }, [transaction]);

  if (!transaction) return null;

  const categories = txnType === 'receipt' ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES;
  const getCategoryLabel = (val: string) =>
    [...RECEIPT_CATEGORIES, ...PAYMENT_CATEGORIES].find((c) => c.value === val)?.label ?? val;
  const getCircuitName = (id: string) =>
    circuits.find((c) => c.uid === id)?.name ?? '';

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const parsedAmount = parseFloat(amount);
      if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0 || !date) {
        setSaving(false);
        return;
      }

      const quarter = getQuarterFromDate(date) as Quarter;
      const year = new Date(date).getFullYear();

      await updateTransaction(transaction.uid, {
        description: description.trim(),
        amount: parsedAmount,
        date,
        type: txnType,
        category: category as TransactionCategory,
        circuitId: circuitId || undefined,
        notes: notes.trim() || undefined,
        quarter,
        year,
      });

      setMode('view');
    } catch (e) {
      console.error('Failed to update transaction', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await deleteTransaction(transaction.uid);
      onClose();
    } catch (e) {
      console.error('Failed to delete transaction', e);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setMode('view');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-overlay z-50"
            onClick={handleClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto max-w-lg mx-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
              <h2 className="text-lg font-bold text-navy">
                {mode === 'view' && 'Transaction Details'}
                {mode === 'edit' && 'Edit Transaction'}
                {mode === 'delete-confirm' && 'Delete Transaction'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-cream-dark transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 pb-8">
              {/* ======================== VIEW MODE ======================== */}
              {mode === 'view' && (
                <div className="space-y-4">
                  {/* Type + Amount header */}
                  <div className="flex items-center gap-3 pb-3 border-b border-border/30">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        transaction.type === 'receipt'
                          ? 'bg-success-light text-success'
                          : 'bg-alert-light text-alert'
                      }`}
                    >
                      {transaction.type === 'receipt' ? (
                        <ArrowUpRight size={22} />
                      ) : (
                        <ArrowDownRight size={22} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-bold text-text-primary">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-text-secondary capitalize">
                        {transaction.type} • {getCategoryLabel(transaction.category)}
                      </p>
                    </div>
                    <p
                      className={`text-xl font-bold font-mono ${
                        transaction.type === 'receipt' ? 'text-success' : 'text-alert'
                      }`}
                    >
                      {transaction.type === 'receipt' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>

                  {/* Detail rows */}
                  <div className="space-y-3">
                    <DetailRow
                      icon={<Calendar size={16} />}
                      label="Date"
                      value={new Date(transaction.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    />
                    <DetailRow
                      icon={<Tag size={16} />}
                      label="Category"
                      value={getCategoryLabel(transaction.category)}
                    />
                    <DetailRow
                      icon={<Hash size={16} />}
                      label="Quarter"
                      value={`Q${transaction.quarter} ${transaction.year} — ${QUARTER_LABELS[transaction.quarter]}`}
                    />
                    {transaction.circuitId && (
                      <DetailRow
                        icon={<FileText size={16} />}
                        label="Circuit"
                        value={getCircuitName(transaction.circuitId) || transaction.circuitId}
                      />
                    )}
                    {transaction.notes && (
                      <DetailRow
                        icon={<FileText size={16} />}
                        label="Notes"
                        value={transaction.notes}
                      />
                    )}
                  </div>

                  {/* Items list */}
                  {transaction.items && transaction.items.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                        Items
                      </p>
                      <div className="space-y-1.5">
                        {transaction.items.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2 bg-cream rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium text-text-primary">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-text-secondary">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <p className="text-sm font-bold font-mono text-navy">
                              {formatCurrency(item.total)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-3">
                    <Button
                      variant="gold"
                      size="md"
                      fullWidth
                      icon={<Pencil size={16} />}
                      onClick={() => setMode('edit')}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      icon={<Trash2 size={16} />}
                      onClick={() => setMode('delete-confirm')}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              {/* ======================== EDIT MODE ======================== */}
              {mode === 'edit' && (
                <div className="space-y-4">
                  {/* Type toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['receipt', 'payment'] as TransactionType[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            setTxnType(t);
                            setCategory('');
                          }}
                          className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            txnType === t
                              ? t === 'receipt'
                                ? 'bg-success text-white'
                                : 'bg-alert text-white'
                              : 'bg-cream-dark text-text-secondary'
                          }`}
                        >
                          {t === 'receipt' ? '↗ Receipt' : '↘ Payment'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <Select
                    label="Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                    options={categories.map((c) => ({ value: c.value, label: c.label }))}
                    placeholder="Select category..."
                  />

                  {/* Description */}
                  <Input
                    label="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this transaction for?"
                    icon={<FileText size={16} />}
                  />

                  {/* Amount */}
                  <AmountInput
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />

                  {/* Date */}
                  <Input
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    icon={<Calendar size={16} />}
                  />

                  {/* Circuit */}
                  <Select
                    label="Circuit (optional)"
                    value={circuitId}
                    onChange={(e) => setCircuitId(e.target.value)}
                    options={[
                      { value: '', label: 'None' },
                      ...circuits.map((c) => ({ value: c.uid, label: c.name })),
                    ]}
                    placeholder="Select circuit..."
                  />

                  {/* Notes */}
                  <div className="w-full">
                    <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes..."
                      rows={2}
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="gold"
                      size="md"
                      fullWidth
                      icon={<Check size={16} />}
                      onClick={handleSave}
                      loading={saving}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        // Reset form to original values
                        if (transaction) {
                          setDescription(transaction.description);
                          setAmount(String(transaction.amount));
                          setDate(transaction.date);
                          setCategory(transaction.category);
                          setTxnType(transaction.type);
                          setCircuitId(transaction.circuitId || '');
                          setNotes(transaction.notes || '');
                        }
                        setMode('view');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* ======================== DELETE CONFIRM ======================== */}
              {mode === 'delete-confirm' && (
                <div className="space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-alert-light mx-auto flex items-center justify-center">
                    <AlertTriangle size={28} className="text-alert" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-text-primary mb-1">
                      Are you sure?
                    </p>
                    <p className="text-sm text-text-secondary">
                      This will permanently delete this transaction. This action cannot be undone.
                    </p>
                  </div>

                  <div className="p-3 bg-cream rounded-xl text-left">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-text-secondary">
                      {transaction.type === 'receipt' ? '+' : '-'}
                      {formatCurrency(transaction.amount)} •{' '}
                      {new Date(transaction.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="danger"
                      size="md"
                      fullWidth
                      icon={<Trash2 size={16} />}
                      onClick={handleDelete}
                      loading={saving}
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      fullWidth
                      onClick={() => setMode('view')}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---- Helper component for detail rows ----
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-text-secondary shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-text-primary">{value}</p>
      </div>
    </div>
  );
}
