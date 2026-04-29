import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, ChevronRight, Download, Search, Link2 } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

/** Compact phase icon for the floating pill */
function PhaseIcon({ phase }: { phase?: string }) {
  switch (phase) {
    case 'navigating':
      return <Link2 className="w-4 h-4 text-[#5856d6]" />;
    case 'analyzing':
      return <Search className="w-4 h-4 text-[#ff9f0a]" />;
    case 'scraped':
    case 'scraping':
      return <Download className="w-4 h-4 text-[#0071e3]" />;
    default:
      return <RefreshCcw className="w-4 h-4 text-[#0071e3] animate-spin" />;
  }
}

export default function SyncOverlay({ state }: { state: DashboardState }) {
  const { isSyncing, isActivityDrawerOpen, setIsActivityDrawerOpen, syncLogs } = state;

  // We hide this "Floating Bud" if the detailed drawer is already open or nothing is syncing
  if (isActivityDrawerOpen || !isSyncing) return null;

  const activeLogs = syncLogs.filter(l => l.status === 'loading');
  const doneLogs = syncLogs.filter(l => l.status === 'success');
  const lastActive = activeLogs[activeLogs.length - 1] || syncLogs[syncLogs.length - 1];

  // Aggregate total reviews being scraped across all active jobs
  const totalReviewsInProgress = activeLogs.reduce((acc, l) => acc + (l.reviewCount || 0), 0);

  // Build a smart subtitle
  let subtitle = 'Initializing engine...';
  if (lastActive?.cinema) {
    if (lastActive.phase === 'scraped' && lastActive.reviewCount) {
      subtitle = `${lastActive.cinema} — ${lastActive.reviewCount} reviews`;
    } else if (lastActive.phase === 'navigating') {
      subtitle = `Connecting to ${lastActive.cinema}...`;
    } else if (lastActive.phase === 'analyzing') {
      subtitle = `Analyzing ${lastActive.cinema}...`;
    } else {
      subtitle = `Current: ${lastActive.cinema}`;
    }
  }

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
          className="p-3 pr-4 flex items-center gap-3 border border-[var(--border-color)] overflow-hidden min-w-[280px] max-w-sm apple-card apple-card-elevated"
          style={{ 
            borderRadius: '980px' // Apple Pill Link shape
          }}
        >
          {/* Pulsing indicator with phase-aware icon */}
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
              <PhaseIcon phase={lastActive?.phase} />
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[var(--surface-1)] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-primary leading-[1.29] truncate" style={{ letterSpacing: '-0.224px' }}>
              {activeLogs.length > 0
                ? `Syncing ${activeLogs.length} location${activeLogs.length > 1 ? 's' : ''}...`
                : doneLogs.length > 0
                  ? 'Finishing up...'
                  : 'Data processing...'
              }
              {totalReviewsInProgress > 0 && (
                <span className="text-[#0071e3] ml-1 tabular-nums">({totalReviewsInProgress})</span>
              )}
            </p>
            <p className="text-[12px] text-secondary truncate mt-0.5 leading-[1.33]" style={{ letterSpacing: '-0.12px' }}>
              {subtitle}
            </p>
          </div>

          <div className="flex-shrink-0 ml-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-tertiary" />
          </div>
          
          {/* Progress bar at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--border-color)]">
              <motion.div 
                className="h-full bg-[#0071e3]"
                initial={{ width: '10%' }}
                animate={{ width: activeLogs.length > 0 ? '70%' : '95%' }}
                transition={{ duration: activeLogs.length > 0 ? 30 : 3, ease: "linear" }}
              />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
