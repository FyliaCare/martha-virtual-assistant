// ============================================================
// Navigation — Bottom bar on mobile, sidebar on desktop
// ============================================================

import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, PenLine, BarChart3, Package, ClipboardEdit, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/entry', label: 'Enter', icon: PenLine },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
  { path: '/edit-data', label: 'Edit Data', icon: ClipboardEdit },
  { path: '/inventory', label: 'Stock', icon: Package },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* ═══ Mobile Bottom Bar ═══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-border/60 lg:hidden">
        <div className="flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.filter(i => i.path !== '/settings').map((item) => {
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

      {/* ═══ Desktop Sidebar ═══ */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-56 lg:bg-navy lg:z-40">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md">
            <img src="/icons/icon-96.png" alt="Martha" className="w-full h-full" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Martha</p>
            <p className="text-[10px] text-white/50">Europe Mission Finance</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold/20 text-gold'
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-gold"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-[10px] text-white/30">Martha v1.0</p>
        </div>
      </aside>
    </>
  );
}
