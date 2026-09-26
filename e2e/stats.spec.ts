import { test, expect } from '@playwright/test';

test('stats ranges and clear-all-cache clears listen history', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 800 });
  await page.goto('/');
  await page.getByTestId('nav-more-toggle').click();
  await expect(
    page.getByTestId('nav-more-menu').getByRole('menuitem', { name: 'Stats' }),
  ).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/stats-nav-more.webp' });

  await page.goto('/stats');
  await expect(page.getByRole('heading', { name: 'Stats' })).toBeVisible();

  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('play-history', 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains('plays')) {
          const store = d.createObjectStore('plays', { keyPath: 'id', autoIncrement: true });
          store.createIndex('startedAt', 'startedAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error('open failed'));
    });
    const now = Date.now();
    const min = 60_001;
    const day = 86_400_000;
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('plays', 'readwrite');
      const store = tx.objectStore('plays');
      store.clear();
      store.add({ trackId: 'track-smile', startedAt: now - day, endedAt: now - day + min });
      store.add({
        trackId: 'track-smile',
        startedAt: now - day + 10_000,
        endedAt: now - day + 10_000 + min,
      });
      store.add({ trackId: 'track-drink', startedAt: now - day, endedAt: now - day + min });
      store.add({
        trackId: 'track-OLD',
        startedAt: now - 10 * day,
        endedAt: now - 10 * day + min,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('tx failed'));
    });
  });

  await page.reload();
  await expect(page.getByTestId('stats-row-track-smile')).toBeVisible();
  await expect(page.getByTestId('stats-count-track-smile')).toHaveText('2');
  await expect(page.getByTestId('stats-row-track-drink')).toBeVisible();
  await expect(page.getByTestId('stats-row-track-OLD')).toHaveCount(0);

  await page.getByRole('button', { name: 'Last 30 days' }).click();
  await expect(page.getByTestId('stats-row-track-OLD')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/stats-page-30d.webp' });

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Clear all cache' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await page.goto('/stats');
  await expect(page.getByText('No listening stats yet.')).toBeVisible();
  await page.screenshot({ path: '/opt/cursor/artifacts/stats-after-clear-cache.webp' });
});
