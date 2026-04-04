import React from 'react';
import { Star, MessageSquareQuote, TrendingUp, BarChart3, Tags, FilterX, CalendarDays, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from 'next-themes';
import { DashboardState } from '../hooks/useDashboardData';
import ReviewCard from '../components/ReviewCard';
import { TAG_MAP, getTags } from '../utils';

export default function BranchView({ state }: { state: DashboardState }) {
  const {
    activeCinema,
    reviewVelocity,
    growthPercentage,
    momentumData,
    selectedTags, setSelectedTags,
    sortOrder, setSortOrder,
    searchQuery,
    filteredReviews,
    visibleReviewsCount,
    highlightedReviewId,
    topicSort, setTopicSort
  } = state;
  const { resolvedTheme } = useTheme();

  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-black/5 dark:bg-white/5 border border-card-border p-5 md:p-7 rounded-3xl flex items-center gap-5 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
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
              className="bg-black/5 dark:bg-white/5 border border-card-border p-5 md:p-7 rounded-3xl flex items-center gap-5 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
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
              className="bg-black/5 dark:bg-white/5 border border-card-border p-5 md:p-7 rounded-3xl flex items-center gap-5 text-emerald-500 cursor-help transition-all hover:bg-black/10 dark:hover:bg-white/10"
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

          <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] min-h-[400px] flex flex-col overflow-hidden">
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h4 className="font-black italic text-xl flex items-center gap-2 text-primary"><Tags className="text-indigo-400" /> Intelligent Insight Feed</h4>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-card-border">
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
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl w-fit">
                  <Search className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                    Found {filteredReviews.length} matching insights
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl w-fit">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                    Avg Rating: {filteredReviews.length > 0 ? (filteredReviews.reduce((a: number, b: any) => a + b.rating, 0) / filteredReviews.length).toFixed(1) : "0.0"} ★
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredReviews.slice(0, visibleReviewsCount).map((r: any) => (
                <ReviewCard key={r.id} review={r} highlightedReviewId={highlightedReviewId} />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] glass">
            <div className="flex items-center justify-between mb-6 gap-4">
              <h4 className="font-black italic text-lg tracking-tighter text-primary truncate">Topic Analysis</h4>
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
  );
}
