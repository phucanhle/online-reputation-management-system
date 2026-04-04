import React from 'react';
import { Activity, Globe, Search, X, LayoutDashboard, TrendingUp, Building2, DownloadCloud } from 'lucide-react';
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

    // 1. Overview Sheet
    const overviewData = cinemasWithLatest.map(c => ({
      "Cinema Name": c.name,
      "Total Google Reviews": c.currentTotalReviews,
      "Average Rating": c.currentAverageRating.toFixed(2),
      "Local Reviews Collected": c.reviews.length
    }));
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "OVERVIEW");

    // 2. Individual Cinema Sheets
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

      // Sort: Highest Rating first, then Newest Date (assuming r.isoDate exists)
      cinemaReviews.sort((a: any, b: any) => {
        if (b.Rating !== a.Rating) return b.Rating - a.Rating;
        return 0; // Keeping secondary sort by position if date isn't easily comparable here
      });

      const wsCinema = XLSX.utils.json_to_sheet(cinemaReviews);

      // Excel sheet names limited to 31 chars and no special chars
      const safeName = c.name.replace(/[\[\]\*\?\/\\]/g, "").substring(0, 31);
      XLSX.utils.book_append_sheet(wb, wsCinema, safeName);
    });

    XLSX.writeFile(wb, `ORMS_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMobileSidebarOpen(false)} 
      />
      <aside className={`w-[280px] lg:w-80 h-screen fixed lg:sticky top-0 left-0 z-50 overflow-y-auto border-r border-card-border bg-white dark:bg-[#0a0a0a] lg:bg-sidebar lg:glass lg:backdrop-blur-2xl p-6 flex flex-col gap-8 custom-scrollbar transition-transform duration-300 lg:translate-x-0 ${isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg border border-white/10 overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Activity className="w-6 h-6 text-white relative z-10 animate-pulse" />
        </div>
        <div>
          <h1 className="font-black text-xl tracking-tighter uppercase italic bg-gradient-to-br from-primary to-indigo-400 bg-clip-text text-transparent">ORMS Core</h1>
          <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Reputation Monitor</p>
        </div>
        <button onClick={() => setIsMobileSidebarOpen(false)} className="lg:hidden p-2 text-secondary hover:text-rose-400 transition-colors ml-auto">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <button
          onClick={() => { setViewMode('global'); setIsMobileSidebarOpen(false); }}
          className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${viewMode === 'global' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-secondary hover:bg-black/5 dark:hover:bg-white/5'}`}
        >
          <Globe className="w-5 h-5" />
          <span className="font-bold">Global Overview</span>
        </button>

        <div className="my-4 border-t border-card-border"></div>

        <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-4 px-2">Monitor Branches</p>

        <div className="px-2 mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-secondary" />
            <input
              type="text"
              placeholder="Find site..."
              value={cinemaSearchQuery}
              onChange={e => setCinemaSearchQuery(e.target.value)}
              className="w-full bg-black/5 dark:bg-white/5 border border-card-border focus:border-indigo-500/50 rounded-xl pl-9 pr-8 py-2 text-[10px] font-bold outline-none transition-all"
            />
            {cinemaSearchQuery && (
              <button
                onClick={() => setCinemaSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-secondary hover:text-primary transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setSidebarSort(s => s === 'name' ? 'rating-desc' : s === 'rating-desc' ? 'rating-asc' : 'name')}
            className="p-2 bg-black/5 dark:bg-white/5 border border-card-border rounded-xl text-secondary hover:text-indigo-400 transition-all shadow-sm"
            title={sidebarSort === 'name' ? 'Sort by Rating' : sidebarSort === 'rating-desc' ? 'Sort by Worst First' : 'Sort by Name'}
          >
            {sidebarSort === 'name' ? <LayoutDashboard className="w-3.5 h-3.5" /> : sidebarSort === 'rating-desc' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : <TrendingUp className="w-3.5 h-3.5 text-rose-400 rotate-180" />}
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto max-h-[45vh] pr-2 custom-scrollbar">
          {filteredCinemas.map(c => (
            <div key={c.placeId} className="group/item relative">
              <button
                onClick={() => { setViewMode('branch'); setActiveTab(c.placeId); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${viewMode === 'branch' && activeTab === c.placeId ? 'bg-indigo-600/10 dark:bg-white/10 text-primary' : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden pr-6">
                  <Building2 className={`w-4 h-4 flex-shrink-0 ${viewMode === 'branch' && activeTab === c.placeId ? 'text-indigo-400' : ''}`} />
                  <span className="text-xs font-bold truncate">{c.name}</span>
                </div>
                <div className="flex flex-col items-end gap-0.5 min-w-[50px]">
                  {c.currentAverageRating > 0 && <span className="text-[10px] font-black text-amber-500 tabular-nums">{c.currentAverageRating.toFixed(1)}</span>}
                  {c.currentTotalReviews > 0 && <span className="text-[8px] font-bold text-slate-500 tabular-nums">({c.currentTotalReviews.toLocaleString()})</span>}
                </div>
              </button>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${c.placeId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all opacity-0 group-hover/item:opacity-100 shadow-sm"
                title="Search on Google Maps"
              >
                <Search className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto">
        <button onClick={exportToExcel} className="w-full flex items-center justify-center gap-2 p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-card-border rounded-2xl transition-all text-xs font-bold uppercase tracking-widest text-secondary">
          <DownloadCloud className="w-4 h-4" /> Export Audit
        </button>
      </div>
    </aside>
    </>
  );
}
