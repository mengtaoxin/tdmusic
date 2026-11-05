import { expect, test, type Page } from '@playwright/test';

function expectAudioPlaying(page: Page) {
  return expect
    .poll(() => page.getByTestId('global-audio').evaluate((el: HTMLAudioElement) => el.paused))
    .toBe(false);
}

test('quick-play starts a track and opens now playing', async ({ page }) => {
  await page.goto('/quick-play?type=song&id=smile-in-the-wind');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Smile in the Wind' })).toBeVisible();
});

test('opening a quick-play link starts playback', async ({ page, baseURL }) => {
  await page.setContent(
    `<a href="${baseURL}/quick-play?type=song&id=smile-in-the-wind">Open quick</a>`,
  );
  await page.getByRole('link', { name: 'Open quick' }).click();
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Smile in the Wind' })).toBeVisible();
  await expectAudioPlaying(page);
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

test('quick-play starts every track from all-tricks', async ({ page }) => {
  await page.goto('/quick-play?type=playlist&id=all-tricks');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('heading', { name: 'Smile in the Wind' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Drink in the Wind/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Life in the Wind/ })).toBeVisible();
});

test('refresh keeps the track you reached instead of replaying the link', async ({ page }) => {
  await page.goto('/quick-play?type=playlist&id=my-playlist-1');
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page.getByRole('button', { name: /Drink in the Wind/ })).toBeVisible();
  await page.getByTestId('footer-next').click();
  await expect(page.getByRole('heading', { name: 'Drink in the Wind' })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/now-playing$/);
  await expect(page).not.toHaveURL(/type=/);
  await expect(page.getByRole('heading', { name: 'Drink in the Wind' })).toBeVisible();
});

test('quick-play stays put when the track is missing', async ({ page }) => {
  await page.goto('/quick-play?type=song&id=missing-track');
  await expect(page).toHaveURL(/\/quick-play\?/);
  await expect(page.getByRole('heading', { name: 'Quick play' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Track not found.');
});
