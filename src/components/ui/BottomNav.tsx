// ============================================================
// Bottom Navigation Bar — Mobile-first
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, PenLine, BarChart3, Package, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/entry', label: 'Enter', icon: PenLine },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/inventory', label: 'Stock', icon: Package },
  { path: '/circuits', label: 'Circuits', icon: User },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-border/60">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-[60px]"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gold"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={22}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-navy' : 'text-text-light'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-navy' : 'text-text-light'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
