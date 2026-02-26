// ============================================================
// Summary Card — Dashboard stat card with animated count
// ============================================================

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  color?: 'navy' | 'gold' | 'success' | 'alert';
  delay?: number;
}

const COLOR_MAP = {
  navy: {
    bg: 'bg-navy/5',
    icon: 'bg-navy text-white',
    value: 'text-navy',
  },
  gold: {
    bg: 'bg-gold/10',
    icon: 'bg-gold text-navy-dark',
    value: 'text-gold-dark',
  },
  success: {
    bg: 'bg-success-light',
    icon: 'bg-success text-white',
    value: 'text-success',
  },
  alert: {
    bg: 'bg-alert-light',
    icon: 'bg-alert text-white',
    value: 'text-alert',
  },
};

export default function SummaryCard({ label, value, icon, color = 'navy', delay = 0 }: SummaryCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`${colors.bg} rounded-2xl p-4 flex items-center gap-3`}
    >
      <div className={`${colors.icon} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider truncate">
          {label}
        </p>
        <motion.p
          className={`text-lg font-bold font-mono ${colors.value} truncate`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.3 }}
        >
          {value}
        </motion.p>
      </div>
    </motion.div>
  );
}
