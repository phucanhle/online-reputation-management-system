import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeParseDate, getTags } from '../utils';

export function useDashboardData(
  cinemas: any[],
  globalMetrics: { totalReviews: number, avgRating: number },
  branchAggregates: any[]
) {
  const router = useRouter();
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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [selectedCinemasForSync, setSelectedCinemasForSync] = useState<string[]>([]);
  const [highlightedReviewId, setHighlightedReviewId] = useState<string | null>(null);
  const [leaderboardSort, setLeaderboardSort] = useState<'top' | 'bottom'>('top');
  const [visibleReviewsCount, setVisibleReviewsCount] = useState<number>(20);
  const [criticalSort, setCriticalSort] = useState<'date' | 'rating'>('date');
  const [sidebarSort, setSidebarSort] = useState<'name' | 'rating-desc' | 'rating-asc'>('name');
  const [topicSort, setTopicSort] = useState<'rating-desc' | 'rating-asc'>('rating-desc');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [extraReviews, setExtraReviews] = useState<Record<string, any[]>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [reviewPages, setReviewPages] = useState<Record<string, number>>({});
  const [totalReviewsAvailable, setTotalReviewsAvailable] = useState<Record<string, number>>({});
  const [historicalMetrics, setHistoricalMetrics] = useState<any[]>([]);
  const [isMetricsLoading, setIsMetricsLoading] = useState(false);
  const [officialStatsMap, setOfficialStatsMap] = useState<Record<string, { avgRating: number, totalReviews: number, capturedReviews: number }>>({});

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

  useEffect(() => {
    if (!mounted) return;
    const fetchOfficialStats = async () => {
      try {
        const res = await fetch('/api/places/official');
        const data = await res.json();
        if (data.data) {
          const map: Record<string, { avgRating: number, totalReviews: number, capturedReviews: number }> = {};
          data.data.forEach((p: any) => {
            map[p.placeId] = { 
              avgRating: p.avgRating, 
              totalReviews: p.totalReviews,
              capturedReviews: p.capturedReviews 
            };
          });
          setOfficialStatsMap(map);
        }
      } catch (err) {
        console.error('Failed to load official stats:', err);
      }
    };
    fetchOfficialStats();
  }, [mounted, isSyncing]);

  // Create lookups for faster compute
  const aggregateMap = useMemo(() => {
    const map: Record<string, any> = {};
    branchAggregates.forEach(agg => {
      map[agg.cinemaId] = {
        count: agg._count._all,
        rating: agg._avg.rating,
        sentiment: agg.sentiment_score,
        density: agg.density_30d,
        distribution: agg.star_distribution
      };
    });
    return map;
  }, [branchAggregates]);

  // --- Processed Cinemas with Latest Metrics ---
  const cinemasWithLatest = useMemo(() => {
    return cinemas.map(c => {
      // DB uses place_id (snake_case); after mapping, cinema has placeId (camelCase) — try both
      const pid = c.place_id || c.placeId || '';
      const agg = aggregateMap[pid];

      const currentTotalReviews = officialStatsMap[pid]?.totalReviews ?? agg?.count ?? 0;
      const currentAverageRating = officialStatsMap[pid]?.avgRating ?? agg?.rating ?? 0;
      const capturedReviews = officialStatsMap[pid]?.capturedReviews ?? c.reviews?.length ?? 0;

      // Merge initial reviews with extra reviews loaded via API
      const combinedReviews = [...(c.reviews || []), ...(extraReviews[pid] || [])];

      return {
        ...c,
        place_id: pid, // ensure place_id is always set
        currentTotalReviews,
        currentAverageRating,
        capturedReviews,
        sentimentScore: agg?.sentiment ?? 0,
        feedbackDensity: agg?.density ?? 0,
        starDistribution: agg?.distribution ?? null,
        reviews: combinedReviews.map((r: any) => ({ ...r, tags: getTags(r.text) }))
      };
    });
  }, [cinemas, aggregateMap, extraReviews, officialStatsMap]);

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

      // Filter critical alerts (all-time since timeFilter removed)
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

    // Calculate dynamic global stats based on officialStatsMap (if available) or server fallback
    const totalGoogleReviews = cinemasWithLatest.reduce((acc, c: any) => acc + (c.currentTotalReviews || 0), 0);
    const totalCapturedReviews = cinemasWithLatest.reduce((acc, c: any) => acc + (c.capturedReviews || 0), 0);
    const weightedSum = cinemasWithLatest.reduce((acc, c: any) => acc + ((c.currentAverageRating || 0) * (c.currentTotalReviews || 0)), 0);
    const dynamicAvgRating = totalGoogleReviews > 0 ? (weightedSum / totalGoogleReviews) : globalMetrics.avgRating;

    return {
      avgRating: dynamicAvgRating.toFixed(2),
      totalReviews: totalCapturedReviews,
      totalGoogleReviews,
      totalCapturedReviews,
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
  }, [activeCinema, selectedRatings, sortOrder, debouncedSearchQuery, selectedTags]);

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

  // --- Sync Integration (Local Python Scraper via /api/scrape) ---
  const startCloudSync = async (target: 'all' | 'selected', officialOnly: boolean = false) => {
    setIsSyncing(true);
    setIsSyncModalOpen(false);
    setSyncLogs([{ cinema: 'System', status: 'loading', message: officialOnly ? 'Đang thực hiện đồng bộ nhanh...' : 'Đang khởi động Python scraper...' }]);

    try {
      const selectedData = target === 'selected' 
        ? cinemasWithLatest.filter(c => selectedCinemasForSync.includes(c.placeId)).map(c => ({
            id: c.placeId,
            url: c.originalUrl,
            name: c.name
          }))
        : [];

      const resp = await fetch('/api/scrape', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cinemas: selectedData, officialOnly })
      });
      if (!resp.body) throw new Error('No response body from /api/scrape');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const update = JSON.parse(line);
            setSyncLogs(prev => {
              const existingIdx = prev.findIndex(l => l.cinema === update.cinema);
              if (existingIdx > -1) {
                const next = [...prev];
                next[existingIdx] = update;
                return next;
              }
              return [...prev, update];
            });
          } catch (e) {
            // ignore parse errors
          }
        }
      }

      // Refresh page data after sync completes
      setTimeout(() => {
        router.refresh();
        setIsSyncing(false);
      }, 2000);

    } catch (error) {
      console.error('Sync failed:', error);
      setSyncLogs(prev => [...prev, { cinema: 'System', status: 'error', message: String(error) }]);
      setIsSyncing(false);
    }
  };


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
    isSyncModalOpen, setIsSyncModalOpen,
    selectedCinemasForSync, setSelectedCinemasForSync,
    highlightedReviewId, setHighlightedReviewId,
    leaderboardSort, setLeaderboardSort,
    visibleReviewsCount, setVisibleReviewsCount,
    criticalSort, setCriticalSort,
    sidebarSort, setSidebarSort,
    topicSort, setTopicSort,
    isMobileSidebarOpen, setIsMobileSidebarOpen,
    isActivityDrawerOpen, setIsActivityDrawerOpen,
    debouncedSearchQuery,
    debouncedCinemaSearchQuery,
    cinemasWithLatest,
    filteredCinemas,
    globalData,
    activeCinema,
    filteredReviews,
    isLoadingMore,
    loadMoreReviews,
    startCloudSync,
    hasMore: (totalReviewsAvailable[activeTab] || activeCinema?.currentTotalReviews || 0) > (activeCinema?.reviews?.length || 0)
  };
}

export type DashboardState = ReturnType<typeof useDashboardData>;
