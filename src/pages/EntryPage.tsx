// ============================================================
// Entry Page — Guided transaction entry with Martha assistance
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Hash,
  FileText,
  Tag,
  Package,
  Plus,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Input, { AmountInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import MarthaAssistant from '../components/martha/MarthaAssistant';

import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';

import { RECEIPT_CATEGORIES, PAYMENT_CATEGORIES } from '../utils/constants';
import {
  toISODate,
  getQuarterFromDate,
  formatCurrency,
} from '../utils/helpers';
import type { TransactionType, TransactionCategory, TransactionItem, Quarter } from '../types';

// ---- Step definitions ----
type Step = 'type' | 'category' | 'details' | 'review';
const STEPS: Step[] = ['type', 'category', 'details', 'review'];

export default function EntryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addTransaction } = useTransactionStore();
  const { circuits, loadCircuits } = useCircuitStore();
  const { products, loadProducts, addStockMovement } = useInventoryStore();
  const { speak } = useMarthaStore();

  // Form state
  const [step, setStep] = useState<Step>('type');
  const [txnType, setTxnType] = useState<TransactionType>('receipt');
  const [category, setCategory] = useState<TransactionCategory | ''>('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [circuitId, setCircuitId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);

  // Item entry state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQty, setItemQty] = useState('');
  const [itemPrice, setItemPrice] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCircuits();
    loadProducts();

    // Handle pre-set type from URL
    const presetType = searchParams.get('type');
    if (presetType === 'receipt' || presetType === 'payment') {
      setTxnType(presetType);
      setCategory(''); // reset category when type is pre-set
    }

    speak("Let's record a new transaction. First, is this a receipt or a payment?", 'clipboard');
  }, []);

  const categories = txnType === 'receipt' ? RECEIPT_CATEGORIES : PAYMENT_CATEGORIES;

  const currentStepIndex = STEPS.indexOf(step);

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) {
      setStep(STEPS[idx + 1]);
    }
  }, [step]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) {
      setStep(STEPS[idx - 1]);
    } else {
      navigate(-1);
    }
  }, [step, navigate]);

  // ---- Validate current step ----
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'category') {
      if (!category) newErrors.category = 'Please select a category';
    }

    if (step === 'details') {
      if (!description.trim()) newErrors.description = 'Please enter a description';
      if (!amount || parseFloat(amount) <= 0) {
        const isMerchandise = category === 'merchandise_sale' || category === 'merchandise_purchase';
        newErrors.amount = isMerchandise ? 'Add at least one item first' : 'Please enter a valid amount';
      }
      if (!date) newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step === 'type') {
        speak(
          txnType === 'receipt'
            ? "Great, a receipt! Now choose what kind of income this is."
            : "A payment. Let's categorise this expense.",
          'presenting'
        );
      }
      if (step === 'category') {
        speak(
          "Now fill in the details — description, amount, and date. I'll help you review it.",
          'clipboard'
        );
      }
      if (step === 'details') {
        speak(
          "Here's a summary of your entry. Please review everything before saving.",
          'thinking'
        );
      }
      goNext();
    }
  };

  // ---- Add item (for merchandise) ----
  const handleAddItem = () => {
    const product = products.find((p) => p.uid === selectedProduct);
    if (!product) return;

    const qty = parseInt(itemQty) || 0;
    const price = parseFloat(itemPrice) || 0;
    if (qty <= 0 || price <= 0) return;

    const newItem: TransactionItem = {
      productId: product.uid,
      productName: product.name,
      quantity: qty,
      unitPrice: price,
      total: qty * price,
    };

    setItems((prev) => [...prev, newItem]);

    // Auto sum
    const newTotal = [...items, newItem].reduce((sum, it) => sum + it.total, 0);
    setAmount(newTotal.toFixed(2));

    setSelectedProduct('');
    setItemQty('');
    setItemPrice('');
    setShowItemModal(false);
  };

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    const newTotal = next.reduce((sum, it) => sum + it.total, 0);
    setAmount(newTotal > 0 ? newTotal.toFixed(2) : '');
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const quarter = getQuarterFromDate(date) as Quarter;
      const year = new Date(date).getFullYear();

      await addTransaction({
        date,
        type: txnType,
        category: category as TransactionCategory,
        description,
        amount: parseFloat(amount),
        circuitId: circuitId || undefined,
        quarter,
        year,
        items: items.length > 0 ? items : undefined,
        notes: notes || undefined,
      });

      // Create stock movements for items
      if (items.length > 0) {
        for (const item of items) {
          await addStockMovement({
            productId: item.productId,
            type: txnType === 'receipt' ? 'sale' : 'purchase',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            circuitId: circuitId || undefined,
            date,
            quarter,
            year,
          });
        }
      }

      speak("Transaction saved successfully! Great job keeping those records up to date.", 'celebrating');
      setShowSuccess(true);

      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (e) {
      speak('Something went wrong while saving. Please try again.', 'warning');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Category label lookup
  const getCategoryLabel = (val: string) =>
    [...RECEIPT_CATEGORIES, ...PAYMENT_CATEGORIES].find((c) => c.value === val)?.label ?? val;

  // Is merchandise category?
  const isMerchandise =
    category === 'merchandise_sale' || category === 'merchandise_purchase';

  return (
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header with Progress */}
      <div className="pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-border/50">
            <ChevronLeft size={18} className="text-navy" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-navy">New Entry</h1>
            <p className="text-[10px] text-text-secondary">
              Step {currentStepIndex + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s}
              className={`h-1 rounded-full flex-1 ${
                i <= currentStepIndex ? 'bg-gold' : 'bg-border'
              }`}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccess ? (
          <SuccessScreen />
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 1: Type Selection */}
            {step === 'type' && (
              <div className="space-y-4">
                <MarthaAssistant size="sm" layout="horizontal" />

                <h2 className="text-sm font-bold text-navy">What type of transaction?</h2>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setTxnType('receipt'); setCategory(''); }}
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      txnType === 'receipt'
                        ? 'border-success bg-success/5'
                        : 'border-border bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          txnType === 'receipt'
                            ? 'bg-success text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <ArrowUpRight size={22} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-text-primary">Receipt</p>
                        <p className="text-[10px] text-text-secondary">Money In</p>
                      </div>
                    </div>
                    {txnType === 'receipt' && (
                      <motion.div
                        layoutId="type-check"
                        className="absolute top-2 right-2 w-5 h-5 bg-success text-white rounded-full flex items-center justify-center"
                      >
                        <Check size={12} />
                      </motion.div>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => { setTxnType('payment'); setCategory(''); }}
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      txnType === 'payment'
                        ? 'border-alert bg-alert/5'
                        : 'border-border bg-white'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          txnType === 'payment'
                            ? 'bg-alert text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <ArrowDownRight size={22} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-text-primary">Payment</p>
                        <p className="text-[10px] text-text-secondary">Money Out</p>
                      </div>
                    </div>
                    {txnType === 'payment' && (
                      <motion.div
                        layoutId="type-check"
                        className="absolute top-2 right-2 w-5 h-5 bg-alert text-white rounded-full flex items-center justify-center"
                      >
                        <Check size={12} />
                      </motion.div>
                    )}
                  </motion.button>
                </div>

                <Button variant="primary" size="lg" className="w-full mt-4" onClick={handleNext}>
                  Continue
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: Category Selection */}
            {step === 'category' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-navy">
                  {txnType === 'receipt' ? 'Income Category' : 'Expense Category'}
                </h2>

                <div className="space-y-2">
                  {categories.map((cat) => (
                    <motion.button
                      key={cat.value}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCategory(cat.value)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                        category === cat.value
                          ? txnType === 'receipt'
                            ? 'border-success bg-success/5'
                            : 'border-alert bg-alert/5'
                          : 'border-border bg-white'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          category === cat.value
                            ? txnType === 'receipt'
                              ? 'bg-success text-white'
                              : 'bg-alert text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        <Tag size={16} />
                      </div>
                      <span className="text-sm font-medium text-text-primary">{cat.label}</span>
                      {category === cat.value && (
                        <Check size={16} className="ml-auto text-success" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {errors.category && (
                  <p className="text-xs text-alert">{errors.category}</p>
                )}

                <Button variant="primary" size="lg" className="w-full mt-4" onClick={handleNext}>
                  Continue
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 'details' && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-navy">Transaction Details</h2>

                <Input
                  label="Description"
                  placeholder={
                    txnType === 'receipt'
                      ? 'e.g. Hamburg circuit contribution'
                      : 'e.g. Bus tickets for retreat'
                  }
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  icon={<FileText size={16} />}
                  error={errors.description}
                />

                {!isMerchandise && (
                  <AmountInput
                    label="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    error={errors.amount}
                  />
                )}

                <Input
                  label="Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  icon={<Calendar size={16} />}
                  error={errors.date}
                />

                <Select
                  label="Circuit (optional)"
                  value={circuitId}
                  onChange={(e) => setCircuitId(e.target.value)}
                  options={[
                    { value: '', label: 'No circuit' },
                    ...circuits.map((c) => ({ value: c.uid, label: c.name })),
                  ]}
                />

                {/* Merchandise Items */}
                {isMerchandise && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-navy">Items</label>
                      <button
                        onClick={() => setShowItemModal(true)}
                        className="text-xs text-gold-dark font-medium flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Item
                      </button>
                    </div>

                    {items.length === 0 ? (
                      <Card className="p-4 text-center">
                        <Package size={20} className="mx-auto text-text-light mb-1" />
                        <p className="text-xs text-text-secondary">No items added yet</p>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item, i) => (
                          <Card key={i} className="p-3 flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {item.productName}
                              </p>
                              <p className="text-[10px] text-text-secondary">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                            </div>
                            <p className="text-sm font-bold font-mono text-navy">
                              {formatCurrency(item.total)}
                            </p>
                            <button
                              onClick={() => removeItem(i)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-alert/10 text-alert"
                            >
                              <Trash2 size={14} />
                            </button>
                          </Card>
                        ))}
                        <div className="flex items-center justify-between px-1 pt-1">
                          <span className="text-xs font-semibold text-text-secondary">Total</span>
                          <span className="text-sm font-bold font-mono text-navy">
                            {formatCurrency(parseFloat(amount) || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {!amount && (
                      <p className="text-xs text-alert mt-1">{errors.amount || 'Add items to set the amount'}</p>
                    )}
                  </div>
                )}

                <Input
                  label="Notes (optional)"
                  placeholder="Any additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  icon={<Hash size={16} />}
                />

                <Button variant="primary" size="lg" className="w-full mt-4" onClick={handleNext}>
                  Review Entry
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 'review' && (
              <div className="space-y-4">
                <MarthaAssistant size="sm" layout="horizontal" />

                <h2 className="text-sm font-bold text-navy">Review & Confirm</h2>

                <Card className="p-4 space-y-3">
                  <ReviewRow
                    label="Type"
                    value={txnType === 'receipt' ? 'Receipt (Money In)' : 'Payment (Money Out)'}
                    color={txnType === 'receipt' ? 'text-success' : 'text-alert'}
                  />
                  <ReviewRow label="Category" value={getCategoryLabel(category)} />
                  <ReviewRow label="Description" value={description} />
                  <ReviewRow
                    label="Amount"
                    value={formatCurrency(parseFloat(amount) || 0)}
                    color={txnType === 'receipt' ? 'text-success' : 'text-alert'}
                    bold
                  />
                  <ReviewRow
                    label="Date"
                    value={new Date(date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  />
                  {circuitId && (
                    <ReviewRow
                      label="Circuit"
                      value={circuits.find((c) => c.uid === circuitId)?.name || circuitId}
                    />
                  )}
                  {notes && <ReviewRow label="Notes" value={notes} />}
                </Card>

                {items.length > 0 && (
                  <Card className="p-4">
                    <p className="text-xs font-semibold text-text-secondary mb-2">Items</p>
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0"
                      >
                        <span className="text-xs text-text-primary">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="text-xs font-mono font-bold text-navy">
                          {formatCurrency(item.total)}
                        </span>
                      </div>
                    ))}
                  </Card>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" size="lg" className="flex-1" onClick={goBack}>
                    Edit
                  </Button>
                  <Button
                    variant="gold"
                    size="lg"
                    className="flex-1"
                    loading={isSubmitting}
                    onClick={handleSubmit}
                  >
                    <Check size={16} className="mr-1" />
                    Save Entry
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="Add Item">
        <div className="space-y-4">
          <Select
            label="Product"
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              const prod = products.find((p) => p.uid === e.target.value);
              if (prod) {
                setItemPrice(
                  txnType === 'receipt'
                    ? prod.sellingPrice.toFixed(2)
                    : prod.costPrice.toFixed(2)
                );
              }
            }}
            options={[
              { value: '', label: 'Select product...' },
              ...products.map((p) => ({
                value: p.uid,
                label: `${p.name} (Stock: ${p.currentStock})`,
              })),
            ]}
          />

          <Input
            label="Quantity"
            type="number"
            placeholder="0"
            value={itemQty}
            onChange={(e) => setItemQty(e.target.value)}
          />

          <AmountInput
            label="Unit Price"
            value={itemPrice}
            onChange={(e) => setItemPrice(e.target.value)}
          />

          {selectedProduct && itemQty && itemPrice && (
            <div className="flex items-center justify-between p-3 bg-gold/10 rounded-xl">
              <span className="text-xs font-medium text-text-secondary">Line Total</span>
              <span className="text-sm font-bold font-mono text-navy">
                {formatCurrency((parseInt(itemQty) || 0) * (parseFloat(itemPrice) || 0))}
              </span>
            </div>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleAddItem}
            disabled={!selectedProduct || !itemQty || !itemPrice}
          >
            Add Item
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ---- Sub-components ----

function ReviewRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${color || 'text-text-primary'}`}>
        {value}
      </span>
    </div>
  );
}

function SuccessScreen() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className="w-16 h-16 bg-success rounded-full flex items-center justify-center mb-4"
      >
        <Check size={28} className="text-white" />
      </motion.div>
      <h2 className="text-lg font-bold text-navy mb-1">Saved!</h2>
      <p className="text-sm text-text-secondary">Transaction recorded successfully</p>
    </motion.div>
  );
}
