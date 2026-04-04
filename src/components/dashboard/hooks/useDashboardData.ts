import { useState, useMemo, useEffect } from 'react';
import { safeParseDate, getTags } from '../utils';

export function useDashboardData(cinemas: any[]) {
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

  // --- Processed Cinemas with Latest Metrics ---
  const cinemasWithLatest = useMemo(() => {
    return cinemas.map(c => {
      const sortedMetrics = [...(c.metrics || [])].sort((a: any, b: any) => b.date.localeCompare(a.date));
      let latest = sortedMetrics[0];

      // If no valid dynamic metric yet, fallback to reviewing the static counts if possible
      // (though we removed them, let's derive from current reviews as baseline)
      const currentTotalReviews = (latest?.totalReviews && latest.totalReviews > 0)
        ? latest.totalReviews
        : (c.reviews?.length || 0);

      const currentAverageRating = (latest?.averageRating && latest.averageRating > 0)
        ? latest.averageRating
        : (c.reviews?.length > 0 ? (c.reviews.reduce((acc: number, curr: any) => acc + curr.rating, 0) / c.reviews.length) : 0);

      return {
        ...c,
        currentTotalReviews,
        currentAverageRating,
        reviews: (c.reviews || []).map((r: any) => ({ ...r, tags: getTags(r.text) }))
      };
    });
  }, [cinemas]);

  const filteredCinemas = useMemo(() => {
    let result = cinemasWithLatest.filter(c =>
      c.name.toLowerCase().includes(debouncedCinemaSearchQuery.toLowerCase())
    );
    
    if (sidebarSort === 'rating-desc') result.sort((a, b) => b.currentAverageRating - a.currentAverageRating);
    else if (sidebarSort === 'rating-asc') result.sort((a, b) => a.currentAverageRating - b.currentAverageRating);
    else result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [cinemasWithLatest, debouncedCinemaSearchQuery, sidebarSort]);

  // --- Compute Global Data ---
  const globalData = useMemo(() => {
    let totalR = 0;
    let totalGoogleReviews = 0;
    let sumRating = 0;
    const branchRatings: { name: string, rating: number, count: number, placeId: string }[] = [];
    const recentNegative: any[] = [];
    const sentimentCounts = [0, 0, 0, 0, 0];

    cinemasWithLatest.forEach(c => {
      totalGoogleReviews += c.currentTotalReviews;
      branchRatings.push({
        name: c.name,
        rating: c.currentAverageRating,
        count: c.currentTotalReviews,
        placeId: c.placeId
      });

      c.reviews.forEach((r: any) => {
        totalR++;
        sumRating += r.rating;
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

    const activeBranches = cinemasWithLatest.filter(c => c.currentAverageRating > 0);

    return {
      avgRating: activeBranches.length > 0
        ? (activeBranches.reduce((acc: number, curr: any) => acc + curr.currentAverageRating, 0) / activeBranches.length).toFixed(1)
        : "0.0",
      totalReviews: totalR,
      totalGoogleReviews,
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
  }, [cinemasWithLatest, leaderboardSort, criticalSort]);

  const activeCinema = useMemo(() => cinemasWithLatest.find(c => c.placeId === activeTab) || cinemasWithLatest[0], [cinemasWithLatest, activeTab]);

  // --- Momentum Computation ---
  const momentumData = useMemo(() => {
    if (!activeCinema) return [];

    // Use official daily metrics for historical tracking
    if (activeCinema.metrics && activeCinema.metrics.length > 0) {
      return activeCinema.metrics.map((m: any) => ({
        date: m.date,
        count: m.totalReviews,
        rating: m.averageRating,
      }));
    }

    // Fallback pseudo-history
    const sortedReviews = [...activeCinema.reviews].sort((a: any, b: any) =>
      safeParseDate(a.isoDate) - safeParseDate(b.isoDate)
    );

    const monthlyData: { [key: string]: number } = {};
    let runningTotal = (activeCinema.currentTotalReviews || 0) - sortedReviews.length;
    if (runningTotal < 0) runningTotal = 0;

    sortedReviews.forEach((r: any) => {
      const month = new Date(r.isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      runningTotal++;
      monthlyData[month] = runningTotal;
    });

    return Object.entries(monthlyData).map(([date, count]) => ({ date, count }));
  }, [activeCinema]);

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
    debouncedSearchQuery,
    debouncedCinemaSearchQuery,
    cinemasWithLatest,
    filteredCinemas,
    globalData,
    activeCinema,
    momentumData,
    reviewVelocity,
    growthPercentage,
    filteredReviews
  };
}

export type DashboardState = ReturnType<typeof useDashboardData>;
