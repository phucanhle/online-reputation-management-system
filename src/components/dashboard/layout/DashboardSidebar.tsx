import React from 'react';
import { Globe, Search, X, LayoutDashboard, TrendingUp, Building2, DownloadCloud, Activity, ArrowUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getTags } from '../utils';
import { DashboardState } from '../hooks/useDashboardData';

export default function DashboardSidebar({ state }: { state: DashboardState }) {
  const {
    viewMode, setViewMode,
    activeTab, setActiveTab,
    cinemaSearchQuery, setCinemaSearchQuery,
    sidebarSort, setSidebarSort,
    filteredCinemas,
    cinemasWithLatest,
    isMobileSidebarOpen, setIsMobileSidebarOpen
  } = state;

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const overviewData = cinemasWithLatest.map(c => ({
      "Cinema Name": c.place_name,
      "New Google Reviews": c.currentTotalReviews,
      "Average Rating": c.currentAverageRating.toFixed(2),
    }));
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "OVERVIEW");

    cinemasWithLatest.forEach(c => {
      const cinemaReviews = c.reviews.map((r: any) => ({
        "Date": r.date,
        "Author": r.authorName,
        "Rating": r.rating,
        "Review": r.text,
        "Translated": r.translated || "",
        "Tags": getTags(r.text).join(", "),
        "Local Guide": r.localGuide ? "Yes" : "No",
        "Likes": r.likes || 0
      }));
      cinemaReviews.sort((a: any, b: any) => b.Rating - a.Rating);
      const wsCinema = XLSX.utils.json_to_sheet(cinemaReviews);
      const safeName = (c.place_name || 'Unknown').replace(/[\[\]\*\?\/\\]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsCinema, safeName);
    });

    XLSX.writeFile(wb, `ORMS_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const cycleSidebarSort = () => {
    setSidebarSort((s: string) => s === 'name' ? 'rating-desc' : s === 'rating-desc' ? 'rating-asc' : 'name');
  };

  const sortLabel = sidebarSort === 'name' ? 'A–Z' : sidebarSort === 'rating-desc' ? '★ High' : '★ Low';

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          w-72 h-screen fixed lg:sticky top-0 left-0 z-50
          flex flex-col
          sidebar-glass
          transition-transform duration-300 lg:translate-x-0
          ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
        style={{ borderRight: 'none' }}
      >
        {/* Brand */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#0071e3] flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <div>
                <p
                  className="text-[15px] font-bold text-primary leading-none"
                  style={{ letterSpacing: '0.231px', fontFamily: '"SF Pro Display", -apple-system, sans-serif' }}
                >
                  ORMS
                </p>
                <p className="text-[11px] text-tertiary mt-1 uppercase font-bold tracking-wider leading-none">
                  Reputation Monitor
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 text-secondary hover:text-primary rounded-[8px] hover:bg-[var(--surface-2)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="px-3 flex flex-col gap-1">
          <button
            onClick={() => { setViewMode('global'); setIsMobileSidebarOpen(false); }}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-[14px] font-medium transition-all text-left
              ${viewMode === 'global'
                ? 'bg-[#0071e3]/10 text-[#0071e3]'
                : 'text-secondary hover:text-primary hover:bg-[var(--surface-2)]'
              }
            `}
            style={{ letterSpacing: '-0.224px' }}
          >
            <Globe className={`w-4 h-4 flex-shrink-0 ${viewMode === 'global' ? 'text-[#0071e3]' : ''}`} />
            Overview
          </button>
        </nav>

        {/* Cinema list */}
        <div className="flex-1 flex flex-col min-h-0 px-3 py-6">
          {/* Header row */}
          <div className="flex items-center justify-between mb-2 px-3">
            <p
              className="text-[11px] font-bold text-tertiary uppercase tracking-wider"
              style={{ letterSpacing: '0.05em' }}
            >
              Branches
            </p>
            <button
              onClick={cycleSidebarSort}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-tertiary hover:text-secondary rounded-[6px] transition-colors"
              title="Change sort"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>{sortLabel}</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4 px-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-tertiary" />
            <input
              type="text"
              placeholder="Find branch..."
              value={cinemaSearchQuery}
              onChange={e => setCinemaSearchQuery(e.target.value)}
              className="w-full h-8 bg-[var(--surface-3)] border-none focus:bg-[var(--surface-2)] rounded-[11px] pl-9 pr-8 text-[13px] text-primary placeholder:text-tertiary outline-none transition-all"
              style={{ letterSpacing: '-0.12px' }}
            />
            {cinemaSearchQuery && (
              <button
                onClick={() => setCinemaSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-1">
            <div className="flex flex-col gap-0.5">
              {filteredCinemas.map((c) => {
                const isActive = viewMode === 'branch' && activeTab === c.placeId;
                const shortName = (c.place_name || '').replace(/LOTTE Cinema\s*/gi, '').trim() || c.name || 'Unknown';
                return (
                  <button
                    key={c.place_id}
                    onClick={() => { setViewMode('branch'); setActiveTab(c.placeId); setIsMobileSidebarOpen(false); }}
                    className={`
                      group w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-left transition-all
                      ${isActive
                        ? 'bg-[#0071e3]/10 text-[#0071e3]'
                        : 'text-secondary hover:text-primary hover:bg-[var(--surface-2)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <Building2 className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#0071e3]' : 'text-tertiary group-hover:text-secondary'}`} />
                      <span
                        className="text-[13px] font-medium truncate"
                        style={{ letterSpacing: '-0.12px' }}
                      >
                        {shortName}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-0 flex-shrink-0 ml-2">
                      {c.currentAverageRating > 0 && (
                        <span className={`text-[11px] font-bold tabular-nums leading-tight ${isActive ? 'text-[#0071e3]' : 'text-amber-500'}`}>
                          {c.currentAverageRating.toFixed(1)}
                        </span>
                      )}
                      {c.currentTotalReviews > 0 && (
                        <span className="text-[10px] text-tertiary tabular-nums leading-tight">
                          {c.currentTotalReviews.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-[var(--border-color)]">
          <button
            onClick={exportToExcel}
            className="w-full flex items-center justify-center gap-2 h-9 px-4 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-color)] rounded-apple text-[13px] font-medium text-secondary hover:text-primary transition-colors"
            style={{ letterSpacing: '-0.12px' }}
          >
            <DownloadCloud className="w-4 h-4" />
            Export Audit
          </button>
        </div>
      </aside>
    </>
  );
}
