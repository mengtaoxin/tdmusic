import { expect, test } from '@playwright/test';

test('quick-play starts a track and opens now playing', async ({ page }) => {
  await page.goto('/quick-play?type=trick&id=smile-in-the-wind');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Smile in the Wind' })).toBeVisible();
});

test('quick-play starts a playlist from its first track', async ({ page }) => {
  await page.goto('/quick-play?type=playlist&id=my-playlist-1');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Smile in the Wind' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Drink in the Wind/ })).toBeVisible();
});

test('quick-play continues the current queue from its saved track', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'tdmusic.player',
      JSON.stringify({
        v: 1,
        queue: ['smile-in-the-wind', 'drink-in-the-wind'],
        originalQueue: ['smile-in-the-wind', 'drink-in-the-wind'],
        currentId: 'drink-in-the-wind',
        currentIndex: 1,
        currentTime: 42,
        repeatMode: 'off',
        shuffle: false,
      }),
    );
  });

  await page.goto('/quick-play?type=playlist&id=now-playing');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Drink in the Wind' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Smile in the Wind/ })).toBeVisible();
});

test('quick-play stays put when the track is missing', async ({ page }) => {
  await page.goto('/quick-play?type=track&id=missing-track');
  await expect(page).toHaveURL(/\/quick-play\?/);
  await expect(page.getByRole('heading', { name: 'Quick play' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Track not found.');
});
