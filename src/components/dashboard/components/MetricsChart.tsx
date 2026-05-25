'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';

type Granularity = 'daily' | 'weekly' | 'monthly';

interface MetricsChartProps {
  placeId: string;
  _placeName: string;
}

interface MetricPoint {
  date: string;
  avg_rating: number;
  total_reviews: number;
  review_delta: number;
  sentiment_score: number;
  density_30d: number;
}

interface AggregatedPoint {
  label: string;
  avgRating: number;
  totalReviews: number;
  reviewDelta: number;
  sentiment: number;
}

function aggregateMetrics(raw: MetricPoint[], granularity: Granularity): AggregatedPoint[] {
  if (!raw || raw.length === 0) return [];

  if (granularity === 'daily') {
    return raw.map(m => ({
      label: new Date(m.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      avgRating: m.avg_rating,
      totalReviews: m.total_reviews,
      reviewDelta: m.review_delta,
      sentiment: m.sentiment_score,
    }));
  }

  // Group by bucket key
  const buckets = new Map<string, MetricPoint[]>();

  raw.forEach(m => {
    const d = new Date(m.date);
    let key: string;

    if (granularity === 'weekly') {
      // ISO week: get Monday of the week
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diff);
      key = monday.toISOString().split('T')[0];
    } else {
      // Monthly
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  });

  const sorted = Array.from(buckets.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return sorted.map(([key, points]) => {
    const last = points[points.length - 1]; // Use latest values for totals
    const avgRating = points.reduce((s, p) => s + p.avg_rating, 0) / points.length;
    const totalDelta = points.reduce((s, p) => s + p.review_delta, 0);
    const avgSentiment = points.reduce((s, p) => s + p.sentiment_score, 0) / points.length;

    let label: string;
    if (granularity === 'weekly') {
      const d = new Date(key);
      label = `W ${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
    } else {
      const [y, mo] = key.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      label = `${monthNames[parseInt(mo) - 1]} ${y.slice(2)}`;
    }

    return {
      label,
      avgRating: Math.round(avgRating * 100) / 100,
      totalReviews: last.total_reviews,
      reviewDelta: totalDelta,
      sentiment: Math.round(avgSentiment * 100) / 100,
    };
  });
}

type ChartMetric = 'totalReviews' | 'avgRating' | 'reviewDelta' | 'sentiment';

const METRIC_CONFIG: Record<ChartMetric, { label: string; color: string; gradientId: string; format: (v: number) => string }> = {
  totalReviews: {
    label: 'Total Reviews',
    color: '#0071e3',
    gradientId: 'gradientReviews',
    format: (v) => v.toLocaleString(),
  },
  avgRating: {
    label: 'Avg Rating',
    color: '#f59e0b',
    gradientId: 'gradientRating',
    format: (v) => v.toFixed(2),
  },
  reviewDelta: {
    label: 'Review Delta',
    color: '#34c759',
    gradientId: 'gradientDelta',
    format: (v) => (v >= 0 ? `+${v}` : `${v}`),
  },
  sentiment: {
    label: 'Sentiment',
    color: '#af52de',
    gradientId: 'gradientSentiment',
    format: (v) => v.toFixed(2),
  },
};

export default function MetricsChart({ placeId, _placeName }: MetricsChartProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [rawMetrics, setRawMetrics] = useState<MetricPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [activeMetric, setActiveMetric] = useState<ChartMetric>('totalReviews');

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => setChartReady(true), 150);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const isDark = mounted && resolvedTheme === 'dark';

  // Fetch metrics for this branch
  useEffect(() => {
    if (!placeId) return;
    setIsLoading(true);
    setChartReady(false);

    fetch(`/api/metrics?cinemaId=${placeId}`)
      .then(res => res.json())
      .then(data => {
        setRawMetrics(data.metrics || []);
        setTimeout(() => setChartReady(true), 150);
      })
      .catch(err => console.error('Failed to load metrics:', err))
      .finally(() => setIsLoading(false));
  }, [placeId]);

  const chartData = useMemo(
    () => aggregateMetrics(rawMetrics, granularity),
    [rawMetrics, granularity]
  );

  const cfg = METRIC_CONFIG[activeMetric];

  // Summary stats
  const summaryStats = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    const first = chartData[0];
    const totalDelta = chartData.reduce((s, d) => s + d.reviewDelta, 0);
    const ratingChange = latest.avgRating - first.avgRating;
    return { latest, totalDelta, ratingChange, dataPoints: chartData.length };
  }, [chartData]);

  const granularityOptions: { key: Granularity; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  const metricOptions: { key: ChartMetric; label: string }[] = [
    { key: 'totalReviews', label: 'Reviews' },
    { key: 'avgRating', label: 'Rating' },
    { key: 'reviewDelta', label: 'Delta' },
    { key: 'sentiment', label: 'Sentiment' },
  ];

  return (
    <div className="apple-card apple-card-elevated flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--apple-blue)]/10">
            <BarChart3 className="w-[18px] h-[18px] text-[var(--apple-blue)]" />
          </div>
          <div>
            <h4 className="sf-display-title text-[19px] text-primary">
              Performance Metrics
            </h4>
            <p className="sf-text-caption text-[13px] text-tertiary mt-0.5">
              {rawMetrics.length} data points available
            </p>
          </div>
        </div>

        {/* Granularity toggle */}
        <div className="flex bg-[var(--surface-2)] p-0.5 rounded-[980px] border border-[var(--border-color)]">
          {granularityOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setGranularity(opt.key)}
              className={`px-4 py-1.5 rounded-[980px] text-[13px] font-semibold transition-all sf-text-caption ${
                granularity === opt.key
                  ? 'bg-[var(--apple-blue)] text-white shadow-sm'
                  : 'text-tertiary hover:text-secondary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric selector pills */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap">
        {metricOptions.map(opt => {
          const mcfg = METRIC_CONFIG[opt.key];
          return (
            <button
              key={opt.key}
              onClick={() => setActiveMetric(opt.key)}
              className={`px-3.5 py-1.5 rounded-[980px] text-[13px] font-medium transition-all sf-text-caption border ${
                activeMetric === opt.key
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-[var(--border-color)] text-secondary hover:text-primary hover:bg-[var(--surface-2)]'
              }`}
              style={activeMetric === opt.key ? { background: mcfg.color } : undefined}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Summary mini-cards */}
      {summaryStats && !isLoading && (
        <div className="px-6 pb-2 grid grid-cols-3 gap-3">
          <div className="bg-[var(--surface-2)] rounded-[8px] p-3 flex flex-col gap-1">
            <span className="sf-text-caption text-[11px] font-semibold text-tertiary uppercase tracking-wider">Latest</span>
            <span className="sf-text-body text-[17px] font-bold text-primary tabular-nums">
              {cfg.format(summaryStats.latest[activeMetric])}
            </span>
          </div>
          <div className="bg-[var(--surface-2)] rounded-[8px] p-3 flex flex-col gap-1">
            <span className="sf-text-caption text-[11px] font-semibold text-tertiary uppercase tracking-wider">Period Δ</span>
            <span className={`sf-text-body text-[17px] font-bold tabular-nums flex items-center gap-1 ${
              summaryStats.totalDelta >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
            }`}>
              {summaryStats.totalDelta >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {summaryStats.totalDelta >= 0 ? '+' : ''}{summaryStats.totalDelta}
            </span>
          </div>
          <div className="bg-[var(--surface-2)] rounded-[8px] p-3 flex flex-col gap-1">
            <span className="sf-text-caption text-[11px] font-semibold text-tertiary uppercase tracking-wider">Rating Δ</span>
            <span className={`sf-text-body text-[17px] font-bold tabular-nums ${
              summaryStats.ratingChange >= 0 ? 'text-[#34c759]' : 'text-[#ff3b30]'
            }`}>
              {summaryStats.ratingChange >= 0 ? '+' : ''}{summaryStats.ratingChange.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="px-6 pb-6 pt-2">
        <div className="w-full h-56">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[var(--apple-blue)] animate-spin" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <BarChart3 className="w-10 h-10 text-tertiary opacity-30" />
              <p className="sf-text-body text-[15px] text-tertiary">
                No metrics data available yet
              </p>
            </div>
          ) : chartReady ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id={cfg.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={cfg.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={cfg.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-color)"
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontWeight: 500 }}
                  domain={activeMetric === 'avgRating' ? [0, 5] : ['auto', 'auto']}
                  tickFormatter={(v: number) => activeMetric === 'avgRating' ? v.toFixed(1) : v.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    fontWeight: 500,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    padding: '10px 14px',
                  }}
                  formatter={(value: any) => [cfg.format(Number(value ?? 0)), cfg.label]}
                  cursor={{ stroke: cfg.color, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey={activeMetric}
                  stroke={cfg.color}
                  strokeWidth={2.5}
                  fill={`url(#${cfg.gradientId})`}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: cfg.color,
                    stroke: isDark ? '#1c1c1e' : '#ffffff',
                    strokeWidth: 2.5,
                  }}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full bg-[var(--surface-2)] rounded-lg animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
