// ============================================================
// Modal Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const SIZE_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-2xl mx-4',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-overlay z-50"
            onClick={onClose}
          />

          {/* Panel — slides up on mobile, centered dialog on desktop */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`
              fixed bottom-0 left-0 right-0 z-50
              bg-white rounded-t-3xl
              max-h-[90vh] overflow-y-auto
              lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2
              lg:left-1/2 lg:-translate-x-1/2
              lg:rounded-2xl lg:shadow-xl lg:border lg:border-border/50
              lg:w-full
              ${SIZE_MAP[size]} mx-auto
            `}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="w-10 h-1 rounded-full bg-border"></div>
            </div>

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-3 lg:py-4 border-b border-border/50">
                <h2 className="text-lg font-bold text-navy">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-cream-dark transition-colors"
                >
                  <X size={20} className="text-text-secondary" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4 pb-8 lg:pb-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
