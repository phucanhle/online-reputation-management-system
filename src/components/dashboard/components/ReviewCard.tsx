import React from 'react';
import { Star, ExternalLink, CalendarDays, MessageSquareQuote } from 'lucide-react';
import { getTags } from '../utils';

export default function ReviewCard({ review: r, highlightedReviewId }: { review: any, highlightedReviewId: string | null }) {
  return (
    <div
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
  );
}
