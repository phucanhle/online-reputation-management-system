import React from 'react';
import { Search, X, Sun, Moon, RefreshCcw, Loader2, ExternalLink, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { DashboardState } from '../hooks/useDashboardData';

export default function DashboardHeader({ state }: { state: DashboardState }) {
  const {
    viewMode,
    activeCinema,
    searchQuery, setSearchQuery,
    isSyncing, setIsSyncing,
    setSyncLogs,
    setIsMobileSidebarOpen
  } = state;

  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();

  const triggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncLogs([]);
    try {
      const resp = await fetch('/api/scrape', { method: 'POST' });
      const reader = resp.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const update = JSON.parse(line);
            setSyncLogs(prev => {
              const existingIdx = prev.findIndex(l => l.cinema === update.cinema);
              if (existingIdx > -1) {
                const next = [...prev];
                next[existingIdx] = update;
                return next;
              }
              return [...prev, update];
            });
          } catch (e) {
            console.error('Error parsing sync line:', e);
          }
        }
      }
      router.refresh();
    } finally {
      setTimeout(() => setIsSyncing(false), 3000);
    }
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 bg-black/5 dark:bg-card-border rounded-xl text-secondary hover:text-primary transition-all border border-card-border"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black italic tracking-tighter truncate max-w-[140px] sm:max-w-[200px] md:max-w-md lg:max-w-xl">
              {viewMode === 'global' ? 'Chain Overview' : activeCinema?.name}
            </h2>
            {viewMode === 'branch' && activeCinema && (
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCinema.name)}&query_place_id=${activeCinema.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                title="View on Google Maps"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Global Node Status: Optimal</span>
          </div>
        </div>
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="lg:hidden p-3 bg-black/5 dark:bg-card-border rounded-2xl text-secondary hover:text-primary transition-all border border-card-border"
        >
          {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/5 dark:bg-slate-900 border border-card-border focus:border-indigo-500/50 rounded-2xl pl-11 pr-10 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="hidden lg:flex p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-card-border rounded-2xl text-secondary hover:text-primary transition-all"
          title="Toggle Theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-indigo-400" />
          )}
        </button>

        <button onClick={triggerSync} disabled={isSyncing} className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 text-white">
          {isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCcw className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
}
