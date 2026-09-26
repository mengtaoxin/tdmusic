import { test, expect } from '@playwright/test';

const PLAYER_STATE = {
  v: 1,
  queue: ['smile-in-the-wind', 'drink-in-the-wind', 'life-in-the-wind'],
  originalQueue: ['smile-in-the-wind', 'drink-in-the-wind', 'life-in-the-wind'],
  currentId: 'smile-in-the-wind',
  currentIndex: 0,
  currentTime: 0,
  repeatMode: 'off',
  shuffle: false,
};

test('queue heading stays on one line on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.addInitScript((state) => {
    localStorage.setItem('tdmusic.player', JSON.stringify(state));
  }, PLAYER_STATE);

  await page.goto('/now-playing');
  await expect(page.getByTestId('clear-upcoming')).toBeVisible();

  const heading = page.getByRole('heading', { name: 'Now playing queue' });
  await expect(heading).toBeVisible();

  const lineCount = await heading.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    return range.getClientRects().length;
  });

  expect(lineCount).toBe(1);
});

test('queue list aligns the playing track at the top after returning to the page', async ({
  page,
}) => {
  const ids = Array.from(
    { length: 24 },
    (_, i) => ['smile-in-the-wind', 'drink-in-the-wind', 'life-in-the-wind'][i % 3]!,
  );
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(
    (state) => {
      localStorage.setItem('tdmusic.player', JSON.stringify(state));
    },
    { ...PLAYER_STATE, queue: ids, originalQueue: ids, currentId: ids[8], currentIndex: 8 },
  );

  await page.goto('/now-playing');
  await expect(page.getByTestId('now-playing-page')).toBeVisible();
  await expect
    .poll(async () => page.locator('.queue-list').evaluate((el) => (el as HTMLElement).scrollTop))
    .toBe(8 * 64);

  await page.locator('.queue-list').evaluate((el) => {
    (el as HTMLElement).scrollTop = 0;
  });
  await expect
    .poll(async () => page.locator('.queue-list').evaluate((el) => (el as HTMLElement).scrollTop))
    .toBe(0);

  await page.getByRole('link', { name: 'Music List' }).first().click();
  await expect(page).toHaveURL(/\/music/);
  await page.getByRole('link', { name: 'Now Playing' }).first().click();
  await expect(page).toHaveURL(/\/now-playing/);
  await expect(page.getByTestId('now-playing-page')).toBeVisible();

  await expect
    .poll(async () => page.locator('.queue-list').evaluate((el) => (el as HTMLElement).scrollTop))
    .toBe(8 * 64);
});
