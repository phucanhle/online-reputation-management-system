import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldCheck, AlertTriangle, Terminal, Cpu, Activity, CheckCircle2, ChevronRight, Server } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

// Helper to determine the current progress step (1 to 4)
const getProgressStep = (status: string, stage: string) => {
  if (status === 'success' || stage === 'completed') return 4;
  if (status === 'error' || stage === 'failed') return 0; // Error state
  
  if (stage === 'scraped' || stage === 'scraping' || stage === 'scrolling') return 3;
  if (stage === 'analyzing') return 2;
  
  // default / initializing / navigating / pending
  return 1; 
};

export default function SyncOverlay({ state }: { state: DashboardState }) {
  const { isSyncing, syncLogs } = state;
  const [scanPosition, setScanPosition] = useState(0);

  useEffect(() => {
    if (isSyncing) {
      const interval = setInterval(() => {
        setScanPosition(prev => (prev + 1) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSyncing]);

  return (
    <AnimatePresence>
      {isSyncing && (
        <motion.div
           initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
           animate={{ opacity: 1, backdropFilter: "blur(16px)" }}
           exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
           className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 text-left overflow-hidden bg-black/70"
        >
          {/* Futuristic Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)] pointer-events-none" />
          
          <div className="relative w-full max-w-4xl flex flex-col gap-6">
             {/* Header Section */}
             <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-indigo-500/30 pb-4 relative">
                <div className="absolute bottom-0 left-0 w-32 h-px bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
                
                <div className="flex gap-4 items-center">
                  <div className="relative flex items-center justify-center w-16 h-16 bg-indigo-950 border border-indigo-500/50 rounded-lg overflow-hidden shrink-0 shadow-[0_0_20px_rgba(79,70,229,0.3)]">
                    <motion.div 
                      className="absolute inset-0 border-2 border-indigo-400 rounded-lg"
                      animate={{ scale: [1, 1.15, 1], opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <Cpu className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-indigo-100 to-white drop-shadow-[0_0_8px_rgba(199,210,254,0.5)]">Data Node Uplink</h2>
                    <p className="text-indigo-200/70 text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-[ping_1.5s_ease-in-out_infinite] inline-block" />
                      Establishing connection to Cloud Scraper
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex flex-col items-end gap-1 font-mono text-[9px] text-indigo-300/50 mb-1">
                   <span>SYS.MEM: 48TB ALLOCATED</span>
                   <span className="flex items-center gap-1">LATENCY: <span className="text-emerald-400">~{Math.floor(Math.random() * 8 + 12)}ms</span></span>
                   <span>REGION: europe-west1</span>
                </div>
             </div>

             {/* Main Terminal Window */}
             <div className="relative w-full bg-[#030712]/90 border border-indigo-500/30 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] backdrop-blur-xl ring-1 ring-white/5 flex flex-col md:flex-row overflow-hidden min-h-[450px]">
                
                {/* Node List Sidebar */}
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-indigo-500/30 bg-indigo-950/20 flex flex-col">
                  <div className="px-4 py-3 bg-indigo-950/60 border-b border-indigo-500/30 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-mono text-indigo-300 tracking-widest uppercase font-bold">Active Nodes</span>
                  </div>
                  <div className="p-2 overflow-y-auto custom-scrollbar flex-1">
                    {syncLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-6 opacity-50 text-center">
                        <Activity className="w-6 h-6 text-indigo-400 animate-pulse mb-2" />
                        <span className="text-[9px] font-mono uppercase tracking-widest text-indigo-300">Wait...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {syncLogs.map((log, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-md border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-default">
                             <span className="text-[10px] font-bold truncate text-white uppercase tracking-tight mr-2 w-3/4">{log.cinema}</span>
                             {log.status === 'success' ? (
                               <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                             ) : log.status === 'error' ? (
                               <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                             ) : (
                               <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin flex-shrink-0" />
                             )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subroutine Details & Progress Steps */}
                <div className="w-full md:w-2/3 flex flex-col relative overflow-hidden bg-black/40">
                  {/* Scanner effect line */}
                  <div 
                    className="absolute left-0 right-0 h-48 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent pointer-events-none z-10 transition-transform duration-75"
                    style={{ transform: `translateY(${scanPosition * 5}px)` }}
                  />

                  <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-indigo-500/30">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] font-mono text-indigo-300 tracking-widest uppercase">sys_execution_log.sh</span>
                    </div>
                  </div>

                  <div className="p-4 md:p-6 overflow-y-auto font-mono text-[11px] custom-scrollbar scroll-smooth flex-1 relative z-20">
                     {syncLogs.length === 0 ? (
                       <div className="flex flex-col items-center justify-center h-full opacity-60 gap-4 min-h-[250px]">
                         <Activity className="w-10 h-10 text-indigo-400 animate-pulse" />
                         <p className="text-[11px] uppercase tracking-[0.3em] text-indigo-300 font-bold">Awaiting Subroutines</p>
                       </div>
                     ) : (
                       <div className="flex flex-col gap-6">
                         {syncLogs.map((log, idx) => {
                           const step = getProgressStep(log.status, log.stage);
                           
                           return (
                             <motion.div 
                                key={idx} 
                                initial={{ x: -10, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex flex-col border border-indigo-500/20 bg-indigo-950/10 rounded-lg p-3 relative group"
                              >
                               <div className="flex justify-between items-center mb-3">
                                  <span className="text-white font-bold tracking-widest uppercase">{log.cinema}</span>
                                  {step === 4 && <span className="text-emerald-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">COMPLETED</span>}
                                  {step === 0 && <span className="text-rose-400 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">FAILED</span>}
                               </div>

                               {/* 4-Step Progress Tracker */}
                               {step > 0 && (
                                 <div className="flex flex-col gap-2 relative mt-2 pl-2 border-l border-white/10 mb-3">
                                   
                                   {/* Step 1: Connecting */}
                                   <div className={`flex items-center gap-3 transition-opacity ${step >= 1 ? 'opacity-100' : 'opacity-30'}`}>
                                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${step > 1 ? 'bg-emerald-500/20 text-emerald-500' : step === 1 ? 'bg-indigo-500/40 text-indigo-300 animate-pulse' : 'bg-white/10 text-transparent'}`}>
                                        {step > 1 && <CheckCircle2 className="w-2.5 h-2.5" />}
                                      </div>
                                      <span className={step === 1 ? 'text-indigo-300 font-bold' : step > 1 ? 'text-white/60' : 'text-white/30'}>
                                        {step === 1 ? '> Connecting...' : 'Connecting'}
                                      </span>
                                   </div>

                                   {/* Step 2: Connected */}
                                   <div className={`flex items-center gap-3 transition-opacity ${step >= 2 ? 'opacity-100' : 'opacity-30'} ${step === 2 && 'text-indigo-300 font-bold'}`}>
                                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${step > 2 ? 'bg-emerald-500/20 text-emerald-500' : step === 2 ? 'bg-indigo-500/40 text-indigo-300 animate-pulse' : 'bg-white/10 text-transparent'}`}>
                                        {step > 2 && <CheckCircle2 className="w-2.5 h-2.5" />}
                                      </div>
                                      <span className={step === 2 ? 'text-indigo-300 font-bold' : step > 2 ? 'text-white/60' : 'text-white/30'}>
                                        {step === 2 ? '> Connected' : 'Connected'}
                                      </span>
                                   </div>

                                   {/* Step 3: Loading [n] case */}
                                   <div className={`flex items-center gap-3 transition-opacity ${step >= 3 ? 'opacity-100' : 'opacity-30'} ${step === 3 && 'text-indigo-300 font-bold'}`}>
                                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${step > 3 ? 'bg-emerald-500/20 text-emerald-500' : step === 3 ? 'bg-indigo-500/40 text-indigo-300 animate-pulse' : 'bg-white/10 text-transparent'}`}>
                                        {step > 3 && <CheckCircle2 className="w-2.5 h-2.5" />}
                                      </div>
                                      <div className="flex flex-col">
                                        <span className={step === 3 ? 'text-indigo-300 font-bold' : step > 3 ? 'text-white/60' : 'text-white/30'}>
                                          {step === 3 ? '> Loading Data...' : 'Loading Data'}
                                        </span>
                                        {/* Display specific log message while loading */}
                                        {step === 3 && log.message && (
                                           <span className="text-[10px] text-indigo-400/80 mt-1 pl-1 border-l-2 border-indigo-500/30">
                                             {log.message.includes('Found') ? log.message : `Loading [${log.message}]`}
                                           </span>
                                        )}
                                      </div>
                                   </div>

                                   {/* Step 4: OK */}
                                   <div className={`flex items-center gap-3 transition-opacity ${step >= 4 ? 'opacity-100' : 'opacity-30'}`}>
                                      <div className={`w-3 h-3 rounded-full flex items-center justify-center ${step === 4 ? 'bg-emerald-500/20 text-emerald-500 text-shadow-sm' : 'bg-white/10 text-transparent'}`}>
                                        {step === 4 && <CheckCircle2 className="w-2.5 h-2.5" />}
                                      </div>
                                      <span className={step === 4 ? 'text-emerald-400 font-bold tracking-widest' : 'text-white/30'}>
                                        OK
                                      </span>
                                   </div>
                                 </div>
                               )}
                               
                               {/* Error Message */}
                               {step === 0 && log.message && (
                                  <div className="mt-2 text-rose-400/80 leading-relaxed pl-3 border-l-2 border-rose-500/50 break-words flex items-start gap-2">
                                     <ChevronRight className="w-3 h-3 mt-0.5" />
                                     <span>{log.message}</span>
                                  </div>
                               )}
                               
                             </motion.div>
                           );
                         })}
                       </div>
                     )}
                  </div>
                </div>
             </div>
             
             {/* Warning Banner */}
             <div className="bg-gradient-to-r from-rose-950/40 to-transparent border-l-2 border-rose-500 p-3 flex items-center gap-3 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
               <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
               <span className="text-rose-400/90 text-[10px] uppercase tracking-widest font-mono">Critical Protocol: Do not intercept connection during data uplift</span>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
