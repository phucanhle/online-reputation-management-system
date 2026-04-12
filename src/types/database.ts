import { ObjectId } from 'mongodb';

export interface Cinema {
  _id?: ObjectId;
  placeId: string;
  name?: string;
  originalUrl?: string;
  resolvedUrl?: string;
  latitude?: number;
  longitude?: number;
  firstSeen?: string;
  lastScraped?: string;
  totalReviews?: number;
  avgRating?: number;
}

export interface Review {
  _id?: ObjectId;
  reviewId: string;
  cinemaId: string; // references Cinema.placeId
  authorName?: string;
  authorThumbnail?: string;
  authorLink?: string;
  rating?: number;
  text?: string;
  isoDate?: string;
  date?: string;
  likes?: number;
  userImages?: string;
  s3Images?: string;
  s3ProfilePicture?: string;
  ownerResponses?: string;
  createdDate: string;
  lastModified: string;
  lastSeenSession?: string | null;
  lastChangedSession?: string | null;
  isDeleted?: number;
  contentHash?: string;
  engagementHash?: string;
  rowVersion?: number;
}

export interface BranchDailyMetrics {
  _id?: ObjectId;
  place_id: string; // references Cinema.placeId
  date: Date;
  avg_rating: number;
  total_reviews: number;
  captured_reviews: number;
  sentiment_score: number;
  density_30d: number;
  reviews_last_30d: number;
  star_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  updated_at: Date;
}

export interface ScrapeSession {
  _id?: ObjectId;
  sessionId?: number;
  cinemaId: string; // references Cinema.placeId
  action: string;
  startedAt: string;
  completedAt?: string;
  status: string;
  reviewsFound?: number;
  reviewsNew?: number;
  reviewsUpdated?: number;
  sortBy?: string;
  errorMessage?: string;
}
