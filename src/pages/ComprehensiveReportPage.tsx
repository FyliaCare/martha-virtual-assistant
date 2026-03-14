// ============================================================
// Comprehensive Report Page — Full financial report Q4 2023 – Q1 2026
// Includes charts, tables, circuit analysis, inventory, debts
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileType2,
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  BookOpen,
  Globe,
  Gift,
  Printer,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useInventoryStore } from '../store/useInventoryStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, formatDate } from '../utils/helpers';
import { ALL_CATEGORIES, ORGANIZATION_NAME, CURRENCY_SYMBOL } from '../utils/constants';
import { generateComprehensiveWord } from '../utils/comprehensiveWordReport';


const NAVY = '#1B2A4A';
const GOLD = '#D4A843';
const GREEN = '#2D8B55';
const RED = '#E85D4A';
const BLUE = '#3B82F6';
const PURPLE = '#8B5CF6';
const PIE_COLORS = [NAVY, GOLD, GREEN, RED, BLUE, PURPLE, '#EC4899', '#14B8A6', '#F59E0B', '#6366F1'];

const quarterKey = (q: number, y: number) => `Q${q} ${y}`;
const quarterSort = (a: { quarter: number; year: number }, b: { quarter: number; year: number }) => {
  if (a.year !== b.year) return a.year - b.year;
  return a.quarter - b.quarter;
};

