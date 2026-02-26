// ============================================================
// Card Component
// ============================================================

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  delay?: number;
}

export default function Card({ children, className = '', onClick, hover = false, delay = 0 }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      whileHover={hover ? { y: -2, boxShadow: '0 8px 30px rgba(27, 42, 74, 0.12)' } : undefined}
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-border/50
        ${onClick ? 'cursor-pointer active:bg-cream-dark' : ''}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
