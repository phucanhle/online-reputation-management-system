import { useState, useMemo, useEffect } from 'react';
import { safeParseDate, getTags } from '../utils';

export function useDashboardData(
  cinemas: any[],
  globalMetrics: { totalReviews: number, avgRating: number },
  branchAggregates: any[]
) {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'global' | 'branch'>('global');
  const [activeTab, setActiveTab] = useState<string>(cinemas[0]?.placeId || '');
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cinemaSearchQuery, setCinemaSearchQuery] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
  const [leaderboardSort, setLeaderboardSort] = useState<'top' | 'bottom'>('top');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(20);
  const [criticalSort, setCriticalSort] = useState<'date' | 'rating'>('date');
  const [sidebarSort, setSidebarSort] = useState<'name' | 'rating-desc' | 'rating-asc'>('name');
  const [topicSort, setTopicSort] = useState<'rating-desc' | 'rating-asc'>('rating-desc');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [momentumGranularity, setMomentumGranularity] = useState<'day' | 'week' | 'month'>('day');
  const [momentumDateRange, setMomentumDateRange] = useState<{start: string, end: string}>({start: '', end: ''});
  const [extraReviews, setExtraReviews] = useState<Record<string, any[]>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reviewPages, setReviewPages] = useState<Record<string, number>>({});
  const [totalReviewsAvailable, setTotalReviewsAvailable] = useState<Record<string, number>>({});

  // -- Debounced States for Search Optimization --
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [debouncedCinemaSearchQuery, setDebouncedCinemaSearchQuery] = useState(cinemaSearchQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedCinemaSearchQuery(cinemaSearchQuery), 300);
    return () => clearTimeout(timer);
  }, [cinemaSearchQuery]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Create lookups for faster compute
  const aggregateMap = useMemo(() => {
    const map: Record<string, any> = {};
    branchAggregates.forEach(agg => {
      map[agg.cinemaId] = {
        count: agg._count._all,
        rating: agg._avg.rating
      };
    });
    return map;
  }, [branchAggregates]);

  // --- Processed Cinemas with Latest Metrics ---
  const cinemasWithLatest = useMemo(() => {
    return cinemas.map(c => {
      const agg = aggregateMap[c.place_id];

      const currentTotalReviews = agg?.count || 0;
      const currentAverageRating = agg?.rating || 0;

      // Merge initial reviews with extra reviews loaded via API
      const combinedReviews = [...(c.reviews || []), ...(extraReviews[c.placeId] || [])];

      return {
        ...c,
        currentTotalReviews,
        currentAverageRating,
        reviews: combinedReviews.map((r: any) => ({ ...r, tags: getTags(r.text) }))
      };
    });
  }, [cinemas, aggregateMap, extraReviews]);

  const loadMoreReviews = async (cinemaId: string) => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    const currentPage = reviewPages[cinemaId] || 1;
    const nextPage = currentPage + 1;

    try {
      const res = await fetch(`/api/reviews?cinemaId=${cinemaId}&page=${nextPage}&limit=100`);
      const data = await res.json();

      if (data.reviews) {
        setExtraReviews(prev => ({
          ...prev,
          [cinemaId]: [...(prev[cinemaId] || []), ...data.reviews]
        }));
        setReviewPages(prev => ({ ...prev, [cinemaId]: nextPage }));
        setTotalReviewsAvailable(prev => ({ ...prev, [cinemaId]: data.total }));
      }
    } catch (error) {
      console.error('Failed to load more reviews:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredCinemas = useMemo(() => {
    let result = cinemasWithLatest.filter(c =>
      (c.name || '').toLowerCase().includes(debouncedCinemaSearchQuery.toLowerCase())
    );

    if (sidebarSort === 'rating-desc') result.sort((a, b) => b.currentAverageRating - a.currentAverageRating);
    else if (sidebarSort === 'rating-asc') result.sort((a, b) => a.currentAverageRating - b.currentAverageRating);
    else result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return result;
  }, [cinemasWithLatest, debouncedCinemaSearchQuery, sidebarSort]);

  // --- Compute Global Data ---
  const globalData = useMemo(() => {
    const branchRatings: { name: string, rating: number, count: number, placeId: string }[] = [];
    const recentNegative: any[] = [];
    const sentimentCounts = [0, 0, 0, 0, 0];

    cinemasWithLatest.forEach(c => {
      branchRatings.push({
        name: c.place_name,
        rating: c.currentAverageRating,
        count: c.currentTotalReviews,
        placeId: c.place_id
      });

      c.reviews.forEach((r: any) => {
        if (r.rating <= 2) recentNegative.push({
          ...r,
          cinemaName: c.name,
          placeId: c.placeId,
          mapsSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.name)}&query_place_id=${c.placeId}`
        });
        if (r.rating >= 1 && r.rating <= 5) sentimentCounts[r.rating - 1]++;
      });
    });

    const leaderboard = [...branchRatings].sort((a, b) =>
      leaderboardSort === 'top' ? b.rating - a.rating : a.rating - b.rating
    );
    const criticalAlerts = [...recentNegative].sort((a, b) => {
      if (criticalSort === 'rating') {
        if (a.rating !== b.rating) return a.rating - b.rating;
      }
      return safeParseDate(b.isoDate) - safeParseDate(a.isoDate);
    }).slice(0, 50);

    return {
      avgRating: globalMetrics.avgRating.toFixed(1),
      totalReviews: 0, // This is count of LOADED reviews, which we might not need to show as a primary metric anymore
      totalGoogleReviews: globalMetrics.totalReviews,
      leaderboard,
      criticalAlerts,
      sentimentDistribution: [
        { name: '1 ★', count: sentimentCounts[0], fill: '#ef4444' },
        { name: '2 ★', count: sentimentCounts[1], fill: '#f97316' },
        { name: '3 ★', count: sentimentCounts[2], fill: '#f59e0b' },
        { name: '4 ★', count: sentimentCounts[3], fill: '#84cc16' },
        { name: '5 ★', count: sentimentCounts[4], fill: '#10b981' }
      ]
    };
  }, [cinemasWithLatest, leaderboardSort, criticalSort, globalMetrics]);

  const activeCinema = useMemo(() => cinemasWithLatest.find(c => c.placeId === activeTab) || cinemasWithLatest[0], [cinemasWithLatest, activeTab]);

  // --- Momentum Computation ---
  const momentumData = useMemo(() => {
    if (!activeCinema) return [];

    let sortedReviews = [...(activeCinema.reviews || [])];
    
    // Sort all available reviews chronologically oldest to newest for historical accumulation
    sortedReviews.sort((a: any, b: any) => safeParseDate(a.isoDate) - safeParseDate(b.isoDate));

    const timelineData: { [key: string]: { dateVal: Date, count: number, ratingSum: number, reviewCount: number } } = {};
    let runningTotal = (activeCinema.currentTotalReviews || 0) - sortedReviews.length;
    if (runningTotal < 0) runningTotal = 0;

    sortedReviews.forEach((r: any) => {
      if (!r.isoDate) return;
      let dateKey = '';
      const dateObj = new Date(r.isoDate);
      
      if (momentumGranularity === 'day') {
        dateKey = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      } else if (momentumGranularity === 'week') {
        const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
        dateKey = `W${weekNo} ${d.getUTCFullYear()}`;
      } else {
        dateKey = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }

      runningTotal++;
      
      if (!timelineData[dateKey]) {
        timelineData[dateKey] = { dateVal: dateObj, count: runningTotal, ratingSum: r.rating || 0, reviewCount: 1 };
      } else {
        timelineData[dateKey].count = runningTotal;
        timelineData[dateKey].ratingSum += (r.rating || 0);
        timelineData[dateKey].reviewCount += 1;
      }
    });

    let results = Object.entries(timelineData).map(([date, data]) => ({ 
      date,
      dateVal: data.dateVal,
      count: data.count,
      rating: data.reviewCount > 0 ? data.ratingSum / data.reviewCount : 0 
    }));

    // Filter by chosen Date Range
    if (momentumDateRange.start) {
      const startD = new Date(momentumDateRange.start);
      // set to start of day
      startD.setHours(0, 0, 0, 0);
      results = results.filter(r => r.dateVal >= startD);
    }
    if (momentumDateRange.end) {
      const endD = new Date(momentumDateRange.end);
      endD.setHours(23, 59, 59, 999);
      results = results.filter(r => r.dateVal <= endD);
    }

    return results;
  }, [activeCinema, momentumGranularity, momentumDateRange]);

  const reviewVelocity = useMemo(() => {
    if (momentumData.length < 2) return 0;
    const start = momentumData[0].count;
    const end = momentumData[momentumData.length - 1].count;
    return end - start;
  }, [momentumData]);

  const growthPercentage = useMemo(() => {
    if (momentumData.length < 2) return "0.0";
    const start = momentumData[0].count;
    const end = momentumData[momentumData.length - 1].count;
    if (start === 0) return end > 0 ? "100.0" : "0.0";
    return (((end - start) / start) * 100).toFixed(1);
  }, [momentumData]);

  const filteredReviews = useMemo(() => {
    if (!activeCinema) return [];
    const q = debouncedSearchQuery.toLowerCase();

    let result = activeCinema.reviews.filter((r: any) => {
      const ratingMatch = selectedRatings.length === 0 || selectedRatings.includes(r.rating);
      const textMatch = !q || (r.text?.toLowerCase().includes(q)) || (r.authorName?.toLowerCase().includes(q));

      const reviewTags = r.tags || [];
      const tagMatch = selectedTags.length === 0 || selectedTags.some(t => reviewTags.includes(t));

      return ratingMatch && textMatch && tagMatch;
    });
    return result.sort((a: any, b: any) => {
      const dateA = safeParseDate(a.isoDate);
      const dateB = safeParseDate(b.isoDate);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [activeCinema, selectedRatings, sortOrder, debouncedSearchQuery, selectedTags, highlightedReviewId]);

  useEffect(() => {
    if (highlightedReviewId) {
      // Ensure the highlighted review is visible
      setVisibleReviewsCount(prev => Math.max(prev, (filteredReviews.findIndex((r: any) => r.reviewId === highlightedReviewId) + 1) || 20));

      setTimeout(() => {
        const el = document.getElementById(`review-${highlightedReviewId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500); // Wait for tab switch and render
      const timer = setTimeout(() => setHighlightedReviewId(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [highlightedReviewId, filteredReviews]);

  return {
    mounted,
    viewMode, setViewMode,
    activeTab, setActiveTab,
    selectedRatings, setSelectedRatings,
    sortOrder, setSortOrder,
    searchQuery, setSearchQuery,
    cinemaSearchQuery, setCinemaSearchQuery,
    selectedTags, setSelectedTags,
    isSyncing, setIsSyncing,
    syncLogs, setSyncLogs,
    highlightedReviewId, setHighlightedReviewId,
    leaderboardSort, setLeaderboardSort,
    visibleReviewsCount, setVisibleReviewsCount,
    criticalSort, setCriticalSort,
    sidebarSort, setSidebarSort,
    topicSort, setTopicSort,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    momentumGranularity, setMomentumGranularity,
    momentumDateRange, setMomentumDateRange,
    debouncedSearchQuery,
    debouncedCinemaSearchQuery,
    cinemasWithLatest,
    filteredCinemas,
    globalData,
    activeCinema,
    momentumData,
    reviewVelocity,
    growthPercentage,
    filteredReviews,
    isLoadingMore,
    loadMoreReviews,
    hasMore: (totalReviewsAvailable[activeTab] || activeCinema?.currentTotalReviews || 0) > (activeCinema?.reviews?.length || 0)
  };
}

export type DashboardState = ReturnType<typeof useDashboardData>;
