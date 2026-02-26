// ============================================================
// Martha Chat Bubble — Speech bubble with typing animation
// ============================================================

import { motion, AnimatePresence } from 'framer-motion';

interface MarthaChatBubbleProps {
  message: string;
  className?: string;
}

export default function MarthaChatBubble({ message, className = '' }: MarthaChatBubbleProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        className={`martha-bubble max-w-xs sm:max-w-sm ${className}`}
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <p className="text-sm text-text-primary leading-relaxed">{message}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
          <span className="text-[10px] text-text-secondary font-medium tracking-wide uppercase">
            Martha
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
