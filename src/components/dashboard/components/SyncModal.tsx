import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Globe, MapPin, Search } from 'lucide-react';
import { DashboardState } from '../hooks/useDashboardData';

export default function SyncModal({ state }: { state: DashboardState }) {
  const { 
    isSyncModalOpen, 
    setIsSyncModalOpen, 
    cinemasWithLatest, 
    selectedCinemasForSync, 
    setSelectedCinemasForSync,
    startCloudSync
  } = state;

  const [localSearch, setLocalSearch] = React.useState('');

  const filtered = cinemasWithLatest.filter(c => 
    c.name.toLowerCase().includes(localSearch.toLowerCase())
  );

  const toggleAll = () => {
    if (selectedCinemasForSync.length === cinemasWithLatest.length) {
      setSelectedCinemasForSync([]);
    } else {
      setSelectedCinemasForSync(cinemasWithLatest.map(c => c.placeId));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedCinemasForSync.includes(id)) {
      setSelectedCinemasForSync(prev => prev.filter(x => x !== id));
    } else {
      setSelectedCinemasForSync(prev => [...prev, id]);
    }
  };

  if (!isSyncModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           onClick={() => setIsSyncModalOpen(false)}
           className="absolute inset-0 bg-background/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-card-border rounded-3xl shadow-2xl overflow-hidden glass"
        >
          <div className="p-6 border-b border-card-border flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black italic tracking-tighter uppercase">Cloud Scrape Protocol</h2>
              <p className="text-[10px] font-bold text-secondary tracking-widest uppercase mt-1">Select nodes for data synchronization</p>
            </div>
            <button 
              onClick={() => setIsSyncModalOpen(false)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input 
                  type="text" 
                  placeholder="Filter cinemas..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-black/20 border border-card-border rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <button 
                onClick={toggleAll}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-card-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {selectedCinemasForSync.length === cinemasWithLatest.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              {filtered.map(cinema => (
                <div 
                  key={cinema.placeId}
                  onClick={() => toggleOne(cinema.placeId)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                    selectedCinemasForSync.includes(cinema.placeId) 
                      ? 'bg-indigo-500/10 border-indigo-500/50' 
                      : 'bg-white/5 border-card-border hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      selectedCinemasForSync.includes(cinema.placeId) ? 'bg-indigo-500 text-white' : 'bg-black/20 text-secondary group-hover:text-primary'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold truncate leading-none">{cinema.name}</span>
                  </div>
                  {selectedCinemasForSync.includes(cinema.placeId) && (
                    <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => startCloudSync('all')}
                className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-card-border rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group"
              >
                <Globe className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sync Total Cluster</span>
              </button>
              <button 
                disabled={selectedCinemasForSync.length === 0}
                onClick={() => startCloudSync('selected')}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:grayscale rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shadow-xl shadow-indigo-500/20 group"
              >
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                  <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-md font-bold text-white leading-none">
                    {selectedCinemasForSync.length}
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Engage Selected</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
