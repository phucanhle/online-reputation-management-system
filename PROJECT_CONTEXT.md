# Project Context: Cinema Reputation Monitor (ORMS)

## Overview
The Cinema Reputation Monitor is a specialized web application designed to scrap, aggregate, and visualize reputation data for cinema branches from Google Maps. It uses SerpAPI to fetch real-time reviews and ratings, storing them in a local SQLite database for historical analysis and trend tracking.

## Technology Stack
- **Framework**: [Next.js 16+](https://nextjs.org/) (App Router)
- **Database**: [MongoDB](https://www.mongodb.com/) (Standard for Metrics & Reviews) and [SQLite](https://www.sqlite.org/) (Legacy Reference)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) with a premium dark-mode aesthetic
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Data Fetching**: [SerpAPI](https://serpapi.com/) & [FastAPI Scraper Cluster]
- **Exports**: [XLSX](https://github.com/SheetJS/sheetjs) for multi-sheet Excel reports

## Core Data Models (MongoDB)
1. **Cinema**: Represents a physical location (place_id, name).
2. **BranchDailyMetrics**: Snapshot table storing pre-calculated daily metrics (sentiment score, density_30d, star distribution).
3. **Review**: Individual feedback records with author details, text, rating, and sentiment tags.

## Key Components & Logic
- **`src/lib/scraper.ts`**: The core logic that reads PlaceIDs from `data/PlaceIDdata.csv`, fetches data from SerpAPI, and performs upserts into Prisma.
- **`src/components/DashboardClient.tsx`**: The main UI shell that orchestrates state via the custom hook `useDashboardData`. It renders modular components from the `src/components/dashboard/` directory:
  - **`layout/`**: `DashboardSidebar` (Navigation, Search, Export) & `DashboardHeader` (Theme, Sync, Title).
  - **`views/`**: `GlobalView` (Network Reputation, Heatmap) & `BranchView` (Sentiment, Momentum Charts, Intelligent Feed).
  - **`components/`**: `SyncOverlay` (Background scraping block UI) & `ReviewCard` (Individual review visualizer).
  - **`hooks/useDashboardData.ts`**: Contains all complex state management locally (`useMemo` data pipelines for metrics, momentum, and search filters).

## Implementation Details
### Syncing Overlay
Uses Framer Motion `AnimatePresence` to block the UI when `isSyncing` is true. This prevents users from initiating multiple concurrent scrapes or navigating away while database transactions are in progress.

### Historical Tracking
The application uses a "Snapshot" pattern. Every time a sync is triggered, it records the *current* state in `BranchDailyMetrics`. This allows the charts to show growth over time rather than just a static count.

### Tagging System
Heuristic-based tagging categorizes reviews into:
- **Service**: Staff attitude, service quality.
- **Cleanliness**: Hygiene and maintenance.
- **Food**: Popcorn, drinks, snacks.
- **Experience**: Seating, sound, screen quality.

## Project Structure
```text
/
├── prisma/               # Database schema and migrations
├── data/                 # Source CSV (PlaceIDdata.csv) and SQLite DB
├── scripts/              # Utility scripts
├── src/
│   ├── app/              # Next.js App Router (Layouts, Pages, API)
│   ├── components/       # UI Components
│   │   ├── dashboard/    # Sub-modules (layout, views, hooks, components)
│   │   └── DashboardClient.tsx # Main orchestrator
│   └── lib/              # Logic utilities (Scraper, Prisma client)
└── PROJECT_CONTEXT.md    # This file (Architectural Documentation)
```

## Maintenance Notes
- **API Keys**: Stored in `.env` (`SERP_API_KEY`).
- **Adding Cinemas**: Update `data/PlaceIDdata.csv` with new names and PlaceIDs, then trigger a sync from the dashboard.
- **Database Migration**: If the schema changes, run `npx prisma migrate dev` or `npx prisma db push`.
