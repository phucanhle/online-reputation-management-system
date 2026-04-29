import React from 'react';
import {
  ShieldCheck, MessageSquareQuote, Building2, AlertTriangle,
  BarChart3, Star, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from 'next-themes';
import { DashboardState } from '../hooks/useDashboardData';
import { getTags } from '../utils';

export default function GlobalView({ state }: { state: DashboardState }) {
  const {
    cinemasWithLatest,
    globalData,
    leaderboardSort, setLeaderboardSort,
    criticalSort, setCriticalSort,
    setActiveTab, setViewMode, setHighlightedReviewId
  } = state;
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  const isDark = mounted && resolvedTheme === 'dark';

  const kpiCards = [
    {
      label: 'Network Sentiment',
      val: `${((Number(globalData.avgRating) - 1) / 4 * 100).toFixed(1)}%`,
      sub: `${Number(globalData.avgRating).toFixed(2)} avg rating`,
      icon: Star,
      accent: 'var(--apple-blue)',
    },
    {
      label: 'Google Reviews',
      val: globalData.totalGoogleReviews.toLocaleString(),
      sub: 'current official total',
      icon: MessageSquareQuote,
      accent: 'var(--apple-blue)',
    },
    {
      label: 'Captured Library',
      val: globalData.totalCapturedReviews.toLocaleString(),
      sub: 'preserved in database',
      icon: Activity,
      accent: 'var(--apple-blue)',
    },
    {
      label: 'Cinema Branches',
      val: String(cinemasWithLatest.length),
      sub: 'nodes monitored',
      icon: Building2,
      accent: 'var(--apple-blue)',
    },
    {
      label: 'Critical Alerts',
      val: String(globalData.criticalAlerts.length),
      sub: 'reviews ≤ 2 stars',
      icon: AlertTriangle,
      accent: globalData.criticalAlerts.length > 0 ? '#ff3b30' : '#34c759',
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in max-w-[1200px] py-4 px-4 mx-auto w-full">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpiCards.map((k, i) => (
          <div
            key={i}
            className="apple-card apple-card-elevated p-6 flex flex-col gap-5"
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface-2)]">
              <k.icon className="w-5 h-5" style={{ color: k.accent }} />
            </div>
            <div>
              <p className="sf-text-caption text-[12px] font-semibold text-tertiary uppercase tracking-wider mb-1">
                {k.label}
              </p>
              <p className="sf-display-title text-primary">
                {k.val}
              </p>
              <p className="sf-text-caption text-secondary mt-1">
                {k.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Leaderboard + Chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Leaderboard */}
        <div className="xl:col-span-4 apple-card apple-card-elevated flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-color)]">
            <h3 className="sf-display-title text-[21px] text-primary">
              {leaderboardSort === 'top' ? 'Top Performers' : 'Underperformers'}
            </h3>
            <div className="flex bg-[var(--surface-2)] p-0.5 rounded-full border border-[var(--border-color)]">
              <button
                onClick={() => setLeaderboardSort('top')}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${leaderboardSort === 'top' ? 'bg-[var(--surface-1)] text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
              >
                Top
              </button>
              <button
                onClick={() => setLeaderboardSort('bottom')}
                className={`px-3 py-1 rounded-full text-[12px] font-medium transition-all ${leaderboardSort === 'bottom' ? 'bg-[var(--surface-1)] text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
              >
                Bottom
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar max-h-80 p-3 pt-0">
            {globalData.leaderboard.map((c, i) => (
              <button
                key={c.placeId || i}
                onClick={() => { setActiveTab(c.placeId); setViewMode('branch'); }}
                className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-left hover:bg-[var(--surface-2)] transition-colors group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <span
                    className="sf-text-caption text-[13px] font-semibold w-6 text-right flex-shrink-0"
                    style={{ color: leaderboardSort === 'top' ? (i < 3 ? 'var(--apple-blue)' : 'var(--text-tertiary)') : (i < 3 ? '#ff3b30' : 'var(--text-tertiary)') }}
                  >
                    #{i + 1}
                  </span>
                  <span className="sf-text-caption text-[14px] font-medium text-secondary group-hover:text-primary truncate transition-colors">
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="sf-text-caption text-[14px] font-semibold text-primary tabular-nums">
                    {c.rating.toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="xl:col-span-8 apple-card apple-card-elevated">
          <div className="px-6 py-5 border-b border-[var(--border-color)]">
            <h3 className="sf-display-title text-[21px] text-primary flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--apple-blue)]" />
              Rating Distribution
            </h3>
            <p className="sf-text-body text-[15px] text-secondary mt-1">
              Review count by star rating across all branches
            </p>
          </div>
          <div className="p-6 pt-0 mt-4">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={globalData.sentimentDistribution} barGap={4}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500 }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={52}>
                    {globalData.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index > 2 ? '#34c759' : index === 2 ? '#ffcc00' : '#ff3b30'} />
                    ))}
                  </Bar>
                  <Tooltip
                    cursor={{ fill: 'var(--border-color)' }}
                    contentStyle={{
                      backgroundColor: 'var(--surface-1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Review Fluctuation ── */}
      {globalData.reviewFluctuationAlerts && globalData.reviewFluctuationAlerts.length > 0 && (
        <div className="apple-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-5">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-5 h-5 text-[#ff9500]" />
              <h3
                className="text-[21px] font-bold text-primary leading-[1.19]"
                style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}
              >
                Review Fluctuation
              </h3>
              {globalData.reviewFluctuationAlerts.filter((a: any) => a.delta < 0).length > 0 && (
                <span className="px-2 py-0.5 bg-[#ff453a]/10 text-[#ff453a] text-[11px] font-bold rounded-[980px] tabular-nums">
                  {globalData.reviewFluctuationAlerts.filter((a: any) => a.delta < 0).length} decreased
                </span>
              )}
            </div>
            <p className="text-[13px] text-tertiary leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
              Day-over-day review count changes across branches
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {globalData.reviewFluctuationAlerts.map((alert: any, idx: number) => {
                const isDecrease = alert.delta < 0;
                return (
                  <button
                    key={alert.placeId || idx}
                    onClick={() => { setActiveTab(alert.placeId); setViewMode('branch'); }}
                    className="flex items-center justify-between p-4 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-[8px] text-left transition-all group active:scale-[0.98]"
                  >
                    <div className="min-w-0 overflow-hidden">
                      <p
                        className="text-[14px] font-bold text-primary truncate leading-[1.29] group-hover:text-[#0071e3] transition-colors"
                        style={{ letterSpacing: '-0.224px' }}
                      >
                        {(alert.name ?? '').replace(/Lotte Cinema\s*/gi, '').trim() || alert.name}
                      </p>
                      <p className="text-[12px] text-tertiary mt-0.5 tabular-nums" style={{ letterSpacing: '-0.12px' }}>
                        {alert.totalReviews?.toLocaleString()} reviews
                      </p>
                    </div>
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-[980px] flex-shrink-0 ${
                        isDecrease
                          ? 'bg-[#ff453a]/10 text-[#ff453a]'
                          : 'bg-[#34c759]/10 text-[#34c759]'
                      }`}
                    >
                      {isDecrease ? (
                        <TrendingDown className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingUp className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[12px] font-bold tabular-nums">
                        {isDecrease ? '' : '+'}{alert.delta}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Critical Feed ── */}
      <div className="apple-card apple-card-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff3b30]" />
            <h3 className="sf-display-title text-[21px] text-primary">
              Critical Alerts
            </h3>
            {globalData.criticalAlerts.length > 0 && (
              <span className="px-2.5 py-0.5 bg-[#ff3b30]/10 text-[#ff3b30] text-[12px] font-semibold rounded-full tabular-nums border border-[#ff3b30]/20">
                {globalData.criticalAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCriticalSort((s: string) => s === 'date' ? 'rating' : 'date')}
              className="px-3 py-1.5 text-[13px] font-medium text-tertiary hover:text-secondary bg-[var(--surface-2)] border border-[var(--border-color)] rounded-full transition-colors sf-text-caption"
            >
              {criticalSort === 'date' ? 'Newest first' : 'Lowest first'}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff3b30]/10 rounded-full border border-[#ff3b30]/20">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff3b30]" />
              <span className="sf-text-caption text-[11px] font-semibold text-[#ff3b30] uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {globalData.criticalAlerts.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-[#34c759]/10 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-[#34c759]" />
              </div>
              <div>
                <p className="sf-display-title text-[21px] text-primary">
                  All clear
                </p>
                <p className="sf-text-body text-[15px] text-secondary mt-2">
                  No critical reviews detected in the last 30 days
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {globalData.criticalAlerts.map((alert, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(alert.placeId);
                    setViewMode('branch');
                    setHighlightedReviewId(alert.reviewId);
                  }}
                  className="flex flex-col gap-4 p-5 bg-[var(--surface-2)] border border-[var(--border-color)] hover:border-[var(--apple-blue)] rounded-[12px] text-left transition-all group"
                >
                  {/* Author row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={alert.authorThumbnail || `https://ui-avatars.com/api/?name=${alert.authorName || 'User'}&background=random`}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="overflow-hidden">
                        <p className="sf-text-body text-[15px] font-semibold text-primary truncate">
                          {alert.authorName}
                        </p>
                        <p className="sf-text-caption text-[13px] text-secondary truncate mt-0.5">
                          {(alert.cinemaName ?? '').replace(/Lotte Cinema\s*/gi, '').trim() || alert.cinemaName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-[#ff3b30]/10 text-[#ff3b30] rounded-full flex-shrink-0">
                      <Star className="w-3 h-3 fill-current text-current" />
                      <span className="sf-text-caption text-[12px] font-bold tabular-nums">
                        {alert.rating.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Review text */}
                  <p className="sf-text-body text-[15px] text-primary line-clamp-3 leading-relaxed">
                    {alert.text ? `"${alert.text}"` : (
                      <span className="opacity-40 italic">No review text provided</span>
                    )}
                  </p>

                  {/* Tags + date */}
                  <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                    <div className="flex flex-wrap gap-1 overflow-hidden max-h-6">
                      {getTags(alert.text).slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[var(--surface-1)] border border-[var(--border-color)] rounded-[4px] sf-text-caption text-[11px] font-medium text-secondary whitespace-nowrap uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="sf-text-caption text-[13px] text-tertiary flex-shrink-0">
                      {alert.date}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
