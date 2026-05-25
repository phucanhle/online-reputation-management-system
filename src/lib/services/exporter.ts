/**
 * src/lib/services/exporter.ts
 * Reusable Exporter Service for Excel (XLSX) spreadsheets.
 */

import * as XLSX from 'xlsx';
import { getTags } from '@/components/dashboard/utils';

export interface CinemaExportItem {
  place_name?: string;
  name?: string;
  currentTotalReviews: number;
  currentAverageRating: number;
  reviews: any[];
}

export class ExporterService {
  private static formatReviewText(text: string | null): string {
    if (!text) return '';
    try {
      const parsed = JSON.parse(text);
      return parsed.vi || parsed.en || Object.values(parsed)[0] as string || text;
    } catch {
      return text;
    }
  }

  /**
   * Generates a multi-sheet audit report containing an overview sheet
   * and individual detailed sheets for each cinema branch.
   */
  public static exportAuditReport(cinemas: CinemaExportItem[]): void {
    const wb = XLSX.utils.book_new();

    // 1. Overview sheet
    const overviewData = cinemas.map(c => ({
      "Cinema Name": c.place_name || c.name || 'Unknown',
      "Total Google Reviews": c.currentTotalReviews,
      "Average Rating": c.currentAverageRating.toFixed(2),
    }));
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, "OVERVIEW");

    // 2. Branch detailed sheets
    cinemas.forEach(c => {
      const cinemaReviews = (c.reviews || []).map((r: any) => ({
        "Date": r.date,
        "Author": r.authorName,
        "Rating": r.rating,
        "Review": this.formatReviewText(r.text),
        "Translated": r.translated || "",
        "Tags": getTags(r.text).join(", "),
        "Local Guide": r.localGuide ? "Yes" : "No",
        "Likes": r.likes || 0
      }));
      
      cinemaReviews.sort((a, b) => b.Rating - a.Rating);
      const wsCinema = XLSX.utils.json_to_sheet(cinemaReviews);
      
      // XLSX sheet name rules: no special characters, max 31 characters
      const safeName = (c.place_name || c.name || 'Unknown')
        .replace(/[\[\]\*\?\/\\]/g, "")
        .substring(0, 31);
      
      XLSX.utils.book_append_sheet(wb, wsCinema, safeName);
    });

    const timestamp = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ORMS_Audit_${timestamp}.xlsx`);
  }

  /**
   * Generates a sheet containing 1-star reviews for a selected month and year.
   */
  public static export1StarReviews(
    title: string,
    reviewsWithCinema: { cinemaName: string; authorName?: string; rating: number; isoDate?: string; text?: string }[]
  ): void {
    const dataToExport = reviewsWithCinema.map(r => ({
      Cinema: r.cinemaName,
      Author: r.authorName || 'Anonymous',
      Rating: Number(r.rating),
      Date: r.isoDate ? new Date(r.isoDate).toLocaleDateString('vi-VN') : '',
      Text: this.formatReviewText(r.text || '')
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "1-Star Reviews");
    
    XLSX.writeFile(workbook, `${title}.xlsx`);
  }
}
