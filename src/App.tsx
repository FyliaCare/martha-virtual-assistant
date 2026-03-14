// ============================================================
// App — Root component with routing
// ============================================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './components/ui/BottomNav';
import FloatingActionButton from './components/ui/FloatingActionButton';
import HomePage from './pages/HomePage';
import EntryPage from './pages/EntryPage';
import ReportsPage from './pages/ReportsPage';
import InventoryPage from './pages/InventoryPage';
import CircuitsPage from './pages/CircuitsPage';
import SettingsPage from './pages/SettingsPage';
import ComprehensiveReportPage from './pages/ComprehensiveReportPage';
import EditDataPage from './pages/EditDataPage';
import { seedDatabase } from './db/seed';
import { pullFromCloud } from './db/sync';

function App() {
  useEffect(() => {
    async function init() {
      // 1. Pull latest data from Firestore (merges with local)
      await pullFromCloud();
      // 2. Seed if needed (first launch only, then pushes to cloud)
      await seedDatabase();
    }
    init();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream lg:flex">
        {/* Desktop sidebar nav (hidden on mobile) */}
        <BottomNav />

        {/* Main content area */}
        <main className="flex-1 pb-20 lg:pb-0 lg:ml-56">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/entry" element={<EntryPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/circuits" element={<CircuitsPage />} />
              <Route path="/comprehensive-report" element={<ComprehensiveReportPage />} />
              <Route path="/edit-data" element={<EditDataPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </AnimatePresence>
          <FloatingActionButton />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
