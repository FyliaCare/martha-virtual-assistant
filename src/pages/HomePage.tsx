// ============================================================
// Home Page — Dashboard with Martha greeting
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Download,
  X,
  Share,
  Smartphone,
} from 'lucide-react';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import SummaryCard from '../components/ui/SummaryCard';
import Card from '../components/ui/Card';
import TransactionDetailModal from '../components/ui/TransactionDetailModal';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, getCurrentQuarter, getCurrentYear } from '../utils/helpers';
import { QUARTER_LABELS } from '../utils/constants';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export default function HomePage() {
  const navigate = useNavigate();
  const { transactions, loading: txnLoading, loadAll, getTotalReceipts, getTotalPayments, getBalance } = useTransactionStore();
  const { circuits, loading: circuitLoading, loadCircuits } = useCircuitStore();
  const { products, loading: invLoading, loadProducts } = useInventoryStore();
  const { speak } = useMarthaStore();

  const loading = txnLoading || circuitLoading || invLoading;
  const { showBanner, showIOSGuide, install, dismiss } = useInstallPrompt();

  // Transaction detail modal state
  const [selectedTxn, setSelectedTxn] = useState<import('../types').Transaction | null>(null);
  const [showTxnModal, setShowTxnModal] = useState(false);

  const currentQ = getCurrentQuarter();
  const currentY = getCurrentYear();

  // If the current quarter has no data, fall back to the most recent quarter that does
  const { displayQ, displayY } = useMemo(() => {
    const hasCurrentData = transactions.some(
      (t) => t.quarter === currentQ && t.year === currentY
    );
    if (hasCurrentData || transactions.length === 0) {
      return { displayQ: currentQ, displayY: currentY };
    }
    // Find the most recent quarter with data
    const sorted = [...transactions].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.quarter - a.quarter;
    });
    return { displayQ: sorted[0].quarter, displayY: sorted[0].year };
  }, [transactions, currentQ, currentY]);

  const isHistorical = displayQ !== currentQ || displayY !== currentY;

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

  const totalReceipts = getTotalReceipts(displayQ, displayY);
  const totalPayments = getTotalPayments(displayQ, displayY);
  const balance = getBalance(displayQ, displayY);
  const recentTransactions = transactions
    .filter((t) => t.quarter === displayQ && t.year === displayY)
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
    <div className="pb-4 px-4 lg:px-10 lg:py-6 max-w-lg lg:max-w-7xl mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4 lg:pt-0 lg:pb-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md lg:hidden">
              <img src="/icons/icon-96.png" alt="Martha" className="w-full h-full" />
            </div>
            <div>
              <h1 className="text-xl lg:text-3xl font-bold text-navy">Dashboard</h1>
              <p className="text-xs lg:text-sm text-text-secondary">
                {isHistorical
                  ? `Showing ${QUARTER_LABELS[displayQ]} ${displayY}`
                  : `${QUARTER_LABELS[displayQ]} ${displayY} — Europe Mission Finance`}
              </p>
            </div>
          </div>
          <div className="text-right lg:flex lg:items-center lg:gap-3">
            <div className="hidden lg:block px-4 py-2 bg-navy/5 rounded-xl">
              <p className="text-xs font-semibold text-navy">{QUARTER_LABELS[displayQ]} {displayY}</p>
            </div>
            <div className="lg:hidden">
              <p className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">
                {QUARTER_LABELS[displayQ]}
              </p>
              <p className="text-xs text-text-secondary">{displayY}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Martha Greeting — hidden on desktop (sidebar branding is enough) */}
      <div className="mb-6 lg:hidden">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* PWA Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="relative bg-linear-to-r from-navy to-navy-light rounded-2xl p-4 text-white shadow-lg">
              <button
                onClick={dismiss}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X size={12} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Download size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Install Martha</p>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    Add to your home screen for quick access, offline use & app-like experience
                  </p>
                </div>
              </div>
              <button
                onClick={install}
                className="mt-3 w-full py-2.5 bg-gold text-navy font-bold text-xs rounded-xl hover:bg-gold-light transition-colors flex items-center justify-center gap-2"
              >
                <Smartphone size={14} />
                Install App
              </button>
            </div>
          </motion.div>
        )}

        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="relative bg-linear-to-r from-navy to-navy-light rounded-2xl p-4 text-white shadow-lg">
              <button
                onClick={dismiss}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Dismiss"
              >
                <X size={12} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center shrink-0">
                  <Download size={22} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">Install Martha</p>
                  <p className="text-[10px] text-white/70 leading-relaxed">
                    Tap <Share size={10} className="inline text-gold" /> in your browser, then <strong>"Add to Home Screen"</strong>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}

      {/* Historical Data Notice */}
      {isHistorical && (
        <div className="mb-4 lg:mb-6 p-3 bg-gold/10 border border-gold/30 rounded-xl text-center">
          <p className="text-xs lg:text-sm text-gold-dark font-medium">
            Showing data from {QUARTER_LABELS[displayQ]} {displayY} — no transactions yet for {QUARTER_LABELS[currentQ]} {currentY}
          </p>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
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
          value={String(transactions.filter((t) => t.quarter === displayQ && t.year === displayY).length)}
          icon={<TrendingUp size={18} />}
          color="navy"
          delay={0.25}
        />
      </div>

      {/* Desktop: Two-column layout for Quick Actions + Recent Transactions */}
      <div className="lg:grid lg:grid-cols-5 lg:gap-6">
        {/* Left column: Quick Actions + Stats */}
        <div className="lg:col-span-2">
          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-sm lg:text-base font-bold text-navy mb-3">Quick Actions</h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(27, 42, 74, 0.1)' }}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2 py-4 lg:py-5 px-2 rounded-2xl bg-white border border-border/50 shadow-sm transition-all"
                >
                  <div className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${action.color} flex items-center justify-center`}>
                    <action.icon size={18} />
                  </div>
                  <span className="text-[11px] lg:text-xs font-medium text-text-primary">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Stats Row */}
          <Card className="p-4 lg:p-5 mb-6 lg:mb-0">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Overview</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Active Circuits</span>
                <span className="text-sm font-bold text-navy">{circuits.length}</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Products Tracked</span>
                <span className="text-sm font-bold text-navy">{products.length}</span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total Entries</span>
                <span className="text-sm font-bold text-navy">{transactions.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Recent Transactions */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm lg:text-base font-bold text-navy">Recent Transactions</h2>
              {transactions.length > 0 && (
                <button
                  onClick={() => navigate('/reports')}
                  className="text-xs lg:text-sm text-gold-dark font-medium hover:underline"
                >
                  View All →
                </button>
              )}
            </div>

            {recentTransactions.length === 0 ? (
              <Card className="p-6 lg:p-10 text-center">
                <p className="text-sm lg:text-base text-text-secondary mb-2">No transactions yet</p>
                <p className="text-xs lg:text-sm text-text-light">
                  Click "New Entry" to start recording your finances!
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((txn, i) => (
                  <Card
                    key={txn.uid}
                    className="p-3 lg:p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                    delay={0.35 + i * 0.05}
                    hover
                    onClick={() => {
                      setSelectedTxn(txn);
                      setShowTxnModal(true);
                    }}
                  >
                    <div
                      className={`w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center ${
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
                      <p className="text-sm lg:text-base font-medium text-text-primary truncate">
                        {txn.description}
                      </p>
                      <p className="text-[10px] lg:text-xs text-text-secondary">
                        {new Date(txn.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <p
                      className={`text-sm lg:text-base font-bold font-mono ${
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
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxn}
        isOpen={showTxnModal}
        onClose={() => {
          setShowTxnModal(false);
          setSelectedTxn(null);
        }}
      />
    </div>
  );
}
