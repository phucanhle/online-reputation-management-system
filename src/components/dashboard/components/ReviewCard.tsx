import React from 'react';
import { Star, CalendarDays } from 'lucide-react';
import { getTags } from '../utils';

function formatReviewDate(isoDate: string | null, rawDate: string | null) {
  if (!isoDate) return rawDate || 'Recently';
  const date = new Date(isoDate);
  const now = new Date();

  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return rawDate || date.toLocaleDateString('vi-VN');
}

function formatReviewText(text: string | null): string {
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    return parsed.vi || parsed.en || Object.values(parsed)[0] as string || text;
  } catch {
    return text;
  }
}

export default function ReviewCard({
  review: r,
  highlightedReviewId,
}: {
  review: any;
  highlightedReviewId: string | null;
}) {
  const isHighlighted = highlightedReviewId === r.reviewId;
  const rText = formatReviewText(r.text);
  const rDate = formatReviewDate(r.isoDate, r.date);
  const tags = getTags(r.text);
  const rating = Number(r.rating) || 0;

  // Derive border accent from rating
  const ratingColor = rating >= 4
    ? { badge: '#34c759', badgeBg: 'rgba(52,199,89,0.10)' }
    : rating >= 3
      ? { badge: '#f59e0b', badgeBg: 'rgba(245,158,11,0.10)' }
      : { badge: '#ff453a', badgeBg: 'rgba(255,69,58,0.10)' };

  return (
    <div
      id={`review-${r.reviewId}`}
      className={`
        group relative flex flex-col gap-4 p-6
        bg-[var(--surface-1)] border-none
        rounded-[8px] transition-all duration-300
        hover:shadow-product
        ${isHighlighted ? 'highlight-pulse ring-2 ring-[#0071e3]/40 z-10' : ''}
      `}
      style={{ boxShadow: 'var(--shadow-product)' }}
    >
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={r.authorThumbnail || `https://ui-avatars.com/api/?name=${r.authorName || 'User'}&background=random`}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          <div className="min-w-0">
            <p
              className="text-[14px] font-bold text-primary truncate leading-[1.29]"
              style={{ letterSpacing: '-0.224px' }}
            >
              {r.authorName || 'Anonymous'}
            </p>
            <p
              className="text-[12px] text-tertiary mt-0.5 leading-[1.33]"
              style={{ letterSpacing: '-0.12px' }}
            >
              {rDate}
            </p>
          </div>
        </div>

        {/* Rating pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-[980px] flex-shrink-0"
          style={{ background: ratingColor.badgeBg }}
        >
          <Star
            className="w-3.5 h-3.5 fill-current"
            style={{ color: ratingColor.badge }}
          />
          <span
            className="text-[13px] font-bold tabular-nums"
            style={{ color: ratingColor.badge, letterSpacing: '-0.12px' }}
          >
            {rating.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Review text */}
      <p
        className="text-[16px] text-primary leading-[1.47]"
        style={{ letterSpacing: '-0.374px' }}
      >
        {rText
          ? `"${rText}"`
          : <span className="opacity-30 italic text-[14px]">Không có nội dung đánh giá</span>
        }
      </p>

      {/* Footer: tags + date */}
      <div className="flex items-center justify-between gap-3 mt-auto">
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[var(--surface-2)] rounded-[4px] text-[10px] font-bold text-tertiary whitespace-nowrap uppercase tracking-wider"
              style={{ letterSpacing: '0.05em' }}
            >
              {tag}
            </span>
          ))}
        </div>
        {r.isoDate && (
          <div className="flex items-center gap-1.5 text-tertiary flex-shrink-0 opacity-60">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium" style={{ letterSpacing: '-0.12px' }}>
              {new Date(r.isoDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
