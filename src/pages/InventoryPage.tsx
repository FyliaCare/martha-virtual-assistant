// ============================================================
// Inventory Page — Product grid with stock management
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowRightLeft,
  Pencil,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { AmountInput } from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, toISODate, getCurrentQuarter, getCurrentYear } from '../utils/helpers';
import type { Product, ProductCategory, Quarter } from '../types';

type ModalMode = 'add-product' | 'edit-product' | 'stock-movement' | null;

export default function InventoryPage() {
  const {
    products,
    loadProducts,
    loadMovements,
    addProduct,
    updateProduct,
    addStockMovement,
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

  const lowStockProducts = getLowStockProducts();

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
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-navy">Inventory</h1>
            <p className="text-xs text-text-secondary">{products.length} products tracked</p>
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

      {/* Martha */}
      <div className="mb-4">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
        <div className="space-y-2">
          {products.map((product, i) => {
            const isLow = product.currentStock <= product.reorderLevel;

            return (
              <Card key={product.uid} delay={0.05 + i * 0.03}>
                <div className="p-3 flex items-center gap-3">
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
                    onClick={() => openEditProduct(product)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50"
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
