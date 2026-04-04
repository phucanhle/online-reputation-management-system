'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useTheme } from 'next-themes';
import {
  Star, RefreshCcw, DownloadCloud, Search,
  MessageSquareQuote, User, CalendarDays, BarChart3,
  Loader2, FilterX, LayoutDashboard, Building2,
  AlertTriangle, TrendingUp, Globe, Tags,
  Sun, Moon, ExternalLink, X, ShieldCheck, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

// --- Heuristics for Tagging ---
const TAG_MAP: { [key: string]: string[] } = {
  'Service': ['phục vụ', 'nhân viên', 'service', 'staff', 'nhiệt tình', 'thái độ', 'không hài lòng', 'support', 'hỗ trợ'],
  'Food': ['bắp', 'nước', 'popcorn', 'drink', 'food', 'đồ ăn', 'com bo', 'combo'],
  'Cleanliness': ['sạch', 'bẩn', 'vệ sinh', 'mùi', 'clean', 'dirty', 'thơm', 'hôi'],
  'Experience': ['phim', 'ghế', 'âm thanh', 'màn hình', 'movie', 'seat', 'sound', 'screen', 'trải nghiệm', 'ổn', 'tệ'],
  'Price': ['giá', 'đắt', 'rẻ', 'mắc', 'chi phí', 'tiền', 'price', 'expensive', 'cheap']
};

const safeParseDate = (dateStr: any) => {
  if (!dateStr) return 0;
  const clean = typeof dateStr === 'string' ? dateStr.replace(/^\$D/, '') : dateStr;
  const parsed = new Date(clean).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

function getTags(text: string = "") {
  if (!text) return [];
  const lowText = text.toLowerCase();
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TAG_MAP)) {
    if (keywords.some(k => lowText.includes(k))) tags.push(tag);
  }
  return tags;
}

