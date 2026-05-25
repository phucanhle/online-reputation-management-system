import { test, expect } from '@playwright/test';

test.describe('ORMS Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local server landing page
    await page.goto('/');
  });

  test('should load the reputation analytics dashboard successfully', async ({ page }) => {
    // Assert page has title or heading matching reputation system
    const title = page.locator('header h2');
    await expect(title).toBeVisible();

    // Verify main navigation bar has Overview menu
    const navOverview = page.locator('nav >> text=Overview');
    await expect(navOverview).toBeVisible();
  });

  test('should allow switching between global and branch views', async ({ page }) => {
    // Check that we default to global view KPI cards
    const networkSentiment = page.locator('text=Network Sentiment');
    await expect(networkSentiment).toBeVisible();

    // Click on the first branch in the sidebar
    const firstBranchButton = page.locator('aside button').nth(1); // First cinema branch
    await firstBranchButton.click();

    // Verify view has changed to branch view (Average Rating KPI card and review feed visible)
    const avgRatingKpi = page.locator('text=Avg Rating');
    await expect(avgRatingKpi).toBeVisible();

    const reviewFeedHeading = page.locator('text=Review Feed');
    await expect(reviewFeedHeading).toBeVisible();
  });

  test('should filter review results based on keyword search', async ({ page }) => {
    // Click on the first branch in the sidebar to enter branch view
    const firstBranchButton = page.locator('aside button').nth(1);
    await firstBranchButton.click();

    // Find and type search query into the reviews filter input
    const searchInput = page.locator('placeholder=Search reviews...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('tệ'); // Search for a negative word in Vietnamese reviews
    await page.keyboard.press('Enter');

    // Confirm that the filter results label displays count or filter updates
    const resultsCount = page.locator('text=results');
    await expect(resultsCount).toBeVisible();
  });
});
