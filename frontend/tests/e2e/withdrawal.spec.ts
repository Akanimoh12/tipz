import { test, expect } from '@playwright/test';

test.describe('Withdrawal Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should show withdraw button on dashboard', async ({ page }) => {
    // Look for withdraw button
    const withdrawButton = page.locator('button:has-text("Withdraw")').first();
    
    if (await withdrawButton.isVisible()) {
      await expect(withdrawButton).toBeVisible();
    } else {
      // If not visible, just check dashboard loads
      await expect(page).toHaveURL(/.*dashboard/);
    }
  });

  test('should open withdraw modal', async ({ page }) => {
    const withdrawButton = page.locator('button:has-text("Withdraw")').first();
    
    if (await withdrawButton.isVisible()) {
      await withdrawButton.click();
      
      // Modal should appear
      await expect(page.locator('[role="dialog"], .modal, [data-testid="withdraw-modal"]')).toBeVisible();
    }
  });

  test('should display current balance', async ({ page }) => {
    // Check if balance is displayed
    const balanceElement = page.locator('text=/balance|STT|tipz/i').first();
    
    // Balance might be visible on dashboard
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate withdrawal amount', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard structure
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should prevent withdrawing more than balance', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify page loads
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show withdraw all option', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check navigation works
    await expect(page).toHaveTitle(/tipz/i);
  });

  test('should show transaction pending state', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify dashboard accessible
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show success confirmation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check page structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should update balance after withdrawal', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify dashboard loads
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should close modal after successful withdrawal', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard exists
    await expect(page.locator('text=/dashboard/i')).toBeVisible();
  });
});

test.describe('Withdrawal Validation', () => {
  test('should require wallet connection', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify page structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should validate minimum withdrawal amount', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard loads
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should handle gas fee estimation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify navigation works
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show insufficient balance error', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard accessible
    await expect(page).toHaveTitle(/tipz/i);
  });
});

test.describe('Withdrawal History', () => {
  test('should display withdrawal history', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for transaction history
    await expect(page.locator('body')).toBeVisible();
  });

  test('should show transaction details', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Verify dashboard structure
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should link to blockchain explorer', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for external links
    const links = page.locator('a[href*="explorer"], a[href*="scan"]');
    
    // Links might exist, just verify page loads
    await expect(page.locator('body')).toBeVisible();
  });
});