export default function DashboardClient({ cinemas }: { cinemas: any[] }) {
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'global' | 'branch'>('global');
  const [activeTab, setActiveTab] = useState<string>(cinemas[0]?.placeId || '');
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cinemaSearchQuery, setCinemaSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
  const [leaderboardSort, setLeaderboardSort] = useState<'top' | 'bottom'>('top');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(20);
  const [criticalSort, setCriticalSort] = useState<'date' | 'rating'>('date');
  const [sidebarSort, setSidebarSort] = useState<'name' | 'rating-desc' | 'rating-asc'>('name');
  const [topicSort, setTopicSort] = useState<'rating-desc' | 'rating-asc'>('rating-desc');
  
  // -- Debounced States for Search Optimization --
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedCinemaSearchQuery, setDebouncedCinemaSearchQuery] = useState(cinemaSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCinemaSearchQuery(cinemaSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [cinemaSearchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (highlightedReviewId) {
      // Ensure the highlighted review is visible
      setVisibleReviewsCount(prev => Math.max(prev, (filteredReviews.findIndex((r: any) => r.reviewId === highlightedReviewId) + 1) || 20));
      
      setTimeout(() => {
        const el = document.getElementById(`review-${highlightedReviewId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Wait for tab switch and render
      const timer = setTimeout(() => setHighlightedReviewId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedReviewId]);

  // --- Processed Cinemas with Latest Metrics ---
  const cinemasWithLatest = useMemo(() => {
    return cinemas.map(c => {
      const sortedMetrics = [...(c.metrics || [])].sort((a, b) => b.date.localeCompare(a.date));
      let latest = sortedMetrics[0];

      // If no valid dynamic metric yet, fallback to reviewing the static counts if possible
      // (though we removed them, let's derive from current reviews as baseline)
      const currentTotalReviews = (latest?.totalReviews && latest.totalReviews > 0)
        ? latest.totalReviews
        : (c.reviews?.length || 0);

      const currentAverageRating = (latest?.averageRating && latest.averageRating > 0)
        ? latest.averageRating
        : (c.reviews?.length > 0 ? (c.reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / c.reviews.length) : 0);

      return {
        ...c,
        currentTotalReviews,
        currentAverageRating,
        reviews: (c.reviews || []).map((r: any) => ({ ...r, tags: getTags(r.text) }))
      };
    });
  }, [cinemas]);

  const filteredCinemas = useMemo(() => {
    let result = cinemasWithLatest.filter(c =>
      c.name.toLowerCase().includes(debouncedCinemaSearchQuery.toLowerCase())
    );
    
    if (sidebarSort === 'rating-desc') result.sort((a, b) => b.currentAverageRating - a.currentAverageRating);
    else if (sidebarSort === 'rating-asc') result.sort((a, b) => a.currentAverageRating - b.currentAverageRating);
    else result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [cinemasWithLatest, debouncedCinemaSearchQuery, sidebarSort]);

  // --- Compute Global Data ---
  const globalData = useMemo(() => {
    let totalR = 0;
    let totalGoogleReviews = 0;
    let sumRating = 0;
    const branchRatings: { name: string, rating: number, count: number, placeId: string }[] = [];
    const recentNegative: any[] = [];
    const sentimentCounts = [0, 0, 0, 0, 0];

    cinemasWithLatest.forEach(c => {
      totalGoogleReviews += c.currentTotalReviews;
      branchRatings.push({
        name: c.name,
        rating: c.currentAverageRating,
        count: c.currentTotalReviews,
        placeId: c.placeId
      });

      c.reviews.forEach((r: any) => {
        totalR++;
        sumRating += r.rating;
        if (r.rating <= 2) recentNegative.push({ 
          ...r, 
          cinemaName: c.name, 
          placeId: c.placeId,
          mapsSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${c.placeId}`
        });
        if (r.rating >= 1 && r.rating <= 5) sentimentCounts[r.rating - 1]++;
      });
    });

    const leaderboard = [...branchRatings].sort((a, b) => 
      leaderboardSort === 'top' ? b.rating - a.rating : a.rating - b.rating
    );
    const criticalAlerts = [...recentNegative].sort((a, b) => {
      if (criticalSort === 'rating') {
        if (a.rating !== b.rating) return a.rating - b.rating;
      }
      return safeParseDate(b.isoDate) - safeParseDate(a.isoDate);
    }).slice(0, 50);

    const activeBranches = cinemasWithLatest.filter(c => c.currentAverageRating > 0);

    return {
      avgRating: activeBranches.length > 0
        ? (activeBranches.reduce((acc: number, curr: any) => acc + curr.currentAverageRating, 0) / activeBranches.length).toFixed(1)
        : "0.0",
      totalReviews: totalR,
      totalGoogleReviews,
      leaderboard,
      criticalAlerts,
      sentimentDistribution: [
        { name: '1 ★', count: sentimentCounts[0], fill: '#ef4444' },
        { name: '2 ★', count: sentimentCounts[1], fill: '#f97316' },
        { name: '3 ★', count: sentimentCounts[2], fill: '#f59e0b' },
        { name: '4 ★', count: sentimentCounts[3], fill: '#84cc16' },
        { name: '5 ★', count: sentimentCounts[4], fill: '#10b981' }
      ]
    };
  }, [cinemasWithLatest, leaderboardSort, criticalSort]);

  const activeCinema = useMemo(() => cinemasWithLatest.find(c => c.placeId === activeTab) || cinemasWithLatest[0], [cinemasWithLatest, activeTab]);

  // --- Momentum Computation ---
  const momentumData = useMemo(() => {
    if (!activeCinema) return [];

    // Use official daily metrics for historical tracking
    if (activeCinema.metrics && activeCinema.metrics.length > 0) {
      return activeCinema.metrics.map((m: any) => ({
        date: m.date,
        count: m.totalReviews,
        rating: m.averageRating,
      }));
    }

    // Fallback pseudo-history (not really needed anymore but safe to keep)
    const sortedReviews = [...activeCinema.reviews].sort((a: any, b: any) =>
      safeParseDate(a.isoDate) - safeParseDate(b.isoDate)
    );

    const monthlyData: { [key: string]: number } = {};
    let runningTotal = (activeCinema.currentTotalReviews || 0) - sortedReviews.length;
    if (runningTotal < 0) runningTotal = 0;

    sortedReviews.forEach((r: any) => {
      const month = new Date(r.isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      runningTotal++;
      monthlyData[month] = runningTotal;
    });

    return Object.entries(monthlyData).map(([date, count]) => ({ date, count }));
  }, [activeCinema]);

  const reviewVelocity = useMemo(() => {
    if (momentumData.length < 2) return 0;
    const start = momentumData[0].count;
    const end = momentumData[momentumData.length - 1].count;
    return end - start;
  }, [momentumData]);

  const growthPercentage = useMemo(() => {
    if (momentumData.length < 2) return "0.0";
    const start = momentumData[0].count;
    const end = momentumData[momentumData.length - 1].count;
    if (start === 0) return end > 0 ? "100.0" : "0.0";
    return (((end - start) / start) * 100).toFixed(1);
  }, [momentumData]);

  const filteredReviews = useMemo(() => {
    if (!activeCinema) return [];
    const q = debouncedSearchQuery.toLowerCase();
    
    let result = activeCinema.reviews.filter((r: any) => {
      const ratingMatch = selectedRatings.length === 0 || selectedRatings.includes(r.rating);
      const textMatch = !q || (r.text?.toLowerCase().includes(q)) || (r.authorName?.toLowerCase().includes(q));

      const reviewTags = r.tags || [];
      const tagMatch = selectedTags.length === 0 || selectedTags.some(t => reviewTags.includes(t));

      return ratingMatch && textMatch && tagMatch;
    });
    return result.sort((a: any, b: any) => {
      const dateA = safeParseDate(a.isoDate);
      const dateB = safeParseDate(b.isoDate);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [activeCinema, selectedRatings, sortOrder, debouncedSearchQuery, selectedTags, highlightedReviewId]);

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

  if (!mounted) return null;

  return (
    <>
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

      <div className="flex min-h-screen bg-background text-primary transition-colors duration-500">
        <aside className="w-80 h-screen sticky top-0 overflow-y-auto border-r border-card-border bg-sidebar glass backdrop-blur-2xl p-6 hidden lg:flex flex-col gap-8 custom-scrollbar transition-colors">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-indigo-500/20 shadow-lg border border-white/10 overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Activity className="w-6 h-6 text-white relative z-10 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter uppercase italic bg-gradient-to-br from-primary to-indigo-400 bg-clip-text text-transparent">ORMS Core</h1>
              <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Reputation Monitor</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <button
              onClick={() => setViewMode('global')}
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
                    onClick={() => { setViewMode('branch'); setActiveTab(c.placeId); }}
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

        <main className="flex-1 p-6 lg:p-10 flex flex-col gap-10">
          <header className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center justify-between w-full md:w-auto">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl lg:text-3xl font-black italic tracking-tighter truncate max-w-[200px] md:max-w-md lg:max-w-xl">
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

          {viewMode === 'global' ? (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Network Reputation', val: globalData.avgRating, icon: ShieldCheck, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                  { label: 'Google Global Reviews', val: globalData.totalGoogleReviews.toLocaleString(), icon: MessageSquareQuote, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                  { label: 'Cinema Nodes', val: cinemasWithLatest.length, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                  { label: 'Alerts Active', val: globalData.criticalAlerts.length, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-400/10' }
                ].map((k, i) => (
                  <div key={i} className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-6 rounded-3xl backdrop-blur-sm flex items-center gap-5 hover:bg-black/10 dark:hover:bg-white/[0.05] transition-all">
                    <div className={`w-12 h-12 ${k.bg} ${k.color} rounded-2xl flex items-center justify-center border border-card-border shadow-sm`}>
                      <k.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-secondary uppercase tracking-widest">{k.label}</p>
                      <h4 className="text-3xl font-black text-primary mt-1">{k.val}</h4>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4 bg-black/5 dark:bg-white/[0.03] border border-card-border p-8 rounded-[2.5rem] flex flex-col gap-6 glass relative">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black italic text-xl flex items-center gap-2 text-primary">
                        {leaderboardSort === 'top' ? <TrendingUp className="text-emerald-400" /> : <TrendingUp className="text-rose-400 rotate-180" />}
                        {leaderboardSort === 'top' ? 'Top Performers' : 'Underperformers'}
                      </h3>
                      <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-card-border">
                        <button 
                          onClick={() => setLeaderboardSort('top')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${leaderboardSort === 'top' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-secondary hover:text-primary'}`}
                        >
                          Top
                        </button>
                        <button 
                          onClick={() => setLeaderboardSort('bottom')}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${leaderboardSort === 'bottom' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-secondary hover:text-primary'}`}
                        >
                          Bottom
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {globalData.leaderboard.map((c, i) => (
                      <button
                        key={c.placeId}
                        onClick={() => { setActiveTab(c.placeId); setViewMode('branch'); }}
                        className="flex items-center justify-between p-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent hover:border-card-border rounded-2xl group transition-all"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <span className={`text-xs font-black ${leaderboardSort === 'top' ? 'text-emerald-400' : 'text-rose-400'}`}>#{i + 1}</span>
                          <span className="text-sm font-bold truncate text-secondary group-hover:text-primary">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span className="text-xs font-black text-primary">{c.rating.toFixed(1)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="xl:col-span-8 bg-black/5 dark:bg-white/[0.03] border border-card-border p-8 rounded-[2.5rem] glass">
                  <h3 className="font-black italic text-xl mb-8 flex items-center gap-2 text-primary"><BarChart3 className="text-indigo-400" /> Network Sentiment Heatmap</h3>
                  <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={globalData.sentimentDistribution}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: '900' }} />
                        <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                          {globalData.sentimentDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                        </Bar>
                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: resolvedTheme === 'dark' ? '#0f172a' : '#ffffff', border: 'none', borderRadius: '15px', color: resolvedTheme === 'dark' ? 'white' : 'black' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-8 rounded-[2.5rem] flex flex-col gap-8 glass">
                <div className="flex items-center justify-between">
                  <h3 className="font-black italic text-xl flex items-center gap-3 text-primary">
                    <AlertTriangle className="text-rose-500 animate-pulse" />
                    Global Critical Feed
                  </h3>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCriticalSort(s => s === 'date' ? 'rating' : 'date')}
                      className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${criticalSort === 'date' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}
                    >
                      {criticalSort === 'date' ? 'Newest First' : 'Lowest First'}
                    </button>
                    <div className="px-4 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] animate-pulse">
                      Live Monitoring Sequence
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar p-1">
                  {globalData.criticalAlerts.length === 0 ? (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4 border-2 border-dashed border-card-border rounded-3xl">
                      <ShieldCheck className="w-12 h-12 text-emerald-500/20" />
                      <p className="text-xs font-black uppercase text-secondary tracking-widest">Global Status: Safe | No Alerts</p>
                    </div>
                  ) : (
                    globalData.criticalAlerts.map((alert, idx) => (
                      <button 
                         key={idx} 
                         onClick={() => { 
                            setActiveTab(alert.placeId); 
                            setViewMode('branch'); 
                            setHighlightedReviewId(alert.reviewId);
                         }}
                         className="flex flex-col gap-6 p-7 bg-black/5 dark:bg-white/[0.02] border border-card-border hover:border-rose-500/50 rounded-[2.5rem] text-left transition-all group relative overflow-hidden active:scale-[0.98] shadow-2xl shadow-transparent hover:shadow-rose-500/5 min-h-[280px]"
                      >
                         <div className="absolute top-0 right-0 p-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[10px] font-black shadow-lg shadow-rose-500/30">
                               <Star className="w-2.5 h-2.5 fill-white" /> {alert.rating.toFixed(1)}
                            </div>
                         </div>
                         
                         <div className="flex items-start gap-4 w-full pr-14 min-w-0">
                            <div className="flex-shrink-0 relative pt-1">
                               <img src={alert.authorThumbnail || `https://ui-avatars.com/api/?name=${alert.authorName || 'User'}&background=random`} className="w-12 h-12 rounded-2xl border border-card-border group-hover:border-rose-500/50 transition-colors shadow-md" alt="" referrerPolicy="no-referrer" loading="lazy" />
                               {alert.localGuide && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center border-2 border-slate-900 shadow-md"><Star className="w-2.5 h-2.5 fill-white text-white" /></div>}
                            </div>
                             <div className="flex-1 min-w-0 overflow-hidden flex flex-col pt-1">
                               <div className="flex items-center gap-2 group/title">
                                 <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.15em] leading-tight mb-2 truncate max-w-[80%]">{alert.cinemaName}</p>
                                 <a 
                                   href={alert.mapsSearchUrl} 
                                   target="_blank" 
                                   rel="noopener noreferrer"
                                   onClick={(e) => e.stopPropagation()}
                                   className="mb-2 p-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md transition-all opacity-0 group-hover:opacity-100 group-hover/title:scale-110 active:scale-95"
                                   title="Search on Google Maps"
                                 >
                                   <Search className="w-2.5 h-2.5" />
                                 </a>
                               </div>
                               <h5 className="text-base font-black text-primary truncate tracking-tight w-full leading-snug">{alert.authorName}</h5>
                            </div>
                         </div>
                         
                         <div className="relative line-clamp-3">
                           <p className="text-xs text-secondary italic leading-relaxed group-hover:text-primary transition-colors antialiased font-medium">
                              {alert.text ? `"${alert.text}"` : <span className="opacity-40 tracking-widest uppercase text-[10px] font-black not-italic">No descriptive text provided</span>}
                           </p>
                         </div>
                         
                         <div className="mt-auto flex flex-col gap-4 pt-5 border-t border-card-border/50">
                            <div className="flex flex-wrap gap-2 overflow-hidden max-h-12 overflow-y-hidden">
                               {getTags(alert.text).map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-md text-[9px] font-black uppercase tracking-tighter border border-rose-500/10 whitespace-nowrap">
                                     {tag}
                                  </span>
                               ))}
                            </div>
                            <div className="flex items-center justify-between">
                               <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter flex-shrink-0">{alert.date}</span>
                               <div className="flex items-center gap-3 overflow-hidden">
                                  {alert.link && (
                                     <a 
                                        href={alert.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()} 
                                        className="p-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg transition-all flex-shrink-0"
                                     >
                                        <ExternalLink className="w-3 h-3" />
                                     </a>
                                  )}
                                  <div className="flex items-center gap-1 text-rose-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 overflow-hidden">
                                     <span className="text-[9px] font-black uppercase tracking-widest truncate">Resolve</span>
                                     <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                                  </div>
                               </div>
                            </div>
                         </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div
                      className="bg-black/5 dark:bg-white/5 border border-card-border p-7 rounded-3xl flex items-center gap-5 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
                      title="Overall average rating based on all reviews collected for this cinema."
                    >
                      <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center border border-card-border">
                        <Star className="w-7 h-7 fill-amber-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Sentiment</p>
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-3xl font-black text-primary">{activeCinema?.currentAverageRating?.toFixed(1) || "0.0"}</h4>
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">★ Rating</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="bg-black/5 dark:bg-white/5 border border-card-border p-7 rounded-3xl flex items-center gap-5 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
                      title="Total volume of feedback entries found on Google Maps."
                    >
                      <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center border border-card-border">
                        <MessageSquareQuote className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Feedback Density</p>
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-3xl font-black text-primary">{activeCinema?.currentTotalReviews?.toLocaleString() || 0}</h4>
                          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">Total</span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="bg-black/5 dark:bg-white/5 border border-card-border p-7 rounded-3xl flex items-center gap-5 text-emerald-500 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
                      title="The net growth in review count between the first and last recorded snapshots."
                    >
                      <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-card-border">
                        <TrendingUp className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Growth Momentum</p>
                        <div className="flex items-baseline gap-2">
                          <h4 className="text-3xl font-black text-emerald-500">{reviewVelocity > 0 ? `+${reviewVelocity}` : reviewVelocity}</h4>
                          <span className="text-xs font-black text-emerald-400/80">({growthPercentage}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-8 rounded-[2.5rem] min-h-[400px] flex flex-col">
                    <h3 className="font-black italic text-xl mb-8 flex items-center gap-2 text-primary"><TrendingUp className="text-emerald-400" /> Reputation Momentum (Fact-Table Timeline)</h3>

                    {momentumData.length >= 2 ? (
                      <div className="w-full h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={momentumData}>
                            <defs>
                              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0'} />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: '700' }} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
                                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-white/5 pb-2">{payload[0].payload.date}</p>
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-8">
                                          <span className="text-[11px] font-bold text-indigo-300">Reviews:</span>
                                          <span className="text-xs font-black text-white">{payload[0].value}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-8">
                                          <span className="text-[11px] font-bold text-amber-400">Rating:</span>
                                          <span className="text-xs font-black text-white">{payload[0].payload.rating?.toFixed(1) || "N/A"} ★</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-card-border rounded-3xl p-10">
                        <BarChart3 className="w-12 h-12 text-slate-700 animate-pulse" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Insufficient Data Node</p>
                          <p className="text-[10px] text-slate-600 font-bold max-w-xs uppercase">Historical plotting requires at least 2 consecutive days of snapshots. Check back tomorrow.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black italic text-xl flex items-center gap-2 text-primary"><Tags className="text-indigo-400" /> Intelligent Insight Feed</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-card-border">
                          {Object.keys(TAG_MAP).map(t => (
                            <button
                              key={t}
                              onClick={() => setSelectedTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedTags.includes(t) ? 'bg-indigo-600 text-white shadow-lg' : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'}`}
                            >
                              {t}
                            </button>
                          ))}
                          {selectedTags.length > 0 && (
                            <button onClick={() => setSelectedTags([])} className="p-1.5 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all" title="Clear Filters">
                              <FilterX className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')} className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg text-secondary transition-all" title="Sort by Date">
                          <CalendarDays className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {searchQuery && (
                      <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl">
                          <Search className="w-3 h-3 text-indigo-400" />
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                            Found {filteredReviews.length} matching insights
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                            Avg Rating: {filteredReviews.length > 0 ? (filteredReviews.reduce((a: number, b: any) => a + b.rating, 0) / filteredReviews.length).toFixed(1) : "0.0"} ★
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredReviews.slice(0, visibleReviewsCount).map((r: any) => (
                        <div
                          key={r.id}
                          id={`review-${r.reviewId}`}
                          className={`group relative bg-white/[0.03] dark:bg-slate-900/40 hover:bg-white/[0.05] dark:hover:bg-slate-800/40 border border-card-border hover:border-rose-500/30 rounded-[2rem] p-7 transition-all duration-500 flex flex-col gap-6 shadow-2xl shadow-transparent hover:shadow-rose-500/10 ${highlightedReviewId === r.reviewId ? 'ring-4 ring-rose-500/50 animate-highlight-pulse border-rose-500/80 z-20 shadow-lg shadow-rose-500/20' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                               <div className="flex-shrink-0 relative">
                                 <img src={r.authorThumbnail || `https://ui-avatars.com/api/?name=${r.authorName || 'User'}&background=random`} className="w-12 h-12 rounded-2xl border-2 border-card-border group-hover:border-indigo-500/50 transition-colors shadow-lg" alt="" referrerPolicy="no-referrer" />
                                 {r.localGuide && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-lg flex items-center justify-center border-2 border-slate-900 shadow-lg" title="Local Guide"><Star className="w-2.5 h-2.5 fill-white text-white" /></div>}
                               </div>
                               <div className="min-w-0 flex-1">
                                 <h5 className="text-sm font-black text-primary leading-tight flex items-center gap-2 truncate w-full">
                                   {r.authorName}
                                 </h5>
                                 <div className="flex items-center gap-2 mt-1 overflow-hidden">
                                   <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest truncate">{r.date}</span>
                                 </div>
                               </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shadow-sm">
                                 <div className="flex items-center">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-700'}`} />
                                   ))}
                                 </div>
                                 <span className="text-xs font-black text-amber-500 ml-1">{r.rating.toFixed(1)}</span>
                               </div>
                               {r.link && (
                                 <a
                                   href={r.link}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 transition-all shadow-sm active:scale-95"
                                 >
                                   Source <ExternalLink className="w-3 h-3" />
                                 </a>
                               )}
                            </div>
                          </div>

                          <div className="relative group-hover:px-2 transition-all duration-500">
                            <MessageSquareQuote className="absolute -left-2 -top-4 w-8 h-8 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
                            <p className="text-[14px] leading-[1.8] text-secondary font-medium italic relative z-10 antialiased">
                              {r.text ? `"${r.text}"` : <span className="opacity-40 tracking-widest uppercase text-[10px] font-black not-italic">No descriptive text provided</span>}
                            </p>
                          </div>

                          <div className="mt-auto pt-6 border-t border-card-border/50 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <div className="flex flex-wrap gap-2">
                                {getTags(r.text).map(tag => (
                                  <span key={tag} className="px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-tighter border border-indigo-500/10">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              {r.isoDate && (
                                <div className="flex items-center gap-1.5 text-secondary">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold uppercase tracking-tight">
                                    {new Date(r.isoDate).toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                  <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-8 rounded-[2.5rem] glass">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black italic text-lg tracking-tighter text-primary">Topic Analysis</h4>
                      <button 
                        onClick={() => setTopicSort(s => s === 'rating-desc' ? 'rating-asc' : 'rating-desc')}
                        className={`p-2 rounded-lg border transition-all ${topicSort === 'rating-desc' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' : 'text-rose-400 border-rose-500/20 bg-rose-500/5'}`}
                        title={topicSort === 'rating-desc' ? 'Show Critical Topics' : 'Show Best Topics'}
                      >
                        <BarChart3 className={`w-4 h-4 ${topicSort === 'rating-asc' ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {Object.keys(TAG_MAP).sort((a, b) => {
                        const m_a = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(a)) || [];
                        const m_b = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(b)) || [];
                        const avg_a = m_a.length > 0 ? (m_a.reduce((acc: number, curr: any) => acc + curr.rating, 0) / m_a.length) : 0;
                        const avg_b = m_b.length > 0 ? (m_b.reduce((acc: number, curr: any) => acc + curr.rating, 0) / m_b.length) : 0;
                        return topicSort === 'rating-desc' ? avg_b - avg_a : avg_a - avg_b;
                      }).map(t => {
                        const mentions = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(t)) || [];
                        const avg = mentions.length > 0 ? (mentions.reduce((a: number, b: any) => a + b.rating, 0) / mentions.length).toFixed(1) : "0.0";
                        return (
                          <div key={t} className="p-4 bg-black/10 dark:bg-black/20 rounded-2xl border border-card-border flex items-center justify-between group/topic transition-all hover:border-indigo-500/30">
                            <div>
                              <p className="text-[10px] text-secondary font-black uppercase italic group-hover/topic:text-indigo-400 transition-colors">{t}</p>
                              <p className="text-xs font-bold text-secondary">{mentions.length} Mentions</p>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-xs font-black ${Number(avg) >= 4 ? 'bg-emerald-500/10 text-emerald-400' : Number(avg) >= 3 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {avg}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
