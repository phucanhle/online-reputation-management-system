import React from 'react';
import {
  Star, TrendingUp, TrendingDown, BarChart3,
  Tags, FilterX, CalendarDays, Search, Activity, RefreshCcw, Loader2, MessageSquareQuote
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
    reviewDeltas,
  } = state;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  const pid = (activeCinema as any).place_id || (activeCinema as any).placeId || '';
  const currentDelta = reviewDeltas?.[pid] ?? 0;

  const kpiCards = [
    {
      label: 'Avg Rating',
      val: (activeCinema as any).currentAverageRating?.toFixed(1) ?? '0.0',
      sub: 'Official Google',
      icon: Star,
      iconClass: 'fill-amber-500 text-amber-500',
      accent: '#f59e0b',
      delta: null as number | null,
    },
    {
      label: 'Google Reviews',
      val: (activeCinema as any).currentTotalReviews?.toLocaleString() ?? '0',
      sub: currentDelta !== 0
        ? `${currentDelta > 0 ? '+' : ''}${currentDelta} since last update`
        : 'Official count',
      icon: MessageSquareQuote,
      iconClass: 'text-[#0071e3]',
      accent: '#0071e3',
      delta: currentDelta,
    },
    {
      label: 'Captured Total',
      val: (activeCinema as any).capturedReviews?.toLocaleString() ?? '0',
      sub: 'Archived in Database',
      icon: Activity,
      iconClass: 'text-[var(--apple-blue)]',
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in max-w-[1200px] p-4 mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main column */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-6">
            {kpiCards.map((k, i) => (
              <div key={i} className="apple-card apple-card-elevated p-6 flex flex-col gap-5">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[var(--surface-2)]">
                  <k.icon className={`w-5 h-5 ${k.iconClass}`} />
                </div>
                <div>
                  <p className="sf-text-caption text-[12px] font-semibold text-tertiary uppercase tracking-wider mb-1">
                    {k.label}
                  </p>
                  <p className="sf-display-title text-primary tabular-nums">
                    {k.val}
                  </p>
                  <p className="sf-text-caption text-secondary mt-1">
                    {k.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Data Synchronization Area */}
          <div className="apple-card apple-card-elevated p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 overflow-hidden relative">
            <div className="min-w-0 relative z-10">
              <h4 className="sf-display-title text-[21px] text-primary">
                Data Synchronization
              </h4>
              <p className="sf-text-body text-[15px] text-secondary mt-1">
                Update latest metrics directly from Google Maps
              </p>
              {activeCinema.lastScraped && (
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="sf-text-caption text-[12px] font-medium text-tertiary truncate">
                    Last updated: {new Date(activeCinema.lastScraped).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => state.setIsActivityDrawerOpen(true)}
                className="p-2.5 text-secondary hover:text-primary hover:bg-[var(--surface-2)] rounded-[8px] transition-all"
                title="View Activity Logs"
              >
                <Activity className={`w-4 h-4 ${state.isSyncing ? 'animate-pulse text-[var(--apple-blue)]' : ''}`} />
              </button>
              <button
                onClick={() => state.startCloudSync('selected', true)}
                disabled={state.isSyncing}
                className="apple-btn-primary apple-pill flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-[15px] font-medium disabled:opacity-50"
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
              <h4 className="sf-display-title text-[21px] text-primary flex items-center gap-2">
                <Tags className="w-5 h-5 text-[var(--apple-blue)]" />
                Review Feed
              </h4>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tag filters */}
                <div className="flex bg-[var(--surface-2)] border border-[var(--border-color)] p-0.5 rounded-[980px] flex-wrap gap-0.5">
                  {Object.keys(TAG_MAP).map(t => (
                    <button
                      key={t}
                      onClick={() => setSelectedTags((prev: string[]) => prev.includes(t) ? prev.filter((x: string) => x !== t) : [...prev, t])}
                      className={`px-3 py-1 rounded-[980px] text-[13px] font-medium transition-all sf-text-caption ${selectedTags.includes(t) ? 'bg-[var(--apple-blue)] text-white' : 'text-tertiary hover:text-secondary'}`}
                    >
                      {t}
                    </button>
                  ))}
                  {selectedTags.length > 0 && (
                    <button
                      onClick={() => setSelectedTags([])}
                      className="p-1 px-2 text-tertiary hover:text-[#ff3b30] transition-colors"
                    >
                      <FilterX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {/* Sort */}
                <button
                  onClick={() => setSortOrder((s: string) => s === 'desc' ? 'asc' : 'desc')}
                  className="p-2 bg-[var(--surface-2)] border border-[var(--border-color)] hover:bg-[var(--surface-1)] rounded-[8px] text-tertiary hover:text-secondary transition-colors"
                  title="Sort by date"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search result badge */}
            {searchQuery && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-[var(--apple-blue)]/10 rounded-[980px]">
                  <Search className="w-3.5 h-3.5 text-[var(--apple-blue)]" />
                  <span className="sf-text-caption text-[13px] font-semibold text-[var(--apple-blue)]">
                    {filteredReviews.length} results
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-[980px]">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="sf-text-caption text-[13px] font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
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
                <ReviewCard key={r._id || r.reviewId || `review-${idx}`} review={r} highlightedReviewId={highlightedReviewId} />
              ))}
            </div>

            {/* Load more */}
            {state.hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={() => state.loadMoreReviews(activeCinema.placeId)}
                  disabled={state.isLoadingMore}
                  className="apple-btn-primary apple-pill flex items-center gap-3 px-10 py-3.5 text-[15px] font-medium transition-all disabled:opacity-50"
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
          <div className="apple-card apple-card-elevated sticky top-20">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
              <h4 className="sf-display-title text-[19px] text-primary">
                Topic Analysis
              </h4>
              <button
                onClick={() => setTopicSort((s: string) => s === 'rating-desc' ? 'rating-asc' : 'rating-desc')}
                className="px-3 py-1 text-[13px] font-medium text-tertiary hover:text-secondary bg-[var(--surface-2)] border border-[var(--border-color)] rounded-full transition-all sf-text-caption"
                title="Toggle sort"
              >
                {topicSort === 'rating-desc' ? 'Best first' : 'Worst first'}
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2 max-h-[640px] overflow-y-auto custom-scrollbar">
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
                  if (mentions.length === 0) return null;
                  const avg = (mentions.reduce((a: number, b: any) => a + b.rating, 0) / mentions.length).toFixed(1);
                  const ratingNum = Number(avg);
                  const ratingColor = ratingNum >= 4
                    ? { text: '#34c759', bg: 'rgba(52,199,89,0.10)' }
                    : ratingNum >= 3
                      ? { text: '#f59e0b', bg: 'rgba(245,158,11,0.10)' }
                      : { text: '#ff3b30', bg: 'rgba(255,59,48,0.10)' };

                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between px-4 py-3.5 rounded-[8px] bg-[var(--surface-2)] hover:bg-[var(--bg-main)] transition-all group"
                    >
                      <div className="min-w-0">
                        <p className="sf-text-body text-[15px] font-semibold text-primary">
                          {t}
                        </p>
                        <p className="sf-text-caption text-[13px] text-tertiary mt-1">
                          {mentions.length} mentions
                        </p>
                      </div>
                      <div
                        className="px-2.5 py-1 rounded-[4px] sf-text-caption text-[13px] font-semibold tabular-nums flex-shrink-0"
                        style={{ color: ratingColor.text, background: ratingColor.bg }}
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
