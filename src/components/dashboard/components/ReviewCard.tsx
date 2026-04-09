import React from 'react';
import { Star, ExternalLink, CalendarDays, MessageSquareQuote } from 'lucide-react';
import { getTags } from '../utils';

function formatReviewDate(isoDate: string | null, rawDate: string | null) {
  if (!isoDate) return rawDate || 'Recently';
  const date = new Date(isoDate);
  const now = new Date();

  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return rawDate || date.toLocaleDateString('vi-VN');
}


function formatReviewText(text: string | null) {
  if (!text) return '';
  const textInEn = JSON.parse(text)
  return textInEn.en || "No descriptive text provided";
}

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
          </div>
          <div className="min-w-0 flex-1">
            <h5 className="text-sm font-black text-primary leading-tight flex items-center gap-2 truncate w-full">
              {r.authorName}
            </h5>
            <div className="flex items-center gap-2 mt-1 overflow-hidden">
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest truncate">{formatReviewDate(r.isoDate, r.date)}</span>
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
            <span className="text-xs font-black text-amber-500 ml-1">{r.rating?.toFixed(1) || "0.0"}</span>
          </div>
        </div>
      </div>

      <div className="relative group-hover:px-2 transition-all duration-500">
        <MessageSquareQuote className="absolute -left-2 -top-4 w-8 h-8 text-indigo-500/10 group-hover:text-indigo-500/20 transition-colors" />
        <p className="text-[14px] leading-[1.8] text-secondary font-medium italic relative z-10 antialiased">
          {formatReviewText(r.text) ? `"${formatReviewText(r.text)}"` : <span className="opacity-40 tracking-widest uppercase text-[10px] font-black not-italic">No descriptive text provided</span>}
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
                {new Date(r.isoDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
