// ============================================================
// Home Page — Dashboard with Martha greeting
// ============================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  PenLine,
  BarChart3,
  Package,
  Users,
  FileText,
  Receipt,
} from 'lucide-react';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import SummaryCard from '../components/ui/SummaryCard';
import Card from '../components/ui/Card';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, getCurrentQuarter, getCurrentYear } from '../utils/helpers';
import { QUARTER_LABELS } from '../utils/constants';

export default function HomePage() {
  const navigate = useNavigate();
  const { transactions, loading: txnLoading, loadAll, getTotalReceipts, getTotalPayments, getBalance } = useTransactionStore();
  const { circuits, loading: circuitLoading, loadCircuits } = useCircuitStore();
  const { products, loading: invLoading, loadProducts } = useInventoryStore();
  const { speak } = useMarthaStore();

  const loading = txnLoading || circuitLoading || invLoading;

  const currentQ = getCurrentQuarter();
  const currentY = getCurrentYear();

  useEffect(() => {
    loadAll();
    loadCircuits();
    loadProducts();

    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? 'Good morning!'
        : hour < 17
          ? 'Good afternoon!'
          : 'Good evening!';

    speak(
      `${greeting} Welcome back. Here's your Europe Mission financial overview for ${QUARTER_LABELS[currentQ]} ${currentY}.`,
      'greeting'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalReceipts = getTotalReceipts(currentQ, currentY);
  const totalPayments = getTotalPayments(currentQ, currentY);
  const balance = getBalance(currentQ, currentY);
  const recentTransactions = transactions
    .filter((t) => t.quarter === currentQ && t.year === currentY)
    .slice(0, 5);

  const quickActions = [
    { label: 'New Entry', icon: PenLine, path: '/entry', color: 'bg-gold text-navy-dark' },
    { label: 'Reports', icon: BarChart3, path: '/reports', color: 'bg-navy text-white' },
    { label: 'Stock', icon: Package, path: '/inventory', color: 'bg-success text-white' },
    { label: 'Circuits', icon: Users, path: '/circuits', color: 'bg-navy-light text-white' },
    { label: 'Payment', icon: FileText, path: '/entry?type=payment', color: 'bg-gold-dark text-white' },
    { label: 'Receipt', icon: Receipt, path: '/entry?type=receipt', color: 'bg-martha-brown text-white' },
  ];

  return (
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold text-navy">Martha</h1>
            <p className="text-xs text-text-secondary">Europe Mission Finance</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
              {QUARTER_LABELS[currentQ]}
            </p>
            <p className="text-xs text-text-secondary">{currentY}</p>
          </div>
        </motion.div>
      </div>

      {/* Martha Greeting */}
      <div className="mb-6">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <SummaryCard
          label="Total Receipts"
          value={formatCurrency(totalReceipts)}
          icon={<ArrowUpRight size={18} />}
          color="success"
          delay={0.1}
        />
        <SummaryCard
          label="Total Payments"
          value={formatCurrency(totalPayments)}
          icon={<ArrowDownRight size={18} />}
          color="alert"
          delay={0.15}
        />
        <SummaryCard
          label="Balance"
          value={formatCurrency(balance)}
          icon={<Wallet size={18} />}
          color={balance >= 0 ? 'gold' : 'alert'}
          delay={0.2}
        />
        <SummaryCard
          label="Transactions"
          value={String(transactions.filter((t) => t.quarter === currentQ && t.year === currentY).length)}
          icon={<TrendingUp size={18} />}
          color="navy"
          delay={0.25}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-navy mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white border border-border/50 shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center`}>
                <action.icon size={18} />
              </div>
              <span className="text-[11px] font-medium text-text-primary">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-navy">Recent ({QUARTER_LABELS[currentQ]})</h2>
          {transactions.length > 0 && (
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-gold-dark font-medium"
            >
              View All
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-text-secondary mb-2">No transactions yet</p>
            <p className="text-xs text-text-light">
              Tap "New Entry" to start recording your finances!
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((txn, i) => (
              <Card key={txn.uid} className="p-3 flex items-center gap-3" delay={0.35 + i * 0.05}>
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    txn.type === 'receipt'
                      ? 'bg-success-light text-success'
                      : 'bg-alert-light text-alert'
                  }`}
                >
                  {txn.type === 'receipt' ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {txn.description}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    {new Date(txn.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
                <p
                  className={`text-sm font-bold font-mono ${
                    txn.type === 'receipt' ? 'text-success' : 'text-alert'
                  }`}
                >
                  {txn.type === 'receipt' ? '+' : '-'}
                  {formatCurrency(txn.amount)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      <Card className="p-4 mb-2">
        <div className="flex items-center justify-between text-center">
          <div>
            <p className="text-lg font-bold text-navy">{circuits.length}</p>
            <p className="text-[10px] text-text-secondary">Circuits</p>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div>
            <p className="text-lg font-bold text-navy">{products.length}</p>
            <p className="text-[10px] text-text-secondary">Products</p>
          </div>
          <div className="w-px h-8 bg-border"></div>
          <div>
            <p className="text-lg font-bold text-navy">{transactions.length}</p>
            <p className="text-[10px] text-text-secondary">Total Entries</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
