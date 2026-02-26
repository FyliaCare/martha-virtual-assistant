// ============================================================
// Reports Page — Professional analytics, advanced stats, PDF/Word export
// ============================================================

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  FileText,
  FileType2,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Target,
  Calendar,
  Zap,
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
import { formatCurrency, formatCurrencyShort, getCurrentQuarter, getCurrentYear, formatDate } from '../utils/helpers';
import { QUARTER_LABELS, ALL_CATEGORIES } from '../utils/constants';
import { buildReportData, fmtPct } from '../utils/reportData';
import { generatePDF } from '../utils/pdfReport';
import { generateWord } from '../utils/wordReport';
import type { Quarter } from '../types';

const PIE_COLORS = ['#1B2A4A', '#D4A843', '#2D8B55', '#E85D4A', '#6366F1', '#EC4899', '#F59E0B', '#14B8A6', '#8B5CF6', '#EF4444'];

export default function ReportsPage() {
  const { transactions, loading: txnLoading, loadAll } = useTransactionStore();
  const { circuits, loading: circuitLoading, loadCircuits } = useCircuitStore();
  const { speak } = useMarthaStore();

  const loading = txnLoading || circuitLoading;

  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(getCurrentQuarter());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'receipts' | 'payments' | 'advanced'>('overview');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingWord, setIsGeneratingWord] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadAll();
    loadCircuits();
    speak("Here are your financial analytics. Use the filters to explore different quarters.", 'presenting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select a quarter that has data if current is empty
  useEffect(() => {
    if (transactions.length > 0) {
      const hasData = transactions.some(
        (t) => t.quarter === selectedQuarter && t.year === selectedYear
      );
      if (!hasData) {
        const sorted = [...transactions].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.quarter - a.quarter;
        });
        if (sorted.length > 0) {
          setSelectedQuarter(sorted[0].quarter);
          setSelectedYear(sorted[0].year);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions]);

  const filteredTxns = useMemo(
    () => transactions.filter((t) => t.quarter === selectedQuarter && t.year === selectedYear),
    [transactions, selectedQuarter, selectedYear]
  );

  const receipts = useMemo(() => filteredTxns.filter((t) => t.type === 'receipt'), [filteredTxns]);
  const payments = useMemo(() => filteredTxns.filter((t) => t.type === 'payment'), [filteredTxns]);
  const totalReceipts = receipts.reduce((s, t) => s + t.amount, 0);
  const totalPayments = payments.reduce((s, t) => s + t.amount, 0);
  const balance = totalReceipts - totalPayments;

  // Full report data (used for advanced stats and export)
  const reportData = useMemo(
    () => buildReportData(transactions, circuits, selectedQuarter, selectedYear),
    [transactions, circuits, selectedQuarter, selectedYear]
  );

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
    const startMonth = (selectedQuarter - 1) * 3;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return [0, 1, 2].map((offset) => {
      const monthIdx = startMonth + offset;
      const monthTxns = filteredTxns.filter((t) => new Date(t.date).getMonth() === monthIdx);
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

  // ── Export handlers ──
  const handleCSV = () => {
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
    speak('CSV exported!', 'thumbsup');
    setShowExportMenu(false);
  };

  const handlePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      generatePDF(reportData);
      speak('Professional PDF report generated! Check your downloads.', 'celebrating');
    } catch (err) {
      console.error(err);
      speak('Failed to generate PDF. Please try again.', 'warning');
    } finally {
      setIsGeneratingPDF(false);
      setShowExportMenu(false);
    }
  };

  const handleWord = async () => {
    setIsGeneratingWord(true);
    try {
      await generateWord(reportData);
      speak('Word document generated! You can edit it in Microsoft Word or Google Docs.', 'celebrating');
    } catch (err) {
      console.error(err);
      speak('Failed to generate Word document. Please try again.', 'warning');
    } finally {
      setIsGeneratingWord(false);
      setShowExportMenu(false);
    }
  };

  const adv = reportData.advanced;

  const tabs = [
    { key: 'overview' as const, label: 'Overview' },
    { key: 'receipts' as const, label: 'Receipts' },
    { key: 'payments' as const, label: 'Payments' },
    { key: 'advanced' as const, label: 'Analytics' },
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
          <div className="relative">
            <Button
              variant="gold"
              size="sm"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={filteredTxns.length === 0}
            >
              <Download size={14} className="mr-1" />
              Export
            </Button>

            {/* Export Dropdown */}
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg border border-border/50 py-2 min-w-[200px]">
                  <button
                    onClick={handlePDF}
                    disabled={isGeneratingPDF}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <FileText size={16} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">PDF Report</p>
                      <p className="text-[10px] text-text-secondary">Professional formatted report</p>
                    </div>
                    {isGeneratingPDF && (
                      <div className="ml-auto w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                    )}
                  </button>
                  <button
                    onClick={handleWord}
                    disabled={isGeneratingWord}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileType2 size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Word Document</p>
                      <p className="text-[10px] text-text-secondary">Editable .docx file</p>
                    </div>
                    {isGeneratingWord && (
                      <div className="ml-auto w-4 h-4 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                    )}
                  </button>
                  <div className="border-t border-border/30 my-1" />
                  <button
                    onClick={handleCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <BarChart3 size={16} className="text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">CSV Spreadsheet</p>
                      <p className="text-[10px] text-text-secondary">For Excel / Google Sheets</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Martha */}
      <div className="mb-4">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}

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
        {adv.receiptGrowthVsPrevQ !== null && (
          <div className="mt-2 flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
              {adv.receiptGrowthVsPrevQ >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              Receipts {fmtPct(adv.receiptGrowthVsPrevQ)}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-alert/10 text-alert">
              {(adv.paymentGrowthVsPrevQ ?? 0) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              Payments {fmtPct(adv.paymentGrowthVsPrevQ)}
            </span>
          </div>
        )}
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
                className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
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
                        formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #E5E7EB' }}
                      />
                      <Bar dataKey="receipts" name="Receipts" fill="#2D8B55" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="payments" name="Payments" fill="#E85D4A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

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

          {/* ═══════════ RECEIPTS TAB ═══════════ */}
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
                        <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} />
                      </RPieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

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

          {/* ═══════════ PAYMENTS TAB ═══════════ */}
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
                        <Tooltip formatter={(value: string | number | undefined) => formatCurrency(Number(value) || 0)} />
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

          {/* ═══════════ ADVANCED ANALYTICS TAB ═══════════ */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              {/* Financial Health Indicator */}
              <Card className="p-4" delay={0.2}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity size={14} className="text-navy" />
                  <h3 className="text-xs font-bold text-navy">Financial Health</h3>
                </div>
                <div className="flex items-center justify-center py-2">
                  <div className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold
                    ${adv.surplusDeficit === 'surplus' ? 'bg-success/10 text-success' : ''}
                    ${adv.surplusDeficit === 'deficit' ? 'bg-alert/10 text-alert' : ''}
                    ${adv.surplusDeficit === 'balanced' ? 'bg-gold/10 text-gold-dark' : ''}
                  `}>
                    {adv.surplusDeficit === 'surplus' && <TrendingUp size={16} />}
                    {adv.surplusDeficit === 'deficit' && <TrendingDown size={16} />}
                    {adv.surplusDeficit === 'balanced' && <Minus size={16} />}
                    {adv.surplusDeficit.toUpperCase()}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-text-secondary">Operating Ratio</p>
                    <p className="text-sm font-bold text-navy font-mono">
                      {(adv.operatingRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-text-light">Payments / Receipts</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-xl">
                    <p className="text-[10px] text-text-secondary">Median Transaction</p>
                    <p className="text-sm font-bold text-navy font-mono">
                      {formatCurrency(adv.medianTransaction)}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Averages */}
              <Card className="p-4" delay={0.25}>
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-navy" />
                  <h3 className="text-xs font-bold text-navy">Transaction Averages</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Average Transaction</span>
                    <span className="text-xs font-bold text-navy font-mono">{formatCurrency(adv.avgTransactionSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Average Receipt</span>
                    <span className="text-xs font-bold text-success font-mono">{formatCurrency(adv.avgReceiptSize)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Average Payment</span>
                    <span className="text-xs font-bold text-alert font-mono">{formatCurrency(adv.avgPaymentSize)}</span>
                  </div>
                </div>
              </Card>

              {/* Quarter-over-Quarter */}
              {adv.receiptGrowthVsPrevQ !== null && (
                <Card className="p-4" delay={0.3}>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={14} className="text-navy" />
                    <h3 className="text-xs font-bold text-navy">vs Previous Quarter</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-xs text-text-secondary">Receipts</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-light font-mono">
                          {formatCurrency(adv.prevQReceipts)} → {formatCurrency(totalReceipts)}
                        </span>
                        <span className={`text-xs font-bold font-mono ${adv.receiptGrowthVsPrevQ >= 0 ? 'text-success' : 'text-alert'}`}>
                          {fmtPct(adv.receiptGrowthVsPrevQ)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-alert" />
                        <span className="text-xs text-text-secondary">Payments</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-text-light font-mono">
                          {formatCurrency(adv.prevQPayments)} → {formatCurrency(totalPayments)}
                        </span>
                        <span className={`text-xs font-bold font-mono ${(adv.paymentGrowthVsPrevQ ?? 0) <= 0 ? 'text-success' : 'text-alert'}`}>
                          {fmtPct(adv.paymentGrowthVsPrevQ)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Top Categories */}
              <Card className="p-4" delay={0.35}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-navy" />
                  <h3 className="text-xs font-bold text-navy">Top Income Sources</h3>
                </div>
                <div className="space-y-2">
                  {adv.topReceiptCategories.map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-navy/5 flex items-center justify-center text-[10px] font-bold text-navy">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-primary truncate">{cat.label}</span>
                          <span className="text-xs font-bold text-success font-mono ml-2">{formatCurrency(cat.amount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-success rounded-full transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-text-light font-mono w-10 text-right">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-4" delay={0.4}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-navy" />
                  <h3 className="text-xs font-bold text-navy">Top Expense Categories</h3>
                </div>
                <div className="space-y-2">
                  {adv.topPaymentCategories.map((cat, i) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-navy/5 flex items-center justify-center text-[10px] font-bold text-navy">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-text-primary truncate">{cat.label}</span>
                          <span className="text-xs font-bold text-alert font-mono ml-2">{formatCurrency(cat.amount)}</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-alert rounded-full transition-all"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-text-light font-mono w-10 text-right">{cat.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Notable Transactions */}
              <Card className="p-4" delay={0.45}>
                <h3 className="text-xs font-bold text-navy mb-3">Notable Transactions</h3>
                <div className="space-y-3">
                  {adv.largestReceipt && (
                    <div className="p-3 bg-success/5 rounded-xl border border-success/20">
                      <p className="text-[10px] text-success font-semibold uppercase tracking-wider mb-1">Largest Receipt</p>
                      <p className="text-sm font-bold text-success font-mono">{formatCurrency(adv.largestReceipt.amount)}</p>
                      <p className="text-xs text-text-primary mt-1">{adv.largestReceipt.description}</p>
                      <p className="text-[10px] text-text-secondary">{formatDate(adv.largestReceipt.date)}</p>
                    </div>
                  )}
                  {adv.largestPayment && (
                    <div className="p-3 bg-alert/5 rounded-xl border border-alert/20">
                      <p className="text-[10px] text-alert font-semibold uppercase tracking-wider mb-1">Largest Payment</p>
                      <p className="text-sm font-bold text-alert font-mono">{formatCurrency(adv.largestPayment.amount)}</p>
                      <p className="text-xs text-text-primary mt-1">{adv.largestPayment.description}</p>
                      <p className="text-[10px] text-text-secondary">{formatDate(adv.largestPayment.date)}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Activity Summary */}
              <Card className="p-4" delay={0.5}>
                <h3 className="text-xs font-bold text-navy mb-3">Activity Summary</h3>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-bold text-navy">{reportData.totalTransactions}</p>
                    <p className="text-[10px] text-text-secondary">Total Txns</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-bold text-success">{reportData.receiptCount}</p>
                    <p className="text-[10px] text-text-secondary">Receipts</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-xl">
                    <p className="text-lg font-bold text-alert">{reportData.paymentCount}</p>
                    <p className="text-[10px] text-text-secondary">Payments</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-success/5 rounded-xl">
                    <p className="text-[10px] text-text-secondary">Busiest Month</p>
                    <p className="text-xs font-bold text-navy">{adv.busyMonth}</p>
                  </div>
                  <div className="p-2 bg-gold/5 rounded-xl">
                    <p className="text-[10px] text-text-secondary">Quietest Month</p>
                    <p className="text-xs font-bold text-navy">{adv.quietMonth}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
