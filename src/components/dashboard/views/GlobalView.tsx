import React from 'react';
import { ShieldCheck, MessageSquareQuote, Building2, AlertTriangle, TrendingUp, BarChart3, Star, Search, ExternalLink } from 'lucide-react';
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

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const chartStroke = mounted ? (resolvedTheme === 'dark' ? '#1e293b' : '#e2e8f0') : 'transparent';

  return (
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
        <div className="xl:col-span-4 bg-black/5 dark:bg-white/[0.03] border border-card-border p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] flex flex-col gap-6 glass relative">
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

        <div className="xl:col-span-8 bg-black/5 dark:bg-white/[0.03] border border-card-border p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] glass">
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

      <div className="bg-black/5 dark:bg-white/[0.03] border border-card-border p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] flex flex-col gap-8 glass">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h3 className="font-black italic text-xl flex items-center gap-3 text-primary">
            <AlertTriangle className="text-rose-500 animate-pulse shrink-0" />
            Global Critical Feed
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => setCriticalSort(s => s === 'date' ? 'rating' : 'date')}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${criticalSort === 'date' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}
            >
              {criticalSort === 'date' ? 'Newest First' : 'Lowest First'}
            </button>
            <div className="whitespace-nowrap px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] animate-pulse">
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
                    </div>
                     <div className="flex-1 min-w-0 overflow-hidden flex flex-col pt-1">
                       <div className="flex items-center gap-2 group/title">
                         <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.15em] leading-tight mb-2 truncate max-w-[80%] lg:hidden" title={alert.cinemaName}>{alert.cinemaName?.replace(/Lotte Cinema\s*/gi, '').trim() || alert.cinemaName}</p>
                         <p className="text-[11px] font-black text-rose-500 uppercase tracking-[0.15em] leading-tight mb-2 truncate max-w-[80%] hidden lg:block" title={alert.cinemaName}>{alert.cinemaName}</p>
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
  );
}
