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
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 min-w-15"
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
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-navy lg:z-40 lg:shadow-xl">
        {/* Brand header */}
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg ring-2 ring-gold/30">
            <img src="/icons/icon-96.png" alt="Martha" className="w-full h-full" />
          </div>
          <div>
            <p className="text-base font-bold text-white tracking-tight">Martha</p>
            <p className="text-[11px] text-gold/70 font-medium">Europe Mission Finance</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gold/15 text-gold shadow-sm'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="w-1.5 h-6 rounded-full bg-gold"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <p className="text-[11px] text-white/50 font-medium">Synced with cloud</p>
          </div>
          <p className="text-[10px] text-white/25">Martha v1.0 — Europe Mission</p>
        </div>
      </aside>
    </>
  );
}
