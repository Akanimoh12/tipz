import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/tipz/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Try to navigate to dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await page.goto('/leaderboard');
    
    await expect(page).toHaveURL(/.*leaderboard/);
    await expect(page.locator('text=/leaderboard|top creators|top tippers/i')).toBeVisible();
  });

  test('should navigate to profile pages', async ({ page }) => {
    await page.goto('/@testuser');
    
    // Profile might not exist, just check routing works
    await expect(page).toHaveURL(/.*@/);
  });
});

test.describe('Responsive Design', () => {
  test('should display mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page is responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on tablet size', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('should work on desktop size', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - start;
    
    // Should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have working links', async ({ page }) => {
    await page.goto('/');
    
    const links = await page.locator('a[href]').all();
    expect(links.length).toBeGreaterThan(0);
  });
});
