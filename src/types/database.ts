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
  cinemaId: string; // references Cinema.placeId
  date: string;
  totalReviews: number;
  averageRating: number;
  createdAt: Date;
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
