import { test, expect } from './fixtures';

test('stats ranges and clear-all-cache clears listen history', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/');
  await page.getByTestId('nav-more-toggle').click();
  await expect(
    page.getByTestId('nav-more-menu').getByRole('menuitem', { name: 'Stats' }),
  ).toBeVisible();

  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();

  await expect.poll(() => page.evaluate(() => Boolean(window.tdmusicTestApi))).toBe(true);

  await page.evaluate(async () => {
    const api = window.tdmusicTestApi!;
    await api.waitForDb();
    const now = Date.now();
    const min = 60_001;
    const day = 86_400_000;
    await api.seedPlayHistory([
      { trackId: 'track-smile', startedAt: now - day, endedAt: now - day + min },
      {
        trackId: 'track-smile',
        startedAt: now - day + 10_000,
        endedAt: now - day + 10_000 + min,
      },
      { trackId: 'track-drink', startedAt: now - day, endedAt: now - day + min },
      {
        trackId: 'track-OLD',
        startedAt: now - 10 * day,
        endedAt: now - 10 * day + min,
      },
    ]);
  });

  await page.reload();
  await expect(page.getByTestId('stats-row-track-smile')).toBeVisible();
  await expect(page.getByTestId('stats-count-track-smile')).toHaveText('2');
  await expect(page.getByTestId('stats-row-track-drink')).toBeVisible();
  await expect(page.getByTestId('stats-row-track-OLD')).toHaveCount(0);

  await page.getByRole('button', { name: 'Last 30 days' }).click();
  await expect(page.getByTestId('stats-row-track-OLD')).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Clear all cache' }).click();
  await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('All music cache cleared.')).toBeVisible();
  await page.goto('/stats');
  await expect(page.getByText('No listening stats yet.')).toBeVisible();
});
