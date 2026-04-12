import React from 'react';
import {
  ShieldCheck, MessageSquareQuote, Building2, AlertTriangle,
  TrendingUp, BarChart3, Star, Search, Activity
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
      accent: '#0071e3',
    },
    {
      label: 'Google Reviews',
      val: globalData.totalGoogleReviews.toLocaleString(),
      sub: 'current official total',
      icon: MessageSquareQuote,
      accent: '#0071e3',
    },
    {
      label: 'Captured Library',
      val: globalData.totalCapturedReviews.toLocaleString(),
      sub: 'preserved in database',
      icon: Activity,
      accent: '#af52de',
    },
    {
      label: 'Cinema Branches',
      val: String(cinemasWithLatest.length),
      sub: 'nodes monitored',
      icon: Building2,
      accent: '#0071e3',
    },
    {
      label: 'Critical Alerts',
      val: String(globalData.criticalAlerts.length),
      sub: 'reviews ≤ 2 stars',
      icon: AlertTriangle,
      accent: globalData.criticalAlerts.length > 0 ? '#ff453a' : '#34c759',
    },
  ];

  return (
    <div className="flex flex-col gap-8 animate-fade-in">

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 px-1">
        {kpiCards.map((k, i) => (
          <div
            key={i}
            className="apple-card p-6 flex flex-col gap-4"
          >
            <div
              className="w-10 h-10 rounded-[8px] flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${k.accent}12` }}
            >
              <k.icon className="w-5 h-5" style={{ color: k.accent }} />
            </div>
            <div>
              <p
                className="text-[12px] font-bold text-tertiary uppercase"
                style={{ letterSpacing: '0.05em' }}
              >
                {k.label}
              </p>
              <p
                className="text-3xl font-bold text-primary mt-1.5 leading-[1.07]"
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

      {/* ── Leaderboard + Chart ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

        {/* Leaderboard */}
        <div className="xl:col-span-4 apple-card flex flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <h3
              className="text-[21px] font-bold text-primary leading-[1.19]"
              style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}
            >
              {leaderboardSort === 'top' ? 'Top Performers' : 'Underperformers'}
            </h3>
            <div className="flex bg-[var(--surface-3)] p-0.5 rounded-[980px]">
              <button
                onClick={() => setLeaderboardSort('top')}
                className={`px-3 py-1 rounded-[980px] text-[12px] font-semibold transition-all ${leaderboardSort === 'top' ? 'bg-[var(--surface-1)] text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
                style={{ letterSpacing: '-0.12px' }}
              >
                Top
              </button>
              <button
                onClick={() => setLeaderboardSort('bottom')}
                className={`px-3 py-1 rounded-[980px] text-[12px] font-semibold transition-all ${leaderboardSort === 'bottom' ? 'bg-[var(--surface-1)] text-primary shadow-sm' : 'text-tertiary hover:text-secondary'}`}
                style={{ letterSpacing: '-0.12px' }}
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
                className="w-full flex items-center justify-between px-3 py-3 rounded-[8px] text-left hover:bg-[var(--surface-2)] transition-all group"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <span
                    className="text-[13px] font-bold w-6 text-right flex-shrink-0"
                    style={{
                      color: leaderboardSort === 'top'
                        ? (i < 3 ? '#0071e3' : 'var(--text-tertiary)')
                        : (i < 3 ? '#ff453a' : 'var(--text-tertiary)'),
                      letterSpacing: '-0.12px',
                    }}
                  >
                    #{i + 1}
                  </span>
                  <span
                    className="text-[14px] font-medium text-secondary group-hover:text-primary truncate transition-colors leading-[1.29]"
                    style={{ letterSpacing: '-0.224px' }}
                  >
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span className="text-[14px] font-bold text-primary tabular-nums" style={{ letterSpacing: '-0.12px' }}>
                    {c.rating.toFixed(1)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="xl:col-span-8 apple-card">
          <div className="px-6 py-5">
            <h3
              className="text-[21px] font-bold text-primary flex items-center gap-2 leading-[1.19]"
              style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}
            >
              <BarChart3 className="w-5 h-5 text-[#0071e3]" />
              Rating Distribution
            </h3>
            <p className="text-[13px] text-tertiary mt-1 leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
              Review count by star rating across all branches
            </p>
          </div>
          <div className="p-6 pt-0">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={globalData.sentimentDistribution} barGap={4}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.40)', fontSize: 12, fontWeight: 500, letterSpacing: '-0.12px' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={52}>
                    {globalData.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                    contentStyle={{
                      backgroundColor: isDark ? '#1d1d1f' : '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      color: isDark ? '#ffffff' : '#1d1d1f',
                      fontSize: '13px',
                      letterSpacing: '-0.12px',
                      boxShadow: 'var(--shadow-product)',
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Critical Feed ── */}
      <div className="apple-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff453a]" />
            <h3
              className="text-[21px] font-bold text-primary leading-[1.19]"
              style={{ fontFamily: '"SF Pro Display", -apple-system, sans-serif', letterSpacing: '0.231px' }}
            >
              Critical Alerts
            </h3>
            {globalData.criticalAlerts.length > 0 && (
              <span className="px-2 py-0.5 bg-[#ff453a]/10 text-[#ff453a] text-[11px] font-bold rounded-[980px] tabular-nums">
                {globalData.criticalAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCriticalSort((s: string) => s === 'date' ? 'rating' : 'date')}
              className="px-3 py-1.5 text-[12px] font-semibold text-tertiary hover:text-secondary bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded-[980px] transition-all"
              style={{ letterSpacing: '-0.12px' }}
            >
              {criticalSort === 'date' ? 'Newest first' : 'Lowest first'}
            </button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff453a]/8 rounded-[980px]">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff453a] animate-pulse" />
              <span className="text-[11px] font-bold text-[#ff453a] uppercase tracking-wider" style={{ letterSpacing: '0.05em' }}>Live</span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          {globalData.criticalAlerts.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#34c759]/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#34c759]" />
              </div>
              <div>
                <p className="text-[17px] font-bold text-primary leading-[1.19]" style={{ letterSpacing: '0.231px' }}>
                  All clear
                </p>
                <p className="text-[13px] text-tertiary mt-1.5 leading-[1.47]" style={{ letterSpacing: '-0.374px' }}>
                  No critical reviews detected in the last 30 days
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2 pt-2">
              {globalData.criticalAlerts.map((alert, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveTab(alert.placeId);
                    setViewMode('branch');
                    setHighlightedReviewId(alert.reviewId);
                  }}
                  className="flex flex-col gap-4 p-5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border-none rounded-[8px] text-left transition-all group active:scale-[0.98] shadow-sm hover:shadow-product"
                >
                  {/* Author row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img
                        src={alert.authorThumbnail || `https://ui-avatars.com/api/?name=${alert.authorName || 'User'}&background=random`}
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        alt=""
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                      <div className="overflow-hidden">
                        <p
                          className="text-[14px] font-bold text-primary truncate leading-[1.29]"
                          style={{ letterSpacing: '-0.224px' }}
                        >
                          {alert.authorName}
                        </p>
                        <p
                          className="text-[12px] text-[#ff453a] font-bold truncate mt-0.5 leading-[1.33]"
                          style={{ letterSpacing: '-0.12px' }}
                        >
                          {(alert.cinemaName ?? '').replace(/Lotte Cinema\s*/gi, '').trim() || alert.cinemaName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-[#ff453a] rounded-[980px] flex-shrink-0">
                      <Star className="w-3 h-3 fill-white text-white" />
                      <span className="text-[12px] font-bold text-white tabular-nums">
                        {alert.rating.toFixed(0)}
                      </span>
                    </div>
                  </div>

                  {/* Review text */}
                  <p
                    className="text-[13px] text-secondary line-clamp-3 leading-[1.47] group-hover:text-primary transition-colors"
                    style={{ letterSpacing: '-0.374px' }}
                  >
                    {alert.text ? `"${alert.text}"` : (
                      <span className="opacity-40 italic">No review text provided</span>
                    )}
                  </p>

                  {/* Tags + date */}
                  <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex flex-wrap gap-1 overflow-hidden max-h-6">
                      {getTags(alert.text).slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-[var(--surface-1)] rounded-[4px] text-[10px] font-bold text-tertiary whitespace-nowrap uppercase tracking-wider"
                          style={{ letterSpacing: '0.05em' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-[12px] text-tertiary flex-shrink-0 font-medium" style={{ letterSpacing: '-0.12px' }}>
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
