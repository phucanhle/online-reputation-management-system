# Vercel Deployment Guide: Cinema Reputation Monitor

This guide will help you deploy the ORMS dashboard to Vercel and ensure your metrics are handled correctly.

## 1. Environment Variables
Before deploying, you **MUST** set the following environment variables in the Vercel Dashboard (**Project Settings > Environment Variables**):

- `SERP_API_KEY`: Your SerpAPI secret key.
- `DATABASE_URL`: The Prisma database connection string.
  - **Local/Testing**: `file:./dev.db` (This is the default for SQLite).
  - **Production/Historical**: A PostgreSQL URL (e.g., from Supabase or Heroku).

## 2. Database Persistence Warning (SQLite)
> [!CAUTION]
> **SQLite on Vercel is Temporary!**
> Vercel uses a read-only filesystem for serverless functions. While the dashboard will load your existing `dev.db` file (if you push it to GitHub), any **new data** scraped via the "Sync" button will be lost as soon as the serverless function restarts.

### For permanent data storage:
To keep your historical metrics forever, I strongly recommend switching to **PostgreSQL**.
1. Create a free database on [Supabase](https://supabase.com/) or [Railway](https://railway.app/).
2. Set your `DATABASE_URL` in Vercel to the PostgreSQL connection string.
3. Run `npx prisma db push` locally to sync the schema to your new cloud database.

## 3. Deployment Steps
1. **Push to GitHub**: 
   Ensure your code is pushed to a repository.
2. **Import to Vercel**: 
   Link your repository to your Vercel account.
3. **Automatic Build**: 
   The project is pre-configured with a `postinstall` script in `package.json` that runs `prisma generate`, so the build should succeed automatically.

## 4. Local Verification
Before every push, I recommend running:
```bash
npm run build
```
If this command finishes with `✓ Compiled successfully`, your code is ready for GitHub.
