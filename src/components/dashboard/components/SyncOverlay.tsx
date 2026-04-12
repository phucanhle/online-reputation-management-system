import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCcw, ChevronRight } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

export default function SyncOverlay({ state }: { state: DashboardState }) {
  const { isSyncing, isActivityDrawerOpen, setIsActivityDrawerOpen, syncLogs } = state;

  // We hide this "Floating Bud" if the detailed drawer is already open or nothing is syncing
  if (isActivityDrawerOpen || !isSyncing) return null;

  const activeLogs = syncLogs.filter(l => l.status === 'loading');
  const lastUpdate = syncLogs[syncLogs.length - 1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={() => setIsActivityDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-[80] cursor-pointer group"
      >
        <div 
          className="p-3 pr-4 flex items-center gap-3 shadow-product border border-[var(--border-color)] overflow-hidden min-w-[260px] max-w-sm"
          style={{ 
            background: 'var(--surface-1)', 
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '980px' // Apple Pill Link shape
          }}
        >
          {/* Pulsing indicator */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
              <RefreshCcw className="w-5 h-5 text-[#0071e3] animate-spin" />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--surface-1)] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-primary leading-[1.29] truncate" style={{ letterSpacing: '-0.224px' }}>
              {activeLogs.length > 0 ? `Syncing ${activeLogs.length} locations...` : 'Data processing...'}
            </p>
            <p className="text-[12px] text-secondary truncate mt-0.5 leading-[1.33]" style={{ letterSpacing: '-0.12px' }}>
              {lastUpdate?.cinema ? `Current: ${lastUpdate.cinema}` : 'Initializing engine...'}
            </p>
          </div>

          <div className="flex-shrink-0 ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-tertiary" />
          </div>
          
          {/* Progress simulated bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border-color)]">
              <motion.div 
                className="h-full bg-[#0071e3]"
                initial={{ width: '10%' }}
                animate={{ width: '90%' }}
                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
              />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
