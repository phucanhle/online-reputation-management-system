import { mapCinema, mapReview } from '@/lib/mappers';

describe('Data Mappers Unit Tests', () => {
  describe('mapCinema', () => {
    it('should correctly normalize snake_case MongoDB properties to camelCase', () => {
      const dbDoc = {
        _id: 'mongo-id-123',
        place_id: 'ch-12345',
        place_name: 'Lotte Cinema Landmark',
        original_url: 'https://google.com/maps/place/lotte',
        avg_rating: 4.5,
        total_reviews: 120,
      };

      const mapped = mapCinema(dbDoc);

      expect(mapped.placeId).toBe('ch-12345');
      expect(mapped.name).toBe('Lotte Cinema Landmark');
      expect(mapped.originalUrl).toBe('https://google.com/maps/place/lotte');
      expect(mapped.avgRating).toBe(4.5);
      expect(mapped.totalReviews).toBe(120);
    });

    it('should preserve camelCase if properties are already mapped', () => {
      const doc = {
        placeId: 'ch-54321',
        name: 'Lotte Cinema Cantavil',
      };

      const mapped = mapCinema(doc);

      expect(mapped.placeId).toBe('ch-54321');
      expect(mapped.name).toBe('Lotte Cinema Cantavil');
    });
  });

  describe('mapReview', () => {
    it('should extract review text from JSON description object structure (python scraper format)', () => {
      const doc = {
        review_id: 'rev-1',
        place_id: 'ch-123',
        author: 'John Doe',
        rating: 5,
        description: { vi: 'Phim rất hay', en: 'Great movie' },
        review_date: '2026-05-20T00:00:00Z',
      };

      const mapped = mapReview(doc);

      expect(mapped.reviewId).toBe('rev-1');
      expect(mapped.cinemaId).toBe('ch-123');
      expect(mapped.authorName).toBe('John Doe');
      expect(mapped.text).toBe('Phim rất hay');
    });

    it('should extract text from JSON string in review_text (sqlite format)', () => {
      const doc = {
        review_id: 'rev-2',
        review_text: '{"en":"Excellent","vi":"Tuyệt vời"}',
        rating: 4,
      };

      const mapped = mapReview(doc);

      expect(mapped.text).toBe('Tuyệt vời');
    });

    it('should fallback to plain review_text string if not a JSON structure', () => {
      const doc = {
        review_id: 'rev-3',
        review_text: 'Good service',
        rating: 4,
      };

      const mapped = mapReview(doc);

      expect(mapped.text).toBe('Good service');
    });
  });
});
