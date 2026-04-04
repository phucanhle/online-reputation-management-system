# ORMS CORE: Cinema Reputation Monitor 🍿

**ORMS CORE** (Online Reputation Management System) is a high-performance, real-time analytics dashboard designed for multi-location cinema operations. It automates the collection of Google Maps reviews and transforms raw feedback into actionable business intelligence through advanced sentiment mapping and fact-table architecture.

![Global Dashboard Overview](./public/assets/documentation/dashboard_global.png)

## 🚀 Key Features

- **Real-Time Data Node Sync**: Automated batch-scraping of Google Maps reviews using SerpAPI with a protective UI overlay to ensure data integrity during long-running tasks.
- **Fact-Table Analytics**: High-precision reputation metrics (Sentiment, Feedback Density, and Growth Momentum) powered by a Prisma-backed daily snapshot engine.
- **Intelligent Insight Feed**: Topic-based filtering (Service, Cleanliness, Food, Experience) combined with binary sentiment sorting for rapid response to critical feedback.
- **Reputation Momentum Visualization**: Multi-variable Time-series charting of historical rating trends and review velocity.
- **Professional Reporting**: Refactored multi-sheet Excel export system generating comprehensive "Audit Reports" with branch-specific sheets and star-rating sorting.
- **Premium UX/UI**: Dark-mode first design utilizing glassmorphism, Framer Motion micro-animations, and high-density information layouts.

## 📸 Branch Analytics

Detailed branch-level insights showing localized topic analysis and historical momentum:

![Branch Detail View](./public/assets/documentation/dashboard_branch.png)

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router & Turbopack) |
| **Logic** | TypeScript / React 19 |
| **Database** | Prisma ORM with SQLite (Dimensions/Fact Architecture) |
| **Styling** | TailwindCSS + Framer Motion |
| **External API** | [SerpAPI](https://serpapi.com/) (Google Maps Reviews Engine) |
| **Reporting** | SheetJS (XLSX) |

## 📦 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- SerpAPI Key ([Get it here](https://serpapi.com/))

### 2. Installation
```bash
git clone https://github.com/yourusername/cinema-reputation-monitor.git
cd web-app
npm install
```

### 3. Environment Setup
Create a `.env` file in the root:
```env
SERP_API_KEY="YOUR_KEY_HERE"
DATABASE_URL="file:./dev.db"
```

### 4. Database Initialization
```bash
npx prisma generate
npx prisma db push
```

### 5. Launch
```bash
npm run dev
```

## 🌍 Deployment

This project is optimized for deployment on **Vercel**. 
> [!NOTE]
> Please refer to the **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for specific instructions on handling SQLite persistence vs Hosted Databases in production.

---

Designed for modern cinema chains to stay ahead of the digital conversation.
