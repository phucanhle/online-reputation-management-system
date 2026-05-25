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
    setIsMobileSidebarOpen,
    cinemasWithLatest
  } = state;

  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [localQuery, setLocalQuery] = React.useState(searchQuery);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [localQuery, setSearchQuery]);

  const isDark = mounted && resolvedTheme === 'dark';
  const pageTitle = viewMode === 'global' ? 'Overview' : (activeCinema?.name ?? '');

  return (
    <header className="flex items-center justify-between w-full gap-4">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-[8px] text-secondary hover:text-primary hover:bg-[var(--surface-2)] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="sf-text-body font-semibold text-primary truncate max-w-[180px] sm:max-w-xs md:max-w-md">
            {pageTitle}
          </h2>

          {viewMode === 'branch' && activeCinema && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="sf-text-caption text-[10px] text-tertiary uppercase font-medium">Live</span>
            </div>
          )}
          {viewMode === 'global' && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--apple-blue)]" />
              <span className="sf-text-caption text-[10px] text-tertiary uppercase font-medium">{cinemasWithLatest.length} nodes online</span>
            </div>
          )}
        </div>

        {viewMode === 'branch' && activeCinema && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeCinema.name || '')}&query_place_id=${activeCinema.placeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 p-2 text-[var(--link-color)] hover:bg-[var(--surface-2)] rounded-[8px] transition-colors"
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary" />
          <input
            type="text"
            placeholder="Search reviews..."
            value={localQuery}
            onChange={e => setLocalQuery(e.target.value)}
            className="w-full h-8 bg-[var(--surface-2)] border border-[var(--border-color)] focus:border-[var(--apple-blue)] rounded-[11px] pl-9 pr-8 text-primary placeholder:text-tertiary outline-none transition-all sf-text-caption"
          />
          {localQuery && (
            <button
              onClick={() => { setLocalQuery(''); setSearchQuery(''); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="p-2 text-secondary hover:text-primary hover:bg-[var(--surface-2)] rounded-[8px] transition-colors"
          title="Toggle theme"
        >
          {mounted && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
        </button>

        {/* Activity Toggle */}
        <button
          onClick={() => setIsActivityDrawerOpen(true)}
          className={`relative p-2 rounded-[8px] transition-all duration-200 ${isActivityDrawerOpen ? 'text-primary bg-[var(--surface-2)]' : 'text-secondary hover:text-primary hover:bg-[var(--surface-2)]'}`}
          title="Show active tasks"
        >
          <Activity className={`w-4 h-4 ${isSyncing ? 'animate-pulse text-[var(--apple-blue)]' : ''}`} />
          {syncLogs.length > 0 && (
              <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-[var(--apple-blue)]' : 'bg-tertiary'}`} />
          )}
        </button>

        {/* Sync Button */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          disabled={isSyncing}
          className="apple-btn-primary flex items-center gap-2 h-8 px-4 text-[13px] font-medium apple-pill ml-2 disabled:opacity-50"
        >
          {isSyncing
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <RefreshCcw className="w-3.5 h-3.5" />
          }
          <span className="hidden sm:inline">Sync</span>
        </button>
      </div>
    </header>
  );
}
