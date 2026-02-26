// ============================================================
// Reports Page — Analytics, charts, and report generation
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
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
} from 'recharts';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import SummaryCard from '../components/ui/SummaryCard';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useTransactionStore } from '../store/useTransactionStore';
import { useCircuitStore } from '../store/useCircuitStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency, formatCurrencyShort, getCurrentQuarter, getCurrentYear } from '../utils/helpers';
import { QUARTER_LABELS, ALL_CATEGORIES } from '../utils/constants';
import type { Quarter } from '../types';

const PIE_COLORS = ['#1B2A4A', '#D4A843', '#2D8B55', '#E85D4A', '#6366F1', '#EC4899', '#F59E0B', '#14B8A6', '#8B5CF6', '#EF4444'];

export default function ReportsPage() {
  const { transactions, loadAll } = useTransactionStore();
  const { circuits, loadCircuits } = useCircuitStore();
  const { speak } = useMarthaStore();

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'payments'>('overview');

  useEffect(() => {
    loadAll();
    loadCircuits();
    speak("Here are your financial analytics. Use the filters to explore different quarters.", 'presenting');
  }, []);

  const filteredTxns = useMemo(
    () => transactions.filter((t) => t.quarter === selectedQuarter && t.year === selectedYear),
    [transactions, selectedQuarter, selectedYear]
  );

  const receipts = useMemo(() => filteredTxns.filter((t) => t.type === 'receipt'), [filteredTxns]);
  const payments = useMemo(() => filteredTxns.filter((t) => t.type === 'payment'), [filteredTxns]);
  const totalReceipts = receipts.reduce((s, t) => s + t.amount, 0);
  const totalPayments = payments.reduce((s, t) => s + t.amount, 0);
  const balance = totalReceipts - totalPayments;

  // Category breakdown for pie charts
  const receiptsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    receipts.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        name: ALL_CATEGORIES.find((c) => c.value === category)?.label || category,
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [receipts]);

  const paymentsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        name: ALL_CATEGORIES.find((c) => c.value === category)?.label || category,
        value: amount,
      }))
      .sort((a, b) => b.value - a.value);
  }, [payments]);

  // Monthly breakdown for bar chart
  const monthlyData = useMemo(() => {
    // Build month indices for the quarter
    // Build month indices for the quarter
    const startMonth = (selectedQuarter - 1) * 3;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return [0, 1, 2].map((offset) => {
      const monthIdx = startMonth + offset;
      const monthTxns = filteredTxns.filter((t) => {
        const d = new Date(t.date);
        return d.getMonth() === monthIdx;
      });
      return {
        month: monthNames[monthIdx],
        receipts: monthTxns.filter((t) => t.type === 'receipt').reduce((s, t) => s + t.amount, 0),
        payments: monthTxns.filter((t) => t.type === 'payment').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [filteredTxns, selectedQuarter]);

  // Circuit breakdown
  const circuitBreakdown = useMemo(() => {
    const map = new Map<string, { receipts: number; payments: number }>();
    filteredTxns.forEach((t) => {
      if (!t.circuitId) return;
      const existing = map.get(t.circuitId) || { receipts: 0, payments: 0 };
      if (t.type === 'receipt') existing.receipts += t.amount;
      else existing.payments += t.amount;
      map.set(t.circuitId, existing);
    });
    return Array.from(map.entries())
      .map(([circuitId, data]) => ({
        name: circuits.find((c) => c.uid === circuitId)?.name || 'Unknown',
        ...data,
        net: data.receipts - data.payments,
      }))
      .sort((a, b) => b.receipts - a.receipts);
  }, [filteredTxns, circuits]);

  // Year options
  const yearOptions = useMemo(() => {
    const years = new Set(transactions.map((t) => t.year));
    years.add(getCurrentYear());
    return Array.from(years)
      .sort((a, b) => b - a)
      .map((y) => ({ value: String(y), label: String(y) }));
  }, [transactions]);

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Circuit', 'Notes'];
    const rows = filteredTxns.map((t) => [
      t.date,
      t.type,
      ALL_CATEGORIES.find((c) => c.value === t.category)?.label || t.category,
      t.description,
      t.amount.toFixed(2),
      circuits.find((c) => c.uid === t.circuitId)?.name || '',
      t.notes || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `europe-mission-${QUARTER_LABELS[selectedQuarter]?.replace(/\s/g, '-')}-${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    speak('Report exported as CSV! You can open it in Excel or Google Sheets.', 'celebrating');
  };

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'receipts' as const, label: 'Receipts' },
    { key: 'payments' as const, label: 'Payments' },
  ];

  return (
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-navy">Reports</h1>
            <p className="text-xs text-text-secondary">Financial Analytics</p>
          </div>
          <Button variant="gold" size="sm" onClick={handleExport} disabled={filteredTxns.length === 0}>
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Martha */}
      <div className="mb-4">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Quarter/Year Filter */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-secondary" />
          <div className="flex-1 grid grid-cols-2 gap-2">
            <Select
              value={String(selectedQuarter)}
              onChange={(e) => setSelectedQuarter(parseInt(e.target.value) as Quarter)}
              options={[
                { value: '1', label: 'Q1: Jan–Mar' },
                { value: '2', label: 'Q2: Apr–Jun' },
                { value: '3', label: 'Q3: Jul–Sep' },
                { value: '4', label: 'Q4: Oct–Dec' },
              ]}
            />
            <Select
              value={String(selectedYear)}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              options={yearOptions}
            />
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SummaryCard
          label="Receipts"
          value={formatCurrency(totalReceipts)}
          icon={<ArrowUpRight size={16} />}
          color="success"
          delay={0.05}
        />
        <SummaryCard
          label="Payments"
          value={formatCurrency(totalPayments)}
          icon={<ArrowDownRight size={16} />}
          color="alert"
          delay={0.1}
        />
      </div>
      <Card className="p-4 mb-6 text-center" delay={0.15}>
        <p className="text-xs text-text-secondary mb-1">Net Balance</p>
        <p className={`text-2xl font-bold font-mono ${balance >= 0 ? 'text-success' : 'text-alert'}`}>
          {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
        </p>
      </Card>

      {filteredTxns.length === 0 ? (
        <Card className="p-8 text-center">
          <BarChart3 size={32} className="mx-auto text-text-light mb-3" />
          <p className="text-sm text-text-secondary mb-1">No data for this period</p>
          <p className="text-xs text-text-light">
            Try selecting a different quarter or start entering transactions
          </p>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Monthly Bar Chart */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <Card className="p-4" delay={0.2}>
                <h3 className="text-xs font-bold text-navy mb-3">Monthly Breakdown</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrencyShort(v)} />
                      <Tooltip
                        formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E5E7EB' }}
                      />
                      <Bar dataKey="receipts" name="Receipts" fill="#2D8B55" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="payments" name="Payments" fill="#E85D4A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Circuit Breakdown */}
              {circuitBreakdown.length > 0 && (
                <Card className="p-4" delay={0.25}>
                  <h3 className="text-xs font-bold text-navy mb-3">By Circuit</h3>
                  <div className="space-y-2">
                    {circuitBreakdown.map((cb) => (
                      <div key={cb.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <span className="text-xs font-medium text-text-primary">{cb.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-success font-mono">+{formatCurrency(cb.receipts)}</span>
                          <span className="text-[10px] text-alert font-mono">-{formatCurrency(cb.payments)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Receipts Breakdown */}
          {activeTab === 'receipts' && (
            <div className="space-y-4">
              {receiptsByCategory.length > 0 && (
                <Card className="p-4" delay={0.2}>
                  <h3 className="text-xs font-bold text-navy mb-3">Receipts by Category</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={receiptsByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {receiptsByCategory.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {/* Detailed list */}
              <Card className="p-4" delay={0.25}>
                <h3 className="text-xs font-bold text-navy mb-3">All Receipts</h3>
                <div className="space-y-2">
                  {receipts
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((txn) => (
                    <div key={txn.uid} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-medium text-text-primary truncate">{txn.description}</p>
                        <p className="text-[9px] text-text-secondary">
                          {new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-success">+{formatCurrency(txn.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Payments Breakdown */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {paymentsByCategory.length > 0 && (
                <Card className="p-4" delay={0.2}>
                  <h3 className="text-xs font-bold text-navy mb-3">Payments by Category</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={paymentsByCategory}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {paymentsByCategory.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              <Card className="p-4" delay={0.25}>
                <h3 className="text-xs font-bold text-navy mb-3">All Payments</h3>
                <div className="space-y-2">
                  {payments
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((txn) => (
                    <div key={txn.uid} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-medium text-text-primary truncate">{txn.description}</p>
                        <p className="text-[9px] text-text-secondary">
                          {new Date(txn.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span className="text-xs font-bold font-mono text-alert">-{formatCurrency(txn.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
