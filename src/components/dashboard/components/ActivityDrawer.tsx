import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCcw, Loader2, CheckCircle2, XCircle, Activity, Ghost } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

export default function ActivityDrawer({ state }: { state: DashboardState }) {
  const { isActivityDrawerOpen, setIsActivityDrawerOpen, isSyncing, syncLogs } = state;

  return (
    <AnimatePresence>
      {isActivityDrawerOpen && (
        <>
          {/* Backdrop (Lightweight) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsActivityDrawerOpen(false)}
            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px] transition-all"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-full max-w-sm bg-[var(--surface-1)] border-l border-[var(--border-color)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-apple bg-[#0071e3]/10 flex items-center justify-center">
                  <Activity className={`w-4 h-4 text-[#0071e3] ${isSyncing ? 'animate-pulse' : ''}`} />
                </div>
                <div>
                  <h3 className="text-[21px] font-bold text-primary leading-[1.19]" style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}>
                    Activity
                  </h3>
                  <p className="text-[12px] text-secondary mt-1 font-semibold uppercase tracking-[-0.12px] leading-[1.33]">
                    {isSyncing ? 'Sync in progress' : 'Idle'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActivityDrawerOpen(false)}
                className="p-2 text-secondary hover:text-primary hover:bg-[var(--surface-2)] rounded-apple transition-colors"
                style={{ borderRadius: '8px' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Log List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-2.5">
              {syncLogs.length === 0 ? (
                <div className="py-24 flex flex-col items-center gap-4 text-center opacity-40">
                  <Ghost className="w-10 h-10" />
                  <p className="text-[17px] font-normal leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>No recent activity</p>
                </div>
              ) : (
                syncLogs.map((log, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--border-color)] flex flex-col gap-2 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex-shrink-0">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
                          ) : log.status === 'error' ? (
                            <XCircle className="w-4 h-4 text-[#ff453a]" />
                          ) : (
                            <Loader2 className="w-4 h-4 text-[#0071e3] animate-spin" />
                          )}
                        </div>
                        <p className="text-[14px] font-semibold text-primary truncate leading-[1.29]" style={{ letterSpacing: '-0.224px' }}>
                          {log.cinema}
                        </p>
                      </div>
                      {log.status === 'success' && (
                        <span className="text-[10px] font-bold text-[#34c759] uppercase tracking-[-0.08px] bg-[#34c759]/10 px-2 py-0.5 rounded-apple">
                          OK
                        </span>
                      )}
                    </div>
                    {log.message && (
                      <p className="text-[12px] text-secondary leading-[1.33]" style={{ letterSpacing: '-0.12px' }}>
                        {log.message}
                      </p>
                    )}
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {isSyncing && (
              <div className="p-5 bg-[#0071e3]/5 border-t border-[#0071e3]/10">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="w-4 h-4 text-[#0071e3] animate-spin" />
                  <p className="text-[12px] font-semibold text-[#0071e3] leading-[1.33]" style={{ letterSpacing: '-0.12px' }}>
                    Scraper is working in background...
                  </p>
                </div>
              </div>
            )}
            <div className="p-5 border-t border-[var(--border-color)] bg-[var(--surface-1)]">
                <button
                    onClick={() => setIsActivityDrawerOpen(false)}
                    className="w-full py-2.5 bg-[#1d1d1f] text-white text-[17px] font-normal rounded-[8px] transition-all active:scale-[0.98] active:bg-[#000000]"
                    style={{ letterSpacing: '-0.374px', lineHeight: '1.47' }}
                >
                    Dismiss
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
