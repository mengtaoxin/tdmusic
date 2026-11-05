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

test('quick-play stays put when the track is missing', async ({ page }) => {
  await page.goto('/quick-play?type=track&id=missing-track');
  await expect(page).toHaveURL(/\/quick-play\?/);
  await expect(page.getByRole('heading', { name: 'Quick play' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Track not found.');
});
