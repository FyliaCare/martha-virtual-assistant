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
import { seedDatabase } from './db/seed';

function App() {
  useEffect(() => {
    seedDatabase();
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream pb-20">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/entry" element={<EntryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/circuits" element={<CircuitsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AnimatePresence>
        <FloatingActionButton />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
