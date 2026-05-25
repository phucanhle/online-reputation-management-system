import { MetricsService } from '@/lib/services/metricsService';
import { getDb } from '@/lib/mongodb';

// Mock the MongoDB connection module
jest.mock('@/lib/mongodb', () => {
  const mockToArray = jest.fn();
  const mockAggregate = jest.fn(() => ({ toArray: mockToArray }));
  const mockFindOne = jest.fn();
  const mockUpdateOne = jest.fn();
  
  const mockCollection = jest.fn((name: string) => {
    return {
      aggregate: mockAggregate,
      findOne: mockFindOne,
      updateOne: mockUpdateOne
    };
  });

  const mockDb = {
    collection: mockCollection
  };

  return {
    getDb: jest.fn(() => Promise.resolve(mockDb)),
    _mockDb: mockDb,
    _mockCollection: mockCollection,
    _mockAggregate: mockAggregate,
    _mockToArray: mockToArray,
    _mockFindOne: mockFindOne,
    _mockUpdateOne: mockUpdateOne
  };
});

describe('MetricsService Integration Tests', () => {
  const { 
    _mockToArray, 
    _mockFindOne, 
    _mockUpdateOne,
    _mockAggregate
  } = require('@/lib/mongodb');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate metrics snapshot and trigger upsert with correct calculations', async () => {
    // 1. Mock first aggregation: branches lookup
    _mockToArray.mockResolvedValueOnce([
      {
        _id: 'cinema-1',
        place_name: 'Lotte Cinema Cong Hoa',
        avg_rating: 4.2,
        total_reviews: 10
      }
    ]);

    // 2. Mock second aggregation: star distribution and sentiment calculations
    _mockToArray.mockResolvedValueOnce([
      {
        _id: null,
        star1: 0,
        star2: 1,
        star3: 1,
        star4: 3,
        star5: 5,
        capturedTotal: 10,
        ratingSum: 42 // 1*2 + 1*3 + 3*4 + 5*5 = 2+3+12+25 = 42
      }
    ]);

    // 3. Mock third aggregation: recent 30d review count
    _mockToArray.mockResolvedValueOnce([
      { count: 6 }
    ]);

    // 4. Mock yesterday snapshot lookup for delta
    _mockFindOne.mockResolvedValueOnce({
      total_reviews: 8 // delta = 10 - 8 = 2
    });

    // 5. Run aggregation
    const progressLogs: any[] = [];
    await MetricsService.runMetricsAggregation((log) => progressLogs.push(log));

    // Verify progress tracking callbacks
    expect(progressLogs.length).toBeGreaterThan(0);
    expect(progressLogs[0].status).toBe('loading');
    expect(progressLogs[progressLogs.length - 1].status).toBe('success');

    // Verify final database updates
    expect(_mockUpdateOne).toHaveBeenCalledTimes(1);
    const updateCall = _mockUpdateOne.mock.calls[0];
    
    // Check filter criteria
    expect(updateCall[0]).toEqual({
      place_id: 'cinema-1',
      date: expect.any(Date)
    });

    // Check document fields
    expect(updateCall[1].$set).toEqual({
      avg_rating: 4.2,
      total_reviews: 10,
      sentiment_score: 4.2,
      density_30d: 0.2, // 6 reviews / 30 days = 0.2
      reviews_last_30d: 6,
      review_delta: 2,
      captured_reviews: 10,
      star_distribution: {
        1: 0,
        2: 1,
        3: 1,
        4: 3,
        5: 5
      },
      updated_at: expect.any(Date)
    });
  });
});
