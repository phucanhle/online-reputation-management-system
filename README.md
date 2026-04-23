# ORMS: Online Reputation Management System 🍿

**ORMS** is a high-performance, real-time analytics dashboard designed for multi-location cinema operations. It automates the collection of Google Maps reviews and transforms raw feedback into actionable business intelligence through dynamic MongoDB aggregation pipelines and an Apple-inspired, minimalist aesthetic.

## 🚀 Key Features

- **Real-Time Data Node Sync**: Automated batch-scraping of Google Maps reviews using an external FastAPI crawler backend with a protective UI overlay to ensure data integrity during long-running tasks.
- **Dynamic Aggregation Analytics**: High-precision reputation metrics (Sentiment, Feedback Density, and Growth Momentum) computed natively on-the-fly using MongoDB Aggregation Pipelines against a single unified `reviews` collection.
- **Intelligent Insight Feed**: Topic-based filtering (Service, Cleanliness, Food, Experience) combined with binary sentiment sorting for rapid response to critical feedback.
- **Professional Reporting**: Multi-sheet Excel export system generating comprehensive "Audit Reports" with branch-specific sheets and star-rating sorting.
- **Apple-Inspired Minimalism**: A premium, content-first user interface utilizing a strict binary color rhythm (Light/Dark mode), native Apple typography (`SF Pro`), flat elevations, and `Apple Blue` interactive accents, replacing legacy glassmorphism.

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Logic** | TypeScript / React 19 |
| **Database** | Native MongoDB Driver (Aggregating dynamic metrics via pipeline) |
| **Styling** | TailwindCSS + Custom CSS Design Tokens |
| **External API** | Custom FastAPI Python Crawler (Google Maps Reviews Engine) |
| **Reporting** | SheetJS (XLSX) |

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- MongoDB Instance (Local or Atlas)

### 2. Installation
```bash
git clone https://github.com/phucanhle/online-reputation-management-system.git
cd online-reputation-management-system
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
MONGODB_URI="mongodb://localhost:27017/orms_db?directConnection=true"
```
*(Note: Replace the `MONGODB_URI` with your actual MongoDB connection string. Direct connection is recommended for local Replica Set setups to bypass DNS SRV issues).*

### 4. Launch
```bash
npm run dev
```

## 🌍 Deployment

This project is optimized for deployment on modern Edge/Serverless environments like **Vercel**. Since the application now utilizes a native MongoDB driver with dynamic pipelines, it scales effortlessly without the need for complex ORM query engines.

---

Designed for modern cinema chains to stay ahead of the digital conversation with cinematic pacing and precision.
