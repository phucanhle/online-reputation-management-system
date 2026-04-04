import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

export default function SyncOverlay({ state }: { state: DashboardState }) {
  const { isSyncing, syncLogs } = state;

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-10 text-center"
        >
          <div className="flex flex-col items-center gap-6 max-w-md">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Syncing Data Node</h2>
              <p className="text-secondary text-sm font-bold leading-relaxed">
                Updating cinema records and fetching latest Google Maps reviews.
                <br />
                <span className="text-rose-400 uppercase tracking-widest text-[10px] mt-4 block">Warning: Do not close this window to prevent data corruption</span>
              </p>
            </div>
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, repeat: Infinity }}
              />
            </div>

            <div className="w-full max-w-sm mt-4 bg-black/20 dark:bg-black/50 border border-card-border rounded-2xl overflow-hidden shadow-inner glass">
              <div className="max-h-48 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
                {syncLogs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4 opacity-50">
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    <p className="text-[9px] font-black uppercase tracking-widest">Initializing Protocol...</p>
                  </div>
                ) : (
                  syncLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {log.status === 'loading' ? (
                          <div className="w-4 h-4 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                          </div>
                        ) : log.status === 'success' ? (
                          <div className="w-4 h-4 bg-emerald-500/20 text-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                            <ShieldCheck className="w-2.5 h-2.5" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 bg-rose-500/20 text-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 border border-rose-500/20">
                            <AlertTriangle className="w-2.5 h-2.5" />
                          </div>
                        )}
                        <span className="text-[10px] font-black truncate text-primary uppercase tracking-tight">{log.cinema}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${log.status === 'loading' ? 'text-indigo-400' : log.status === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.status === 'loading' ? 'Active' : log.status === 'success' ? 'Safe' : 'Error'}
                        </span>
                        {log.status === 'loading' && <Loader2 className="w-2.5 h-2.5 text-indigo-400 animate-spin" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
