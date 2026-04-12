import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Globe, Building2, Search } from 'lucide-react';
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

  const allSelected = selectedCinemasForSync.length === cinemasWithLatest.length;

  const toggleAll = () => {
    setSelectedCinemasForSync(allSelected ? [] : cinemasWithLatest.map(c => c.placeId));
  };

  const toggleOne = (id: string) => {
    setSelectedCinemasForSync((prev: string[]) =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (!isSyncModalOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSyncModalOpen(false)}
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(8px)' }}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-xl overflow-hidden"
          style={{
            background: 'var(--surface-1)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-product)',
            border: 'none',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 pb-4">
            <div>
              <h2
                className="text-[21px] font-bold text-primary leading-[1.19]"
                style={{
                  fontFamily: '"SF Pro Display", -apple-system, sans-serif',
                  letterSpacing: '0.231px',
                }}
              >
                Select Branches to Sync
              </h2>
              <p className="text-[13px] text-tertiary mt-1.5 leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
                Choose one or more cinema locations to synchronize
              </p>
            </div>
            <button
              onClick={() => setIsSyncModalOpen(false)}
              className="p-2 text-secondary hover:text-primary hover:bg-[var(--surface-2)] rounded-[8px] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6">
            {/* Search + toggle */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search branches..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="w-full h-8 bg-[var(--surface-3)] border-none focus:bg-[var(--surface-2)] rounded-[11px] pl-9 pr-4 text-[13px] text-primary placeholder:text-tertiary outline-none transition-all"
                  style={{ letterSpacing: '-0.12px' }}
                />
              </div>
              <button
                onClick={toggleAll}
                className="px-4 py-1.5 text-[12px] font-bold text-tertiary hover:text-secondary bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded-[980px] transition-all whitespace-nowrap"
                style={{ letterSpacing: '-0.12px' }}
              >
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Cinema list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar px-1">
              {filtered.map(cinema => {
                const isSelected = selectedCinemasForSync.includes(cinema.placeId);
                const shortName = cinema.name.replace(/LOTTE Cinema\s*/gi, '').trim() || cinema.name;
                return (
                  <button
                    key={cinema.placeId}
                    onClick={() => toggleOne(cinema.placeId)}
                    className={`
                      flex items-center justify-between px-3 py-3 rounded-[8px] text-left transition-all
                      ${isSelected
                        ? 'bg-[#0071e3]/10 text-[#0071e3]'
                        : 'bg-[var(--surface-2)] text-secondary hover:text-primary hover:bg-[var(--surface-3)] shadow-sm'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-[#0071e3]' : 'opacity-40'}`} />
                      <span
                        className="text-[13px] font-bold truncate leading-none"
                        style={{ letterSpacing: '-0.12px' }}
                      >
                        {shortName}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0071e3] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={() => startCloudSync('all')}
                className="flex items-center gap-2 flex-1 h-10 px-4 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded-[980px] text-[14px] font-bold text-secondary hover:text-primary transition-all justify-center"
                style={{ letterSpacing: '-0.12px' }}
              >
                <Globe className="w-4 h-4" />
                Sync All
              </button>
              <button
                disabled={selectedCinemasForSync.length === 0}
                onClick={() => startCloudSync('selected')}
                className="flex items-center gap-2 flex-1 h-10 px-4 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] disabled:opacity-40 text-white text-[14px] font-bold rounded-[980px] transition-all shadow-product justify-center active:scale-[0.98]"
                style={{ letterSpacing: '-0.12px' }}
              >
                <Check className="w-4 h-4" />
                Sync {selectedCinemasForSync.length > 0 ? `${selectedCinemasForSync.length}` : ''}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
