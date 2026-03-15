// ============================================================
// Inventory Page — Product grid with stock management
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowRightLeft,
  Pencil,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Calendar,
  X,
  Layers,
  Trash2,
  Save,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { AmountInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, formatDate, toISODate, getCurrentQuarter, getCurrentYear } from '../utils/helpers';
import type { Product, ProductCategory, StockMovement, Quarter } from '../types';

type ModalMode = 'add-product' | 'edit-product' | 'stock-movement' | 'product-detail' | null;

export default function InventoryPage() {
  const {
    products,
    loadProducts,
    loadMovements,
    addProduct,
    updateProduct,
    deleteProduct,
    addStockMovement,
    updateStockMovement,
    deleteStockMovement,
    getLowStockProducts,
  } = useInventoryStore();
  const { speak } = useMarthaStore();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Product form state
  const [pName, setPName] = useState('');
  const [pCost, setPCost] = useState('');
  const [pSell, setPSell] = useState('');
  const [pCategory, setPCategory] = useState<ProductCategory>('accessory');
  const [pReorder, setPReorder] = useState('10');

  // Stock movement form state
  const [smProductId, setSmProductId] = useState('');
  const [smType, setSmType] = useState<'purchase' | 'sale' | 'adjustment'>('purchase');
  const [smQty, setSmQty] = useState('');
  const [smPrice, setSmPrice] = useState('');
  const [smNotes, setSmNotes] = useState('');

  // Delete confirmation state
  const [deleteProductConfirm, setDeleteProductConfirm] = useState(false);
  const [deleteMovementUid, setDeleteMovementUid] = useState<string | null>(null);

  // Stock movement editing state
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [emType, setEmType] = useState<'purchase' | 'sale' | 'adjustment'>('purchase');
  const [emQty, setEmQty] = useState('');
  const [emPrice, setEmPrice] = useState('');
  const [emNotes, setEmNotes] = useState('');
  const [emSaving, setEmSaving] = useState(false);

  // Inline add-movement state (inside product detail modal)
  const [addingMovement, setAddingMovement] = useState(false);
  const [nmType, setNmType] = useState<'purchase' | 'sale' | 'adjustment'>('sale');
  const [nmQty, setNmQty] = useState('');
  const [nmPrice, setNmPrice] = useState('');
  const [nmDate, setNmDate] = useState(toISODate(new Date()));
  const [nmNotes, setNmNotes] = useState('');
  const [nmSaving, setNmSaving] = useState(false);

  useEffect(() => {
    (async () => {
      await loadProducts();
      await loadMovements();
      const lowStock = getLowStockProducts();
      if (lowStock.length > 0) {
        speak(
          `Heads up! ${lowStock.length} product${lowStock.length > 1 ? 's are' : ' is'} running low on stock.`,
          'warning'
        );
      } else {
        speak("Here's your inventory overview. All stock levels look healthy!", 'presenting');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep selectedProduct in sync with store after stock edits/deletes
  useEffect(() => {
    if (selectedProduct) {
      const fresh = products.find((p) => p.uid === selectedProduct.uid);
      if (fresh) {
        setSelectedProduct(fresh);
      } else {
        // Product was deleted from the store
        setSelectedProduct(null);
        setModalMode(null);
      }
    }
  }, [products]); // eslint-disable-line react-hooks/exhaustive-deps

  const lowStockProducts = getLowStockProducts();

  // Product detail computed stats
  const { movements } = useInventoryStore();
  const productStats = useMemo(() => {
    if (!selectedProduct) return null;
    const pm = movements.filter((m) => m.productId === selectedProduct.uid);
    const purchased = pm.filter((m) => m.type === 'purchase');
    const sold = pm.filter((m) => m.type === 'sale');
    const adjusted = pm.filter((m) => m.type === 'adjustment');
    const totalPurchased = purchased.reduce((s, m) => s + m.quantity, 0);
    const totalSold = sold.reduce((s, m) => s + m.quantity, 0);
    const totalAdjusted = adjusted.reduce((s, m) => s + m.quantity, 0);
    const totalCostSpent = purchased.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
    const totalRevenue = sold.reduce((s, m) => s + m.quantity * m.unitPrice, 0);
    const profitMargin = selectedProduct.sellingPrice > 0
      ? ((selectedProduct.sellingPrice - selectedProduct.costPrice) / selectedProduct.sellingPrice) * 100
      : 0;
    return {
      totalPurchased,
      totalSold,
      totalAdjusted,
      totalCostSpent,
      totalRevenue,
      profitMargin,
      recentMovements: pm.slice(0, 20),
    };
  }, [selectedProduct, movements]);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('product-detail');
  };

  const resetProductForm = () => {
    setPName('');
    setPCost('');
    setPSell('');
    setPCategory('accessory');
    setPReorder('10');
    setSelectedProduct(null);
  };

  const resetMovementForm = () => {
    setSmProductId('');
    setSmType('purchase');
    setSmQty('');
    setSmPrice('');
    setSmNotes('');
  };

  const openAddProduct = () => {
    resetProductForm();
    setModalMode('add-product');
  };

  const openEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setPName(product.name);
    setPCost(product.costPrice.toFixed(2));
    setPSell(product.sellingPrice.toFixed(2));
    setPCategory(product.category);
    setPReorder(String(product.reorderLevel));
    setModalMode('edit-product');
  };

  const openStockMovement = (product?: Product) => {
    resetMovementForm();
    if (product) {
      setSmProductId(product.uid);
      setSmPrice(product.costPrice.toFixed(2));
    }
    setModalMode('stock-movement');
  };

  const handleSaveProduct = async () => {
    if (!pName.trim()) return;

    const data = {
      name: pName.trim(),
      costPrice: parseFloat(pCost) || 0,
      sellingPrice: parseFloat(pSell) || 0,
      category: pCategory,
      reorderLevel: parseInt(pReorder) || 5,
    };

    if (selectedProduct) {
      await updateProduct(selectedProduct.uid, data);
      speak(`${pName} updated!`, 'thumbsup');
    } else {
      await addProduct({
        ...data,
        currentStock: 0,
      });
      speak(`${pName} added to inventory!`, 'celebrating');
    }

    setModalMode(null);
    resetProductForm();
  };

  const handleStockMovement = async () => {
    if (!smProductId || !smQty) return;

    const product = products.find((p) => p.uid === smProductId);
    const qty = parseInt(smQty) || 0;
    const price = parseFloat(smPrice) || 0;
    if (qty <= 0) return;

    // Prevent selling more than available stock
    if (smType === 'sale' && product && qty > product.currentStock) {
      speak(`Only ${product.currentStock} units of ${product.name} available in stock.`, 'warning');
      return;
    }

    await addStockMovement({
      productId: smProductId,
      type: smType,
      quantity: qty,
      unitPrice: price,
      date: toISODate(new Date()),
      quarter: getCurrentQuarter() as Quarter,
      year: getCurrentYear(),
      notes: smNotes || undefined,
    });

    speak(
      smType === 'purchase'
        ? `${qty} units of ${product?.name} added to stock.`
        : smType === 'sale'
          ? `${qty} units of ${product?.name} sold.`
          : `Stock adjusted for ${product?.name}.`,
      'thumbsup'
    );

    setModalMode(null);
    resetMovementForm();
  };

  // Compute totals
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.currentStock * p.costPrice,
    0
  );

  const categoryColors: Record<ProductCategory, string> = {
    regalia: 'bg-purple-100 text-purple-700',
    badge: 'bg-amber-100 text-amber-700',
    clothing: 'bg-blue-100 text-blue-700',
    publication: 'bg-green-100 text-green-700',
    accessory: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="pb-4 px-4 lg:px-10 lg:py-6 max-w-lg lg:max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4 lg:pt-0 lg:pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-navy">Inventory</h1>
            <p className="text-xs lg:text-sm text-text-secondary">{products.length} products tracked</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => openStockMovement()}>
              <ArrowRightLeft size={14} className="mr-1" />
              Move
            </Button>
            <Button variant="gold" size="sm" onClick={openAddProduct}>
              <Plus size={14} className="mr-1" />
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Martha — mobile only */}
      <div className="mb-4 lg:hidden">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 lg:gap-4 mb-6">
        <Card className="p-3 text-center" delay={0.05}>
          <p className="text-lg font-bold text-navy">{products.length}</p>
          <p className="text-[9px] text-text-secondary">Products</p>
        </Card>
        <Card className="p-3 text-center" delay={0.1}>
          <p className="text-lg font-bold text-navy">
            {products.reduce((s, p) => s + p.currentStock, 0)}
          </p>
          <p className="text-[9px] text-text-secondary">Total Units</p>
        </Card>
        <Card className="p-3 text-center" delay={0.15}>
          <p className="text-sm font-bold font-mono text-navy">
            {formatCurrency(totalStockValue)}
          </p>
          <p className="text-[9px] text-text-secondary">Stock Value</p>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <Card className="p-3 mb-4 bg-alert/5 border-alert/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-alert" />
            <p className="text-xs font-bold text-alert">Low Stock Alert</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lowStockProducts.map((p) => (
              <span
                key={p.uid}
                className="text-[10px] px-2 py-0.5 bg-alert/10 text-alert rounded-full font-medium"
              >
                {p.name}: {p.currentStock}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Product Grid */}
      {products.length === 0 ? (
        <Card className="p-8 text-center">
          <Package size={32} className="mx-auto text-text-light mb-3" />
          <p className="text-sm text-text-secondary mb-1">No products yet</p>
          <p className="text-xs text-text-light">Add your first product to start tracking</p>
        </Card>
      ) : (
        <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          {products.map((product, i) => {
            const isLow = product.currentStock <= product.reorderLevel;

            return (
              <Card key={product.uid} delay={0.05 + i * 0.03} className="cursor-pointer lg:hover:shadow-md lg:transition-shadow">
                <div className="p-3 flex items-center gap-3" onClick={() => openProductDetail(product)}>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isLow ? 'bg-alert/10' : 'bg-navy/5'
                    }`}
                  >
                    <Package
                      size={18}
                      className={isLow ? 'text-alert' : 'text-navy'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-navy truncate">{product.name}</p>
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded-full font-semibold ${
                          categoryColors[product.category]
                        }`}
                      >
                        {product.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-text-secondary">
                        Cost: {formatCurrency(product.costPrice)}
                      </span>
                      <span className="text-[10px] text-text-secondary">
                        Sell: {formatCurrency(product.sellingPrice)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-bold font-mono ${
                        isLow ? 'text-alert' : 'text-navy'
                      }`}
                    >
                      {product.currentStock}
                    </p>
                    <p className="text-[9px] text-text-secondary">in stock</p>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); openEditProduct(product); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Pencil size={12} className="text-text-light" />
                  </button>
                </div>

                {/* Stock bar */}
                <div className="px-3 pb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isLow ? 'bg-alert' : 'bg-success'
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (product.currentStock / Math.max(product.reorderLevel * 3, 1)) * 100,
                          100
                        )}%`,
                      }}
                      transition={{ delay: 0.2 + i * 0.03, duration: 0.5 }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <Modal
        isOpen={modalMode === 'product-detail' && selectedProduct !== null}
        onClose={() => {
          setModalMode(null);
          setSelectedProduct(null);
          setAddingMovement(false);
        }}
        title={selectedProduct?.name || 'Product Details'}
      >
        {selectedProduct && productStats && (
          <div className="space-y-5">
            {/* Product header */}
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedProduct.currentStock <= selectedProduct.reorderLevel ? 'bg-alert/10' : 'bg-navy/5'
              }`}>
                <Package size={22} className={selectedProduct.currentStock <= selectedProduct.reorderLevel ? 'text-alert' : 'text-navy'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-navy">{selectedProduct.name}</p>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${categoryColors[selectedProduct.category]}`}>
                    {selectedProduct.category}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">Cost: {formatCurrency(selectedProduct.costPrice)} · Sell: {formatCurrency(selectedProduct.sellingPrice)}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-navy/5 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <ShoppingCart size={14} className="text-navy" />
                </div>
                <p className="text-lg font-bold font-mono text-navy">{productStats.totalPurchased}</p>
                <p className="text-[10px] text-text-secondary">Total Bought</p>
              </div>
              <div className="p-3 bg-success/5 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={14} className="text-success" />
                </div>
                <p className="text-lg font-bold font-mono text-success">{productStats.totalSold}</p>
                <p className="text-[10px] text-text-secondary">Total Sold</p>
              </div>
              <div className="p-3 bg-gold/10 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Layers size={14} className="text-gold" />
                </div>
                <p className={`text-lg font-bold font-mono ${selectedProduct.currentStock <= selectedProduct.reorderLevel ? 'text-alert' : 'text-navy'}`}>{selectedProduct.currentStock}</p>
                <p className="text-[10px] text-text-secondary">In Stock</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 size={14} className="text-purple-600" />
                </div>
                <p className="text-lg font-bold font-mono text-purple-600">{productStats.profitMargin.toFixed(0)}%</p>
                <p className="text-[10px] text-text-secondary">Margin</p>
              </div>
            </div>

            {/* Financial summary */}
            <Card className="p-3">
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-xs text-text-secondary">Total Cost (Purchased)</span>
                <span className="text-xs font-bold font-mono text-alert">{formatCurrency(productStats.totalCostSpent)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-xs text-text-secondary">Total Revenue (Sold)</span>
                <span className="text-xs font-bold font-mono text-success">{formatCurrency(productStats.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                <span className="text-xs text-text-secondary">Profit</span>
                <span className={`text-xs font-bold font-mono ${productStats.totalRevenue - productStats.totalCostSpent >= 0 ? 'text-success' : 'text-alert'}`}>
                  {productStats.totalRevenue - productStats.totalCostSpent >= 0 ? '+' : ''}{formatCurrency(productStats.totalRevenue - productStats.totalCostSpent)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-text-secondary">Current Stock Value</span>
                <span className="text-xs font-bold font-mono text-navy">{formatCurrency(selectedProduct.currentStock * selectedProduct.costPrice)}</span>
              </div>
            </Card>

            {/* Stock movement history */}
            {(productStats.recentMovements.length > 0 || addingMovement) && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Stock History</h4>
                  {!addingMovement && (
                    <button
                      onClick={() => {
                        setNmType('sale');
                        setNmQty('');
                        setNmPrice(selectedProduct.sellingPrice.toFixed(2));
                        setNmDate(toISODate(new Date()));
                        setNmNotes('');
                        setAddingMovement(true);
                      }}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gold hover:text-gold/80 transition-colors"
                    >
                      <Plus size={12} /> Add Movement
                    </button>
                  )}
                </div>

                {/* Inline add-movement form */}
                {addingMovement && (
                  <div className="p-3 bg-success/5 rounded-lg border border-success/20 space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-navy">New Stock Movement</p>
                      <button onClick={() => setAddingMovement(false)} className="p-1 rounded hover:bg-gray-100">
                        <X size={14} className="text-text-secondary" />
                      </button>
                    </div>
                    <Select
                      value={nmType}
                      onChange={(e) => {
                        const t = e.target.value as 'purchase' | 'sale' | 'adjustment';
                        setNmType(t);
                        setNmPrice(t === 'sale' ? selectedProduct.sellingPrice.toFixed(2) : selectedProduct.costPrice.toFixed(2));
                      }}
                      options={[
                        { value: 'sale', label: 'Sale (Stock Out)' },
                        { value: 'purchase', label: 'Purchase (Stock In)' },
                        { value: 'adjustment', label: 'Adjustment' },
                      ]}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={nmQty}
                        onChange={(e) => setNmQty(e.target.value)}
                      />
                      <AmountInput
                        placeholder="Unit Price"
                        value={nmPrice}
                        onChange={(e) => setNmPrice(e.target.value)}
                      />
                    </div>
                    <Input
                      type="date"
                      value={nmDate}
                      onChange={(e) => setNmDate(e.target.value)}
                    />
                    <Input
                      placeholder="Notes (optional)"
                      value={nmNotes}
                      onChange={(e) => setNmNotes(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="flex-1" onClick={() => setAddingMovement(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        className="flex-1"
                        disabled={nmSaving || !nmQty || parseInt(nmQty) <= 0}
                        onClick={async () => {
                          const qty = parseInt(nmQty) || 0;
                          if (qty <= 0) return;
                          if (nmType === 'sale' && qty > selectedProduct.currentStock) {
                            speak(`Only ${selectedProduct.currentStock} units available in stock.`, 'warning');
                            return;
                          }
                          setNmSaving(true);
                          const d = new Date(nmDate);
                          const q = Math.ceil((d.getMonth() + 1) / 3) as Quarter;
                          await addStockMovement({
                            productId: selectedProduct.uid,
                            type: nmType,
                            quantity: qty,
                            unitPrice: parseFloat(nmPrice) || 0,
                            date: nmDate,
                            quarter: q,
                            year: d.getFullYear(),
                            notes: nmNotes || undefined,
                          });
                          speak(
                            nmType === 'sale'
                              ? `${qty} units sold recorded.`
                              : nmType === 'purchase'
                                ? `${qty} units purchased recorded.`
                                : `Stock adjustment recorded.`,
                            'thumbsup'
                          );
                          setAddingMovement(false);
                          setNmSaving(false);
                        }}
                      >
                        <Save size={12} className="mr-1" /> Record
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {productStats.recentMovements.map((m) => (
                    <div key={m.uid}>
                      {/* Edit mode for this movement */}
                      {editingMovement?.uid === m.uid ? (
                        <div className="p-3 bg-gold/5 rounded-lg border border-gold/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-navy">Edit Movement</p>
                            <button onClick={() => setEditingMovement(null)} className="p-1 rounded hover:bg-gray-100">
                              <X size={14} className="text-text-secondary" />
                            </button>
                          </div>
                          <Select
                            value={emType}
                            onChange={(e) => setEmType(e.target.value as 'purchase' | 'sale' | 'adjustment')}
                            options={[
                              { value: 'purchase', label: 'Purchase (Stock In)' },
                              { value: 'sale', label: 'Sale (Stock Out)' },
                              { value: 'adjustment', label: 'Adjustment' },
                            ]}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              type="number"
                              placeholder="Qty"
                              value={emQty}
                              onChange={(e) => setEmQty(e.target.value)}
                            />
                            <AmountInput
                              placeholder="Price"
                              value={emPrice}
                              onChange={(e) => setEmPrice(e.target.value)}
                            />
                          </div>
                          <Input
                            placeholder="Notes (optional)"
                            value={emNotes}
                            onChange={(e) => setEmNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditingMovement(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="gold"
                              size="sm"
                              className="flex-1"
                              disabled={emSaving || !emQty}
                              onClick={async () => {
                                setEmSaving(true);
                                await updateStockMovement(m.uid, {
                                  type: emType,
                                  quantity: parseInt(emQty) || 0,
                                  unitPrice: parseFloat(emPrice) || 0,
                                  notes: emNotes || undefined,
                                }, editingMovement);
                                speak('Movement updated!', 'thumbsup');
                                setEditingMovement(null);
                                setEmSaving(false);
                              }}
                            >
                              <Save size={12} className="mr-1" /> Save
                            </Button>
                          </div>
                        </div>
                      ) : deleteMovementUid === m.uid ? (
                        /* Delete confirmation for this movement */
                        <div className="p-3 bg-alert/5 rounded-lg border border-alert/20 space-y-2">
                          <p className="text-xs font-bold text-alert">Delete this {m.type}?</p>
                          <p className="text-[10px] text-text-secondary">
                            This will reverse the stock change ({m.type === 'sale' ? '-' : '+'}{m.quantity} units) and cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleteMovementUid(null)}>
                              Cancel
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="flex-1"
                              onClick={async () => {
                                await deleteStockMovement(m.uid);
                                speak('Movement deleted and stock adjusted.', 'thumbsup');
                                setDeleteMovementUid(null);
                              }}
                            >
                              <Trash2 size={12} className="mr-1" /> Delete
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Normal view mode */
                        <div className="flex items-center gap-2 p-2 bg-cream rounded-lg group">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            m.type === 'purchase' ? 'bg-navy/10 text-navy'
                              : m.type === 'sale' ? 'bg-success/10 text-success'
                                : 'bg-gold/10 text-gold'
                          }`}>
                            {m.type === 'purchase' ? <ShoppingCart size={12} />
                              : m.type === 'sale' ? <TrendingUp size={12} />
                                : <ArrowRightLeft size={12} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-text-primary capitalize">{m.type}</p>
                            <p className="text-[10px] text-text-secondary">{formatDate(m.date)}{m.notes ? ` · ${m.notes}` : ''}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`text-xs font-bold font-mono ${
                              m.type === 'purchase' ? 'text-navy' : m.type === 'sale' ? 'text-success' : 'text-gold'
                            }`}>
                              {m.type === 'sale' ? '-' : '+'}{m.quantity}
                            </p>
                            <p className="text-[9px] text-text-secondary">@ {formatCurrency(m.unitPrice)}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => {
                                setEditingMovement(m);
                                setEmType(m.type);
                                setEmQty(String(m.quantity));
                                setEmPrice(String(m.unitPrice));
                                setEmNotes(m.notes || '');
                              }}
                              className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors"
                              title="Edit movement"
                            >
                              <Pencil size={11} className="text-gold" />
                            </button>
                            <button
                              onClick={() => setDeleteMovementUid(m.uid)}
                              className="p-1.5 rounded-lg hover:bg-alert/10 transition-colors"
                              title="Delete movement"
                            >
                              <Trash2 size={11} className="text-alert" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {productStats.recentMovements.length === 0 && !addingMovement && (
              <div className="text-center py-4">
                <Calendar size={20} className="mx-auto text-text-light mb-2" />
                <p className="text-xs text-text-secondary">No stock movements recorded yet</p>
                <button
                  onClick={() => {
                    setNmType('sale');
                    setNmQty('');
                    setNmPrice(selectedProduct.sellingPrice.toFixed(2));
                    setNmDate(toISODate(new Date()));
                    setNmNotes('');
                    setAddingMovement(true);
                  }}
                  className="mt-2 text-[11px] font-semibold text-gold hover:text-gold/80 transition-colors"
                >
                  + Add first movement
                </button>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2">
              <Button
                variant="gold"
                size="md"
                className="flex-1"
                onClick={() => {
                  setModalMode(null);
                  setTimeout(() => openEditProduct(selectedProduct), 200);
                }}
              >
                <Pencil size={14} className="mr-1" /> Edit
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  const p = selectedProduct;
                  setModalMode(null);
                  setTimeout(() => openStockMovement(p), 200);
                }}
              >
                <ArrowRightLeft size={14} className="mr-1" /> Stock
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => setDeleteProductConfirm(true)}
              >
                <Trash2 size={14} />
              </Button>
            </div>

            {/* Delete product confirmation */}
            {deleteProductConfirm && (
              <div className="p-4 bg-alert/5 rounded-xl border border-alert/20 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-alert" />
                  <p className="text-sm font-bold text-alert">Delete {selectedProduct.name}?</p>
                </div>
                <p className="text-xs text-text-secondary">
                  This will permanently delete this product and all its stock movements. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setDeleteProductConfirm(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      const name = selectedProduct.name;
                      await deleteProduct(selectedProduct.uid);
                      speak(`${name} has been deleted.`, 'thumbsup');
                      setDeleteProductConfirm(false);
                      setModalMode(null);
                      setSelectedProduct(null);
                    }}
                  >
                    <Trash2 size={12} className="mr-1" /> Delete Forever
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={modalMode === 'add-product' || modalMode === 'edit-product'}
        onClose={() => {
          setModalMode(null);
          resetProductForm();
        }}
        title={modalMode === 'edit-product' ? 'Edit Product' : 'Add Product'}
      >
        <div className="space-y-4">
          <Input
            label="Product Name"
            placeholder="e.g. Gold Badge"
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            icon={<Package size={16} />}
          />
          <div className="grid grid-cols-2 gap-3">
            <AmountInput
              label="Cost Price"
              value={pCost}
              onChange={(e) => setPCost(e.target.value)}
            />
            <AmountInput
              label="Selling Price"
              value={pSell}
              onChange={(e) => setPSell(e.target.value)}
            />
          </div>
          <Select
            label="Category"
            value={pCategory}
            onChange={(e) => setPCategory(e.target.value as ProductCategory)}
            options={[
              { value: 'regalia', label: 'Regalia' },
              { value: 'badge', label: 'Badge' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'publication', label: 'Publication' },
              { value: 'accessory', label: 'Accessory' },
            ]}
          />
          <Input
            label="Reorder Level"
            type="number"
            placeholder="10"
            value={pReorder}
            onChange={(e) => setPReorder(e.target.value)}
          />
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSaveProduct}
            disabled={!pName.trim()}
          >
            {modalMode === 'edit-product' ? 'Save Changes' : 'Add Product'}
          </Button>
        </div>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal
        isOpen={modalMode === 'stock-movement'}
        onClose={() => {
          setModalMode(null);
          resetMovementForm();
        }}
        title="Stock Movement"
      >
        <div className="space-y-4">
          <Select
            label="Product"
            value={smProductId}
            onChange={(e) => {
              setSmProductId(e.target.value);
              const prod = products.find((p) => p.uid === e.target.value);
              if (prod) {
                setSmPrice(
                  smType === 'sale'
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
          <Select
            label="Movement Type"
            value={smType}
            onChange={(e) => setSmType(e.target.value as 'purchase' | 'sale' | 'adjustment')}
            options={[
              { value: 'purchase', label: 'Purchase (Stock In)' },
              { value: 'sale', label: 'Sale (Stock Out)' },
              { value: 'adjustment', label: 'Adjustment' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              placeholder="0"
              value={smQty}
              onChange={(e) => setSmQty(e.target.value)}
            />
            <AmountInput
              label="Unit Price"
              value={smPrice}
              onChange={(e) => setSmPrice(e.target.value)}
            />
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Movement notes..."
            value={smNotes}
            onChange={(e) => setSmNotes(e.target.value)}
          />
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleStockMovement}
            disabled={!smProductId || !smQty}
          >
            Record Movement
          </Button>
        </div>
      </Modal>
    </div>
  );
}
