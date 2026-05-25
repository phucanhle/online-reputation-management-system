import React from 'react';
import Image from 'next/image';
import { Star, CalendarDays } from 'lucide-react';
import { getTags } from '../utils';
import { Review } from '@/types/database';

function formatReviewDate(isoDate: string | null | undefined, rawDate: string | null | undefined): string {
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

function formatReviewText(text: string | null | undefined): string {
  if (!text) return '';
  try {
    const parsed = JSON.parse(text);
    return parsed.vi || parsed.en || Object.values(parsed)[0] as string || text;
  } catch {
    return text;
  }
}

function ReviewCard({
  review: r,
  highlightedReviewId,
}: {
  review: Review;
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
      : { badge: '#ff3b30', badgeBg: 'rgba(255,59,48,0.10)' };

  const avatarUrl = r.authorThumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.authorName || 'User')}&background=random`;
  // Safe check if image domain is whitelisted
  const isWhitelisted = avatarUrl.includes('googleusercontent.com') || avatarUrl.includes('ui-avatars.com');

  return (
    <div
      id={`review-${r.reviewId}`}
      className={`
        group relative flex flex-col gap-4 p-6
        bg-[var(--surface-1)] border border-[var(--border-color)] rounded-[12px]
        hover:border-[var(--apple-blue)] transition-all duration-300
        ${isHighlighted ? 'ring-2 ring-[var(--apple-blue)] bg-[var(--surface-2)] z-10' : ''}
      `}
    >
      {/* Author row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src={avatarUrl}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            alt={r.authorName || 'User avatar'}
            width={40}
            height={40}
            unoptimized={!isWhitelisted}
          />
          <div className="min-w-0">
            <p className="sf-text-body text-[15px] font-semibold text-primary truncate">
              {r.authorName || 'Anonymous'}
            </p>
            <p className="sf-text-caption text-[13px] text-tertiary mt-0.5">
              {rDate}
            </p>
          </div>
        </div>

        {/* Rating pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full flex-shrink-0"
          style={{ background: ratingColor.badgeBg }}
        >
          <Star
            className="w-3.5 h-3.5 fill-current"
            style={{ color: ratingColor.badge }}
          />
          <span
            className="sf-text-caption text-[13px] font-semibold tabular-nums"
            style={{ color: ratingColor.badge }}
          >
            {rating.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Review text */}
      <p className="sf-text-body text-[15px] text-primary leading-relaxed">
        {rText
          ? `"${rText}"`
          : <span className="opacity-40 italic">Không có nội dung đánh giá</span>
        }
      </p>

      {/* Footer: tags + date */}
      <div className="flex items-center justify-between gap-3 mt-auto">
        <div className="flex flex-wrap gap-1.5 overflow-hidden">
          {tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[var(--surface-2)] border border-[var(--border-color)] rounded-[4px] sf-text-caption text-[11px] font-medium text-secondary whitespace-nowrap uppercase tracking-wider"
            >
              {tag}
            </span>
          ))}
        </div>
        {r.isoDate && (
          <div className="flex items-center gap-1.5 text-tertiary flex-shrink-0 opacity-60">
            <CalendarDays className="w-3.5 h-3.5" />
            <span className="sf-text-caption text-[12px]">
              {new Date(r.isoDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ReviewCard);
