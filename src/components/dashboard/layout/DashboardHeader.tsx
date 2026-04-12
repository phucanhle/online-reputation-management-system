import React from 'react';
import { Search, X, Sun, Moon, RefreshCcw, Loader2, ExternalLink, Menu, Activity } from 'lucide-react';
import { useTheme } from 'next-themes';
import { DashboardState } from '../hooks/useDashboardData';

export default function DashboardHeader({ state }: { state: DashboardState }) {
  const {
    viewMode,
    activeCinema,
    searchQuery, setSearchQuery,
    isSyncing,
    syncLogs,
    isActivityDrawerOpen,
    setIsActivityDrawerOpen,
    setIsSyncModalOpen,
    setIsMobileSidebarOpen
  } = state;

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';
  const pageTitle = viewMode === 'global' ? 'Overview' : (activeCinema?.name ?? '');

  return (
    <header className="flex items-center justify-between w-full gap-4">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-apple text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2
            className="text-sm font-semibold text-white leading-none truncate max-w-[180px] sm:max-w-xs md:max-w-md"
            style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '-0.12px' }}
          >
            {pageTitle}
          </h2>

          {viewMode === 'branch' && activeCinema && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest">Live</span>
            </div>
          )}
          {viewMode === 'global' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/50 font-medium uppercase tracking-widest">44 nodes online</span>
            </div>
          )}
        </div>

        {viewMode === 'branch' && activeCinema && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCinema.name)}&query_place_id=${activeCinema.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-[#2997ff] hover:bg-white/10 rounded-apple transition-colors"
            title="View on Google Maps"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Right: Search + controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative hidden md:block w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-8 bg-white/10 border-none focus:bg-white/[0.15] rounded-[11px] pl-9 pr-8 text-[13px] text-white placeholder:text-white/30 outline-none transition-all"
            style={{ letterSpacing: '-0.12px' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-[8px] transition-colors"
          title="Toggle theme"
        >
          {mounted && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
        </button>

        {/* Activity Toggle */}
        <button
          onClick={() => setIsActivityDrawerOpen(true)}
          className={`relative p-2 rounded-[8px] transition-all duration-300 ${isActivityDrawerOpen ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
          title="Show active tasks"
        >
          <Activity className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
          {syncLogs.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-emerald-400' : 'bg-white/20'}`} />
          )}
        </button>

        {/* Sync Button — Apple Blue Pill CTA */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          disabled={isSyncing}
          className="flex items-center gap-2 h-7 px-4 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] disabled:opacity-50 text-white text-[12px] font-semibold rounded-[980px] transition-colors"
          style={{ letterSpacing: '-0.12px' }}
        >
          {isSyncing
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <RefreshCcw className="w-3 h-3" />
          }
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>
    </header>
  );
}
