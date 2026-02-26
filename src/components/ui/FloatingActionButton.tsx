// ============================================================
// Floating Action Button (FAB)
// ============================================================

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate('/entry')}
      className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-gold text-navy-dark shadow-gold flex items-center justify-center"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.5 }}
    >
      <Plus size={24} strokeWidth={2.5} />
    </motion.button>
  );
}
