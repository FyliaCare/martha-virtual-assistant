// ============================================================
// Circuits Page — Circuit list with debt tracking
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Users,
  Plus,
  Pencil,
  ChevronRight,
  Globe,
  Building2,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import MarthaAssistant from '../components/martha/MarthaAssistant';
import { useCircuitStore } from '../store/useCircuitStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { useMarthaStore } from '../store/useMarthaStore';
import { formatCurrency } from '../utils/helpers';
import type { Circuit } from '../types';

export default function CircuitsPage() {
  const { circuits, loading: circuitLoading, loadCircuits, addCircuit, updateCircuit } = useCircuitStore();
  const { transactions, loading: txnLoading, loadAll } = useTransactionStore();
  const { speak } = useMarthaStore();

  const loading = circuitLoading || txnLoading;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formSubBranches, setFormSubBranches] = useState('');
  const [formContact, setFormContact] = useState('');

  useEffect(() => {
    loadCircuits();
    loadAll();
    speak("Here are all your circuits. Tap on any to see their financial overview.", 'presenting');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormCountry('');
    setFormSubBranches('');
    setFormContact('');
    setEditingCircuit(null);
  };

  const openEdit = (circuit: Circuit) => {
    setEditingCircuit(circuit);
    setFormName(circuit.name);
    setFormCountry(circuit.country);
    setFormSubBranches(circuit.subBranches?.join(', ') || '');
    setFormContact(circuit.contactPerson || '');
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCountry.trim()) return;

    const subBranches = formSubBranches
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingCircuit) {
      await updateCircuit(editingCircuit.uid, {
        name: formName.trim(),
        country: formCountry.trim(),
        subBranches,
        contactPerson: formContact.trim() || undefined,
      });
      speak(`${formName} circuit updated!`, 'thumbsup');
    } else {
      await addCircuit({
        name: formName.trim(),
        country: formCountry.trim(),
        subBranches,
        contactPerson: formContact.trim() || undefined,
        isActive: true,
      });
      speak(`${formName} circuit added successfully!`, 'celebrating');
    }

    resetForm();
    setShowAddModal(false);
  };

  // Compute circuit financials
  const getCircuitStats = (circuitId: string) => {
    const circuitTxns = transactions.filter((t) => t.circuitId === circuitId);
    const receipts = circuitTxns
      .filter((t) => t.type === 'receipt')
      .reduce((sum, t) => sum + t.amount, 0);
    const payments = circuitTxns
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalReceipts: receipts,
      totalPayments: payments,
      balance: receipts - payments,
      transactionCount: circuitTxns.length,
    };
  };

  return (
    <div className="pb-4 px-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-navy">Circuits</h1>
            <p className="text-xs text-text-secondary">{circuits.length} registered circuits</p>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Martha */}
      <div className="mb-6">
        <MarthaAssistant size="sm" layout="horizontal" />
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
      )}

      {/* Circuit List */}
      {circuits.length === 0 ? (
        <Card className="p-8 text-center">
          <Globe size={32} className="mx-auto text-text-light mb-3" />
          <p className="text-sm text-text-secondary mb-1">No circuits found</p>
          <p className="text-xs text-text-light">
            Add your first circuit to start tracking
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {circuits.map((circuit, i) => {
            const stats = getCircuitStats(circuit.uid);
            const isExpanded = expandedId === circuit.uid;

            return (
              <Card key={circuit.uid} delay={i * 0.05}>
                <motion.div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : circuit.uid)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                      <MapPin size={18} className="text-navy" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy">{circuit.name}</p>
                      <p className="text-[10px] text-text-secondary flex items-center gap-1">
                        <Globe size={10} /> {circuit.country}
                        {circuit.subBranches && circuit.subBranches.length > 0 && (
                          <span className="ml-1">
                            • {circuit.subBranches.length} sub-branch
                            {circuit.subBranches.length > 1 ? 'es' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono text-navy">
                        {formatCurrency(stats.totalReceipts)}
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {stats.transactionCount} txns
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-text-light transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </motion.div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 border-t border-border/30">
                        <div className="grid grid-cols-3 gap-3 mt-3 mb-3">
                          <div className="text-center p-2 bg-success/5 rounded-xl">
                            <p className="text-xs font-bold text-success">
                              {formatCurrency(stats.totalReceipts)}
                            </p>
                            <p className="text-[9px] text-text-secondary">Receipts</p>
                          </div>
                          <div className="text-center p-2 bg-alert/5 rounded-xl">
                            <p className="text-xs font-bold text-alert">
                              {formatCurrency(stats.totalPayments)}
                            </p>
                            <p className="text-[9px] text-text-secondary">Payments</p>
                          </div>
                          <div className="text-center p-2 bg-gold/10 rounded-xl">
                            <p className={`text-xs font-bold ${stats.balance >= 0 ? 'text-success' : 'text-alert'}`}>
                              {formatCurrency(stats.balance)}
                            </p>
                            <p className="text-[9px] text-text-secondary">Balance</p>
                          </div>
                        </div>

                        {circuit.subBranches && circuit.subBranches.length > 0 && (
                          <div className="mb-3">
                            <p className="text-[10px] font-semibold text-text-secondary mb-1">
                              Sub-branches
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {circuit.subBranches.map((sb) => (
                                <span
                                  key={sb}
                                  className="text-[10px] px-2 py-0.5 bg-navy/5 text-navy rounded-full"
                                >
                                  {sb}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {circuit.contactPerson && (
                          <p className="text-[10px] text-text-secondary flex items-center gap-1">
                            <Users size={10} /> Contact: {circuit.contactPerson}
                          </p>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(circuit);
                          }}
                        >
                          <Pencil size={12} className="mr-1" /> Edit
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={editingCircuit ? 'Edit Circuit' : 'Add Circuit'}
      >
        <div className="space-y-4">
          <Input
            label="Circuit Name"
            placeholder="e.g. Hamburg"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            icon={<Building2 size={16} />}
          />
          <Input
            label="Country"
            placeholder="e.g. Germany"
            value={formCountry}
            onChange={(e) => setFormCountry(e.target.value)}
            icon={<Globe size={16} />}
          />
          <Input
            label="Sub-branches (comma separated)"
            placeholder="e.g. Hannover, Wesley"
            value={formSubBranches}
            onChange={(e) => setFormSubBranches(e.target.value)}
            icon={<MapPin size={16} />}
          />
          <Input
            label="Contact Person (optional)"
            placeholder="e.g. Pastor John"
            value={formContact}
            onChange={(e) => setFormContact(e.target.value)}
            icon={<Users size={16} />}
          />
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={!formName.trim()}
          >
            {editingCircuit ? 'Save Changes' : 'Add Circuit'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