// Section wrapper with print-friendly styling
function Section({ title, icon, children, id }: { title: string; icon: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 print:mb-4 print:break-inside-avoid"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-navy/10 flex items-center justify-center text-navy print:bg-gray-200">
          {icon}
        </div>
        <h2 className="text-lg font-bold text-navy">{title}</h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function ComprehensiveReportPage() {
  const navigate = useNavigate();
  const { transactions, loadAll } = useTransactionStore();
  const { circuits, loadCircuits } = useCircuitStore();
  const { products, movements, loadProducts, loadMovements } = useInventoryStore();
  const { speak } = useMarthaStore();
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([loadAll(), loadCircuits(), loadProducts(), loadMovements()]).then(() => {
      setLoading(false);
    });
    speak('Here is your comprehensive financial report covering all periods. Scroll through to review every section.', 'presenting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ═══════════════════════════════════════════════
  // COMPUTED DATA
  // ═══════════════════════════════════════════════

  // All real transactions (exclude zero-amount debt markers)
  const realTxns = useMemo(() => transactions.filter((t) => t.amount > 0), [transactions]);
  const debtMarkers = useMemo(() => transactions.filter((t) => t.amount === 0 && t.category === 'debt_repayment'), [transactions]);

  // Quarter list in order
  const quarters = useMemo(() => {
    const set = new Map<string, { quarter: number; year: number }>();
    realTxns.forEach((t) => {
      const key = quarterKey(t.quarter, t.year);
      if (!set.has(key)) set.set(key, { quarter: t.quarter, year: t.year });
    });
    return Array.from(set.values()).sort(quarterSort);
  }, [realTxns]);

  // Grand totals
  const grandReceipts = useMemo(() => realTxns.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.amount, 0), [realTxns]);
  const grandPayments = useMemo(() => realTxns.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0), [realTxns]);
  const grandBalance = grandReceipts - grandPayments;

  // Quarterly trend data
  const quarterlyTrend = useMemo(() => {
    return quarters.map(({ quarter, year }) => {
      const qTxns = realTxns.filter((t) => t.quarter === quarter && t.year === year);
      const rec = qTxns.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.amount, 0);
      const pay = qTxns.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0);
      return {
        period: `Q${quarter} ${year}`,
        quarter,
        year,
        receipts: Math.round(rec * 100) / 100,
        payments: Math.round(pay * 100) / 100,
        net: Math.round((rec - pay) * 100) / 100,
        txnCount: qTxns.length,
      };
    });
  }, [quarters, realTxns]);

  // Cumulative balance over quarters
  const cumulativeData = useMemo(() => {
    let running = 0;
    return quarterlyTrend.map((q) => {
      running += q.net;
      return { ...q, cumulative: Math.round(running * 100) / 100 };
    });
  }, [quarterlyTrend]);

  // Category breakdown (all time)
  const receiptCategories = useMemo(() => {
    const map = new Map<string, number>();
    realTxns.filter((t) => t.type === 'receipt').forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([cat, amount]) => ({
        name: ALL_CATEGORIES.find((c) => c.value === cat)?.label || cat,
        category: cat,
        value: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [realTxns]);

  const paymentCategories = useMemo(() => {
    const map = new Map<string, number>();
    realTxns.filter((t) => t.type === 'payment').forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([cat, amount]) => ({
        name: ALL_CATEGORIES.find((c) => c.value === cat)?.label || cat,
        category: cat,
        value: Math.round(amount * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [realTxns]);

  // Circuit performance (all time)
  const circuitPerformance = useMemo(() => {
    const map = new Map<string, { name: string; receipts: number; payments: number; txnCount: number }>();
    realTxns.forEach((t) => {
      if (!t.circuitId) return;
      const circuit = circuits.find((c) => c.uid === t.circuitId);
      if (!circuit) return;
      const existing = map.get(t.circuitId) || { name: circuit.name, receipts: 0, payments: 0, txnCount: 0 };
      if (t.type === 'receipt') existing.receipts += t.amount;
      else existing.payments += t.amount;
      existing.txnCount++;
      map.set(t.circuitId, existing);
    });
    return Array.from(map.values())
      .map((c) => ({ ...c, net: c.receipts - c.payments }))
      .sort((a, b) => b.receipts - a.receipts);
  }, [realTxns, circuits]);

  // Outstanding debts (from debt markers)
  const outstandingDebts = useMemo(() => {
    return debtMarkers
      .filter((t) => t.notes && t.notes.includes('owes'))
      .map((t) => {
        const circuit = circuits.find((c) => c.uid === t.circuitId);
        const amountMatch = t.notes?.match(/€([\d,]+\.?\d*)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : 0;
        return {
          circuit: circuit?.name || 'Unknown',
          amount,
          notes: t.notes || '',
          date: t.date,
        };
      })
      .filter((d) => d.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [debtMarkers, circuits]);

  const totalDebt = outstandingDebts.reduce((s, d) => s + d.amount, 0);

  // Yearly summary
  const yearlySummary = useMemo(() => {
    const map = new Map<number, { receipts: number; payments: number; txnCount: number }>();
    realTxns.forEach((t) => {
      const existing = map.get(t.year) || { receipts: 0, payments: 0, txnCount: 0 };
      if (t.type === 'receipt') existing.receipts += t.amount;
      else existing.payments += t.amount;
      existing.txnCount++;
      map.set(t.year, existing);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([year, data]) => ({
        year,
        ...data,
        net: data.receipts - data.payments,
      }));
  }, [realTxns]);

  // Top transactions
  const topReceipts = useMemo(() =>
    [...realTxns].filter((t) => t.type === 'receipt').sort((a, b) => b.amount - a.amount).slice(0, 10),
    [realTxns]
  );
  const topPayments = useMemo(() =>
    [...realTxns].filter((t) => t.type === 'payment').sort((a, b) => b.amount - a.amount).slice(0, 10),
    [realTxns]
  );

  // Inventory summary
  const inventorySummary = useMemo(() => {
    return products.map((p) => ({
      name: p.name,
      stock: p.currentStock,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      stockValue: p.currentStock * p.sellingPrice,
      lowStock: p.currentStock <= p.reorderLevel,
    })).sort((a, b) => b.stockValue - a.stockValue);
  }, [products]);

  const totalStockValue = inventorySummary.reduce((s, p) => s + p.stockValue, 0);

  // Handbook distribution Q1 2026
  const handbookDistribution = useMemo(() => {
    return movements
      .filter((m) => m.notes?.includes('Handbook 26 distribution'))
      .map((m) => {
        const circuit = circuits.find((c) => c.uid === m.circuitId);
        return { circuit: circuit?.name || 'Unknown', quantity: m.quantity };
      });
  }, [movements, circuits]);



  // Export handler
  const handleWordExport = async () => {
    setIsExporting(true);
    try {
      await generateComprehensiveWord({
        quarterlyTrend,
        cumulativeData,
        circuitPerformance,
        outstandingDebts,
        totalDebt,
        receiptCategories,
        paymentCategories,
        yearlySummary,
        topReceipts,
        topPayments,
        inventorySummary,
        totalStockValue,
        handbookDistribution,
        grandReceipts,
        grandPayments,
        grandBalance,
        totalTransactions: realTxns.length,
      });
      speak('Comprehensive Word report exported! Check your downloads.', 'celebrating');
    } catch (err) {
      console.error(err);
      speak('Failed to export. Please try again.', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-navy/20 border-t-navy rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">Building comprehensive report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 px-4 lg:px-10 lg:py-6 max-w-2xl lg:max-w-7xl mx-auto print:max-w-none print:px-8">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="pt-6 pb-4 print:pt-4">
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => navigate('/reports')}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer size={14} className="mr-1" /> Print
            </Button>
            <Button variant="gold" size="sm" onClick={handleWordExport} disabled={isExporting}>
              <FileType2 size={14} className="mr-1" />
              {isExporting ? 'Exporting...' : 'Word Export'}
            </Button>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-navy">{ORGANIZATION_NAME}</h1>
          <p className="text-sm text-gold font-medium mt-1">Comprehensive Financial Report</p>
          <p className="text-xs text-text-secondary mt-1">
            Q4 2023 – Q1 2026 &nbsp;|&nbsp; Generated: {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
          <div className="w-24 h-0.5 bg-gold mx-auto mt-3" />
        </div>
      </div>

      {/* ═══════════════════════ TABLE OF CONTENTS ═══════════════════════ */}
      <Card className="p-4 mb-6 print:shadow-none print:border print:border-gray-200">
        <h3 className="text-sm font-bold text-navy mb-2">Table of Contents</h3>
        <div className="grid grid-cols-2 gap-1 text-xs text-text-secondary">
          {[
            '1. Executive Summary',
            '2. Quarterly Financial Trends',
            '3. Cumulative Balance',
            '4. Annual Summary',
            '5. Receipt Analysis',
            '6. Payment Analysis',
            '7. Circuit Performance',
            '8. Outstanding Debts',
            '9. Top Transactions',
            '10. Inventory & Stock',
            '11. Handbook Distribution',
            '12. Key Observations',
          ].map((item) => (
            <p key={item} className="py-0.5">{item}</p>
          ))}
        </div>
      </Card>

      {/* ═══════════════════════ 1. EXECUTIVE SUMMARY ═══════════════════════ */}
      <Section title="1. Executive Summary" icon={<BookOpen size={18} />} id="executive-summary">
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary leading-relaxed mb-4">
            This report presents the complete financial history of the <strong>{ORGANIZATION_NAME}</strong> from
            October 2023 (Q4) through March 2026 (Q1). It covers <strong>{realTxns.length} transactions</strong> across{' '}
            <strong>{circuits.length} circuits</strong> in {quarters.length} quarters, tracking all receipts,
            payments, merchandise sales, circuit contributions, and outstanding debts.
          </p>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-600">{formatCurrency(grandReceipts)}</p>
              <p className="text-[10px] text-text-secondary font-medium">Total Receipts</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-lg font-bold text-red-500">{formatCurrency(grandPayments)}</p>
              <p className="text-[10px] text-text-secondary font-medium">Total Payments</p>
            </div>
            <div className={`text-center p-3 rounded-xl ${grandBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <p className={`text-lg font-bold ${grandBalance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                {formatCurrency(grandBalance)}
              </p>
              <p className="text-[10px] text-text-secondary font-medium">Net Balance</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-navy/5 rounded-xl">
              <p className="text-xs font-medium text-navy">Total Transactions</p>
              <p className="text-xl font-bold text-navy">{realTxns.length}</p>
            </div>
            <div className="p-3 bg-navy/5 rounded-xl">
              <p className="text-xs font-medium text-navy">Quarters Covered</p>
              <p className="text-xl font-bold text-navy">{quarters.length}</p>
            </div>
            <div className="p-3 bg-navy/5 rounded-xl">
              <p className="text-xs font-medium text-navy">Active Circuits</p>
              <p className="text-xl font-bold text-navy">{circuits.length}</p>
            </div>
            <div className="p-3 bg-navy/5 rounded-xl">
              <p className="text-xs font-medium text-navy">Stock Items</p>
              <p className="text-xl font-bold text-navy">{products.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Financial Health:</strong>{' '}
            {grandBalance >= 0
              ? `The organization maintains a positive net balance of ${formatCurrency(grandBalance)}, indicating sound financial management across the reporting period.`
              : `The organization shows a net deficit of ${formatCurrency(Math.abs(grandBalance))}. This requires attention to ensure sustainability.`
            }{' '}
            Total outstanding circuit debts stand at <strong>{formatCurrency(totalDebt)}</strong>,
            and current inventory stock is valued at approximately <strong>{formatCurrency(totalStockValue)}</strong>.
          </p>
        </Card>
      </Section>

      {/* ═══════════════════════ 2. QUARTERLY FINANCIAL TRENDS ═══════════════════════ */}
      <Section title="2. Quarterly Financial Trends" icon={<BarChart3 size={18} />}>
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary mb-4">
            The chart below shows the receipts and payments for each quarter since the start of operations.
            This helps identify seasonal patterns and financial peaks.
          </p>
          <div className="h-64 print:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyTrend} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)}
                  labelStyle={{ fontWeight: 'bold' }}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="receipts" name="Receipts" fill={GREEN} radius={[4, 4, 0, 0]} />
                <Bar dataKey="payments" name="Payments" fill={RED} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quarterly detail table */}
        <Card className="p-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-navy mb-3">Quarterly Breakdown</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy/20">
                <th className="text-left py-2 font-semibold text-navy">Period</th>
                <th className="text-right py-2 font-semibold text-green-600">Receipts</th>
                <th className="text-right py-2 font-semibold text-red-500">Payments</th>
                <th className="text-right py-2 font-semibold text-navy">Net</th>
                <th className="text-right py-2 font-semibold text-text-secondary">Txns</th>
              </tr>
            </thead>
            <tbody>
              {quarterlyTrend.map((q, i) => (
                <tr key={q.period} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-2 font-medium">{q.period}</td>
                  <td className="text-right py-2 text-green-600 font-mono">{formatCurrency(q.receipts)}</td>
                  <td className="text-right py-2 text-red-500 font-mono">{formatCurrency(q.payments)}</td>
                  <td className={`text-right py-2 font-mono font-medium ${q.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {q.net >= 0 ? '+' : ''}{formatCurrency(q.net)}
                  </td>
                  <td className="text-right py-2 text-text-secondary">{q.txnCount}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-navy font-bold">
                <td className="py-2 text-navy">TOTAL</td>
                <td className="text-right py-2 text-green-600 font-mono">{formatCurrency(grandReceipts)}</td>
                <td className="text-right py-2 text-red-500 font-mono">{formatCurrency(grandPayments)}</td>
                <td className={`text-right py-2 font-mono ${grandBalance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {grandBalance >= 0 ? '+' : ''}{formatCurrency(grandBalance)}
                </td>
                <td className="text-right py-2 text-text-secondary">{realTxns.length}</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 3. CUMULATIVE BALANCE ═══════════════════════ */}
      <Section title="3. Cumulative Balance Trend" icon={<TrendingUp size={18} />}>
        <Card className="p-4">
          <p className="text-xs text-text-secondary mb-4">
            This area chart tracks the running total balance across all quarters.
            A rising line indicates the organization is accumulating funds; a falling line signals
            a period of higher expenses.
          </p>
          <div className="h-56 print:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Cumulative Balance"
                  stroke={NAVY}
                  fill={NAVY}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════ 4. ANNUAL SUMMARY ═══════════════════════ */}
      <Section title="4. Annual Summary" icon={<BarChart3 size={18} />}>
        <Card className="p-4 overflow-x-auto">
          <p className="text-xs text-text-secondary mb-4">
            Year-by-year comparison provides a high-level view of the organization's financial trajectory.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy/20">
                <th className="text-left py-2 font-semibold text-navy">Year</th>
                <th className="text-right py-2 font-semibold text-green-600">Receipts</th>
                <th className="text-right py-2 font-semibold text-red-500">Payments</th>
                <th className="text-right py-2 font-semibold text-navy">Net</th>
                <th className="text-right py-2 font-semibold text-text-secondary">Txns</th>
              </tr>
            </thead>
            <tbody>
              {yearlySummary.map((y, i) => (
                <tr key={y.year} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-2 font-bold text-navy">{y.year}</td>
                  <td className="text-right py-2 text-green-600 font-mono">{formatCurrency(y.receipts)}</td>
                  <td className="text-right py-2 text-red-500 font-mono">{formatCurrency(y.payments)}</td>
                  <td className={`text-right py-2 font-mono font-medium ${y.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {y.net >= 0 ? '+' : ''}{formatCurrency(y.net)}
                  </td>
                  <td className="text-right py-2 text-text-secondary">{y.txnCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 5. RECEIPT ANALYSIS ═══════════════════════ */}
      <Section title="5. Receipt Analysis" icon={<TrendingUp size={18} />}>
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary mb-4">
            Receipts are broken down by category to show where the organization's income comes from.
            The largest sources are typically circuit contributions, merchandise sales, and event income.
          </p>
          <div className="h-56 print:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie
                  data={receiptCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: 9 }}
                >
                  {receiptCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-green-200">
                <th className="text-left py-2 font-semibold text-navy">Category</th>
                <th className="text-right py-2 font-semibold text-green-600">Amount</th>
                <th className="text-right py-2 font-semibold text-text-secondary">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptCategories.map((c, i) => (
                <tr key={c.category} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}
                  </td>
                  <td className="text-right py-1.5 font-mono text-green-600">{formatCurrency(c.value)}</td>
                  <td className="text-right py-1.5 text-text-secondary">
                    {((c.value / grandReceipts) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-green-600 font-bold">
                <td className="py-2">TOTAL</td>
                <td className="text-right py-2 font-mono text-green-600">{formatCurrency(grandReceipts)}</td>
                <td className="text-right py-2">100%</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 6. PAYMENT ANALYSIS ═══════════════════════ */}
      <Section title="6. Payment Analysis" icon={<TrendingDown size={18} />}>
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary mb-4">
            Payments are categorized to show how the organization allocates its resources.
            Major expenditure typically goes to merchandise purchases, event expenses, and donations.
          </p>
          <div className="h-56 print:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie
                  data={paymentCategories}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: 9 }}
                >
                  {paymentCategories.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-red-200">
                <th className="text-left py-2 font-semibold text-navy">Category</th>
                <th className="text-right py-2 font-semibold text-red-500">Amount</th>
                <th className="text-right py-2 font-semibold text-text-secondary">% of Total</th>
              </tr>
            </thead>
            <tbody>
              {paymentCategories.map((c, i) => (
                <tr key={c.category} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}
                  </td>
                  <td className="text-right py-1.5 font-mono text-red-500">{formatCurrency(c.value)}</td>
                  <td className="text-right py-1.5 text-text-secondary">
                    {((c.value / grandPayments) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-red-500 font-bold">
                <td className="py-2">TOTAL</td>
                <td className="text-right py-2 font-mono text-red-500">{formatCurrency(grandPayments)}</td>
                <td className="text-right py-2">100%</td>
              </tr>
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 7. CIRCUIT PERFORMANCE ═══════════════════════ */}
      <Section title="7. Circuit Performance" icon={<Globe size={18} />}>
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary mb-4">
            Each circuit's total financial activity is summarized below. This shows how much each circuit has
            contributed (receipts) and how much has been spent on or through them (payments). The "Net" column
            indicates the circuit's net financial position relative to the central mission.
          </p>
          <div className="h-64 print:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={circuitPerformance} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6B7280' }} width={80} />
                <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="receipts" name="Receipts" fill={GREEN} radius={[0, 4, 4, 0]} />
                <Bar dataKey="payments" name="Payments" fill={RED} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy/20">
                <th className="text-left py-2 font-semibold text-navy">Circuit</th>
                <th className="text-right py-2 font-semibold text-green-600">Receipts</th>
                <th className="text-right py-2 font-semibold text-red-500">Payments</th>
                <th className="text-right py-2 font-semibold text-navy">Net</th>
                <th className="text-right py-2 font-semibold text-text-secondary">Txns</th>
              </tr>
            </thead>
            <tbody>
              {circuitPerformance.map((c, i) => (
                <tr key={c.name} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-2 font-medium">{c.name}</td>
                  <td className="text-right py-2 text-green-600 font-mono">{formatCurrency(c.receipts)}</td>
                  <td className="text-right py-2 text-red-500 font-mono">{formatCurrency(c.payments)}</td>
                  <td className={`text-right py-2 font-mono font-medium ${c.net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {c.net >= 0 ? '+' : ''}{formatCurrency(c.net)}
                  </td>
                  <td className="text-right py-2 text-text-secondary">{c.txnCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 8. OUTSTANDING DEBTS ═══════════════════════ */}
      <Section title="8. Outstanding Circuit Debts" icon={<AlertTriangle size={18} />}>
        <Card className="p-4">
          <p className="text-xs text-text-secondary mb-4">
            The following circuits have outstanding balances owed to the Europe Mission as of the end of the 2024/25 period.
            These amounts include a <strong>{CURRENCY_SYMBOL}40.00 handbook levy</strong> added per circuit.
            Total outstanding: <strong className="text-red-500">{formatCurrency(totalDebt)}</strong>
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-red-200 bg-red-50/50">
                <th className="text-left py-2 px-2 font-semibold text-navy">Circuit</th>
                <th className="text-right py-2 px-2 font-semibold text-red-500">Amount Owed</th>
                <th className="text-left py-2 px-2 font-semibold text-text-secondary">Details</th>
              </tr>
            </thead>
            <tbody>
              {outstandingDebts.map((d, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-2 px-2 font-medium">{d.circuit}</td>
                  <td className="text-right py-2 px-2 text-red-500 font-mono font-bold">{formatCurrency(d.amount)}</td>
                  <td className="py-2 px-2 text-text-secondary text-[10px] max-w-50 truncate">{d.notes?.split('(')[1]?.replace(')', '') || ''}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-red-500 font-bold">
                <td className="py-2 px-2 text-navy">TOTAL</td>
                <td className="text-right py-2 px-2 text-red-500 font-mono">{formatCurrency(totalDebt)}</td>
                <td className="py-2 px-2" />
              </tr>
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 9. TOP TRANSACTIONS ═══════════════════════ */}
      <Section title="9. Top Transactions" icon={<BarChart3 size={18} />}>
        <Card className="p-4 mb-3 overflow-x-auto">
          <h3 className="text-sm font-bold text-green-600 mb-2">Top 10 Receipts</h3>
          <p className="text-xs text-text-secondary mb-3">
            The largest individual receipts received across the entire reporting period.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-green-200">
                <th className="text-left py-1.5 font-semibold text-navy">#</th>
                <th className="text-left py-1.5 font-semibold text-navy">Date</th>
                <th className="text-left py-1.5 font-semibold text-navy">Description</th>
                <th className="text-right py-1.5 font-semibold text-green-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {topReceipts.map((t, i) => (
                <tr key={t.uid} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 text-text-secondary">{i + 1}</td>
                  <td className="py-1.5 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="py-1.5 max-w-45 truncate">{t.description}</td>
                  <td className="text-right py-1.5 font-mono text-green-600 font-bold">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-red-500 mb-2">Top 10 Payments</h3>
          <p className="text-xs text-text-secondary mb-3">
            The largest individual payments and expenses across the entire reporting period.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-red-200">
                <th className="text-left py-1.5 font-semibold text-navy">#</th>
                <th className="text-left py-1.5 font-semibold text-navy">Date</th>
                <th className="text-left py-1.5 font-semibold text-navy">Description</th>
                <th className="text-right py-1.5 font-semibold text-red-500">Amount</th>
              </tr>
            </thead>
            <tbody>
              {topPayments.map((t, i) => (
                <tr key={t.uid} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="py-1.5 text-text-secondary">{i + 1}</td>
                  <td className="py-1.5 whitespace-nowrap">{formatDate(t.date)}</td>
                  <td className="py-1.5 max-w-45 truncate">{t.description}</td>
                  <td className="text-right py-1.5 font-mono text-red-500 font-bold">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </Section>

      {/* ═══════════════════════ 10. INVENTORY & STOCK ═══════════════════════ */}
      <Section title="10. Inventory & Stock Balance" icon={<Package size={18} />}>
        <Card className="p-4 mb-3">
          <p className="text-xs text-text-secondary mb-4">
            Current stock levels based on the latest physical count. Items highlighted in
            <span className="text-orange-500 font-medium"> orange</span> are at or below their reorder level
            and may need restocking. Total stock value: <strong>{formatCurrency(totalStockValue)}</strong>.
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-navy/20">
                <th className="text-left py-2 font-semibold text-navy">Product</th>
                <th className="text-right py-2 font-semibold text-navy">Stock</th>
                <th className="text-right py-2 font-semibold text-text-secondary">Cost Price</th>
                <th className="text-right py-2 font-semibold text-text-secondary">Sell Price</th>
                <th className="text-right py-2 font-semibold text-navy">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {inventorySummary.map((p, i) => (
                <tr key={p.name} className={`${i % 2 === 0 ? 'bg-gray-50/50' : ''} ${p.lowStock ? 'text-orange-600' : ''}`}>
                  <td className="py-1.5 font-medium flex items-center gap-1">
                    {p.lowStock && <AlertTriangle size={10} className="text-orange-500" />}
                    {p.name}
                  </td>
                  <td className="text-right py-1.5 font-mono font-bold">{p.stock}</td>
                  <td className="text-right py-1.5 font-mono text-text-secondary">{formatCurrency(p.costPrice)}</td>
                  <td className="text-right py-1.5 font-mono text-text-secondary">{formatCurrency(p.sellingPrice)}</td>
                  <td className="text-right py-1.5 font-mono font-bold">{formatCurrency(p.stockValue)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-navy font-bold">
                <td className="py-2 text-navy" colSpan={4}>TOTAL STOCK VALUE</td>
                <td className="text-right py-2 font-mono text-navy">{formatCurrency(totalStockValue)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Stock value pie chart */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-navy mb-3">Stock Value Distribution</h3>
          <div className="h-56 print:h-44">
            <ResponsiveContainer width="100%" height="100%">
              <RPieChart>
                <Pie
                  data={inventorySummary.filter((p) => p.stockValue > 0)}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="stockValue"
                  nameKey="name"
                  label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                  style={{ fontSize: 9 }}
                >
                  {inventorySummary.filter((p) => p.stockValue > 0).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </RPieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════ 11. HANDBOOK DISTRIBUTION ═══════════════════════ */}
      <Section title="11. Handbook 2026 Distribution" icon={<BookOpen size={18} />}>
        <Card className="p-4">
          <p className="text-xs text-text-secondary mb-4">
            Handbook 2026 copies were distributed to circuits in Q1 2026. Each circuit receives copies for its
            members plus additional complimentary copies (indicated by "+1" in the original records).
          </p>
          {handbookDistribution.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy/20">
                  <th className="text-left py-2 font-semibold text-navy">Circuit</th>
                  <th className="text-right py-2 font-semibold text-navy">Copies</th>
                </tr>
              </thead>
              <tbody>
                {handbookDistribution.map((h, i) => (
                  <tr key={h.circuit} className={i % 2 === 0 ? 'bg-gray-50/50' : ''}>
                    <td className="py-1.5 font-medium">{h.circuit}</td>
                    <td className="text-right py-1.5 font-mono font-bold">{h.quantity}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-navy font-bold">
                  <td className="py-2 text-navy">TOTAL</td>
                  <td className="text-right py-2 font-mono text-navy">
                    {handbookDistribution.reduce((s, h) => s + h.quantity, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-xs text-text-light italic">No handbook distribution data found.</p>
          )}
        </Card>
      </Section>

      {/* ═══════════════════════ 12. KEY OBSERVATIONS ═══════════════════════ */}
      <Section title="12. Key Observations & Notes" icon={<CheckCircle size={18} />}>
        <Card className="p-4">
          <div className="space-y-3 text-xs text-text-secondary leading-relaxed">
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle size={12} className="text-green-600" />
              </div>
              <p>
                <strong>Positive Revenue Pipeline:</strong> Circuit contributions and merchandise sales consistently
                form the backbone of the organization's income, accounting for the majority of all receipts.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Building2 size={12} className="text-blue-600" />
              </div>
              <p>
                <strong>Circuit Engagement:</strong> All {circuits.length} circuits are actively participating.
                {circuitPerformance.length > 0 && (
                  <> The top contributing circuit is <strong>{circuitPerformance[0]?.name}</strong> with{' '}
                  {formatCurrency(circuitPerformance[0]?.receipts)} in total receipts.</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle size={12} className="text-orange-500" />
              </div>
              <p>
                <strong>Outstanding Debts:</strong>{' '}
                {formatCurrency(totalDebt)} remains outstanding from {outstandingDebts.length} circuits.
                Collection efforts should be prioritized for the larger balances.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center shrink-0 mt-0.5">
                <Package size={12} className="text-purple-600" />
              </div>
              <p>
                <strong>Inventory:</strong> Current stock is valued at {formatCurrency(totalStockValue)}.
                {inventorySummary.filter((p) => p.lowStock).length > 0 && (
                  <>{' '}{inventorySummary.filter((p) => p.lowStock).length} items are at or below reorder levels
                  and may need restocking soon.</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                <Gift size={12} className="text-gold" />
              </div>
              <p>
                <strong>Complimentary Distributions:</strong> Europe Mission cloth (3 full pieces and 8 yards) was
                provided to the Connectional Women's Fellowship as a goodwill gesture in Q1 2026.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                <Globe size={12} className="text-navy" />
              </div>
              <p>
                <strong>Hamburg Cloth Order (Nov 2026):</strong> A forward order of 47 pieces of Europe Mission cloth
                (€1,880.00) has been placed by Hamburg Circuit, with €1,575.00 already paid and a remaining
                balance of €305.00.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <div className="text-center py-6 border-t border-border/30 mt-6">
        <p className="text-[10px] text-text-light">
          {ORGANIZATION_NAME} — Comprehensive Financial Report — Confidential
        </p>
        <p className="text-[10px] text-text-light mt-1">
          Generated by Martha Virtual Assistant on {formatDate(new Date().toISOString().slice(0, 10))}
        </p>
      </div>
    </div>
  );
}
