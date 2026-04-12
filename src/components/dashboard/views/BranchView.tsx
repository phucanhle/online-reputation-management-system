import React from 'react';
import {
  Star, TrendingUp, BarChart3,
  Tags, FilterX, CalendarDays, Search, Activity, RefreshCcw, Loader2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { DashboardState } from '../hooks/useDashboardData';
import ReviewCard from '../components/ReviewCard';
import { TAG_MAP, getTags } from '../utils';

export default function BranchView({ state }: { state: DashboardState }) {
  const {
    activeCinema,
    selectedTags, setSelectedTags,
    sortOrder, setSortOrder,
    searchQuery,
    filteredReviews,
    visibleReviewsCount,
    highlightedReviewId,
    topicSort, setTopicSort,
  } = state;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  const chartGridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  const kpiCards = [
    {
      label: 'Avg Rating',
      val: (activeCinema as any).currentAverageRating?.toFixed(1) ?? '0.0',
      sub: 'Official Google',
      icon: Star,
      iconClass: 'fill-amber-500 text-amber-500',
      accent: '#f59e0b',
    },
    {
      label: 'Captured Total',
      val: (activeCinema as any).capturedReviews?.toLocaleString() ?? '0',
      sub: 'Archived in Database',
      icon: Activity,
      iconClass: 'text-[#af52de]',
      accent: '#af52de',
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main column */}
        <div className="lg:col-span-8 flex flex-col gap-6">

            {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            {kpiCards.map((k, i) => (
              <div key={i} className="apple-card p-6 flex flex-col gap-4">
                <div
                  className="w-10 h-10 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${k.accent}12` }}
                >
                  <k.icon className={`w-5 h-5 ${k.iconClass}`} />
                </div>
                <div>
                    <p
                        className="text-[12px] font-bold text-tertiary uppercase"
                        style={{ letterSpacing: '0.05em' }}
                    >
                        {k.label}
                    </p>
                    <p
                        className="text-3xl font-bold text-primary mt-1.5 leading-[1.07] tabular-nums"
                        style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '-0.28px' }}
                    >
                        {k.val}
                    </p>
                    <p className="text-[13px] text-tertiary mt-1.5 leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
                        {k.sub}
                    </p>
                </div>
              </div>
            ))}
          </div>

          {/* Data Synchronization Area */}
          <div className="apple-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="min-w-0">
              <h4 className="text-[21px] font-bold text-primary leading-[1.19]" style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}>
                Data Synchronization
              </h4>
              <p className="text-[14px] text-tertiary mt-1.5 leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
                Update latest metrics directly from Google Maps
              </p>
              {activeCinema.lastScraped && (
                <div className="flex items-center gap-1.5 mt-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-medium text-tertiary truncate leading-[1.33]" style={{ letterSpacing: '-0.12px' }}>
                        Last updated: {new Date(activeCinema.lastScraped).toLocaleString('vi-VN')}
                    </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => state.setIsActivityDrawerOpen(true)}
                    className="p-2.5 text-secondary hover:text-primary hover:bg-[var(--surface-3)] rounded-[8px] transition-all"
                    title="View Activity Logs"
                >
                    <Activity className={`w-4 h-4 ${state.isSyncing ? 'animate-pulse text-[#0071e3]' : ''}`} />
                </button>
                <button
                    onClick={() => state.startCloudSync('selected', true)}
                    disabled={state.isSyncing}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white text-[16px] font-semibold rounded-[980px] transition-all disabled:opacity-50 shadow-product active:scale-[0.98]"
                    style={{ letterSpacing: '-0.374px' }}
                >
                    <RefreshCcw className={`w-4 h-4 ${state.isSyncing ? 'animate-spin' : ''}`} />
                    Sync Now
                </button>
            </div>
          </div>

          {/* Review Feed */}
          <div className="flex flex-col gap-6">
            {/* Filter row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h4
                className="text-[21px] font-bold text-primary flex items-center gap-2 leading-[1.19]"
                style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}
              >
                <Tags className="w-5 h-5 text-[#0071e3]" />
                Review Feed
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tag filters */}
                <div className="flex bg-[var(--surface-3)] p-0.5 rounded-[980px] flex-wrap gap-0.5">
                  {Object.keys(TAG_MAP).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTags((prev: string[]) => prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t])}
                      className={`px-3 py-1 rounded-[980px] text-[12px] font-semibold transition-all ${selectedTags.includes(t) ? 'bg-[#0071e3] text-white shadow-sm' : 'text-tertiary hover:text-secondary'}`}
                      style={{ letterSpacing: '-0.12px' }}
                    >
                      {t}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="p-1 px-2 text-tertiary hover:text-[#ff453a] transition-colors"
                    >
                      <FilterX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Sort */}
                <button
                  onClick={() => setSortOrder((s: string) => s === 'desc' ? 'asc' : 'desc')}
                  className="p-2 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded-[8px] text-tertiary hover:text-secondary transition-colors"
                  title="Sort by date"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search result badge */}
            {searchQuery && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-[#0071e3]/10 rounded-[980px]">
                  <Search className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span className="text-[12px] font-bold text-[#0071e3]" style={{ letterSpacing: '-0.12px' }}>
                    {filteredReviews.length} results
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-[980px]">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 tabular-nums" style={{ letterSpacing: '-0.12px' }}>
                    {filteredReviews.length > 0
                      ? (filteredReviews.reduce((a: number, b: any) => a + b.rating, 0) / filteredReviews.length).toFixed(1)
                      : '0.0'} average
                  </span>
                </div>
              </div>
            )}

            {/* Review cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReviews.slice(0, visibleReviewsCount).map((r: any, idx: number) => (
                <ReviewCard key={r._id || r.reviewId || idx} review={r} highlightedReviewId={highlightedReviewId} />
              ))}
            </div>

            {/* Load more */}
            {state.hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => state.loadMoreReviews(activeCinema.placeId)}
                  disabled={state.isLoadingMore}
                  className="flex items-center gap-3 px-10 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] active:bg-[#006edb] disabled:opacity-50 text-white text-[16px] font-bold rounded-[980px] transition-all shadow-product"
                  style={{ letterSpacing: '-0.12px' }}
                >
                  {state.isLoadingMore ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Load more reviews
                      <TrendingUp className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Topic Analysis */}
        <div className="lg:col-span-4">
          <div className="apple-card sticky top-20">
            <div className="flex items-center justify-between px-6 py-5">
              <h4
                className="text-[17px] font-bold text-primary leading-[1.29]"
                style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '-0.224px' }}
              >
                Topic Analysis
              </h4>
              <button
                onClick={() => setTopicSort((s: string) => s === 'rating-desc' ? 'rating-asc' : 'rating-desc')}
                className="px-3 py-1 text-[12px] font-bold text-tertiary hover:text-secondary bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded-[980px] transition-all"
                title="Toggle sort"
                style={{ letterSpacing: '-0.12px' }}
              >
                {topicSort === 'rating-desc' ? 'Best first' : 'Worst first'}
              </button>
            </div>
            <div className="p-4 pt-0 flex flex-col gap-2 max-h-[640px] overflow-y-auto custom-scrollbar">
              {Object.keys(TAG_MAP)
                .sort((a, b) => {
                  const ma = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(a)) ?? [];
                  const mb = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(b)) ?? [];
                  const avgA = ma.length > 0 ? ma.reduce((acc: number, cur: any) => acc + cur.rating, 0) / ma.length : 0;
                  const avgB = mb.length > 0 ? mb.reduce((acc: number, cur: any) => acc + cur.rating, 0) / mb.length : 0;
                  return topicSort === 'rating-desc' ? avgB - avgA : avgA - avgB;
                })
                .map(t => {
                  const mentions = activeCinema?.reviews?.filter((r: any) => getTags(r.text).includes(t)) ?? [];
                  const avg = mentions.length > 0
                    ? (mentions.reduce((a: number, b: any) => a + b.rating, 0) / mentions.length).toFixed(1)
                    : '0.0';
                  const ratingNum = Number(avg);
                  const ratingColor = ratingNum >= 4
                    ? { text: '#34c759', bg: 'rgba(52,199,89,0.10)' }
                    : ratingNum >= 3
                      ? { text: '#f59e0b', bg: 'rgba(245,158,11,0.10)' }
                      : { text: '#ff453a', bg: 'rgba(255,69,58,0.10)' };

                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between px-4 py-3.5 rounded-[8px] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-all group"
                    >
                      <div className="min-w-0">
                        <p
                          className="text-[14px] font-bold text-primary leading-none"
                          style={{ letterSpacing: '-0.224px' }}
                        >
                          {t}
                        </p>
                        <p className="text-[12px] text-tertiary mt-1 font-medium" style={{ letterSpacing: '-0.12px' }}>
                          {mentions.length} mentions
                        </p>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-[4px] text-[12px] font-bold tabular-nums flex-shrink-0"
                        style={{ color: ratingColor.text, background: ratingColor.bg, letterSpacing: '-0.12px' }}
                      >
                        {avg} ★
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
