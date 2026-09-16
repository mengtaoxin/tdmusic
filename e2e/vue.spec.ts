import { test, expect } from '@playwright/test'

test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('main').getByText('tdmusic', { exact: true })).toBeVisible()
})

test('reserves scrollbar gutter on the right by default', async ({ page }) => {
  await page.goto('/')
  const gutter = await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarGutter)
  expect(gutter).toContain('stable')
})

test('settings links to config guides', async ({ page }) => {
  await page.goto('/settings')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await page.getByRole('link', { name: 'Config Guides' }).click()
  await expect(page).toHaveURL(/\/config-guides/)
  await expect(page.getByRole('heading', { name: 'Config Guides' })).toBeVisible()
  await expect(page.getByText('/configs.json', { exact: false }).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: 'music-list' })).toBeVisible()
})

test('music list shows catalog tracks', async ({ page }) => {
  await page.goto('/music')
  await expect(page.getByRole('heading', { name: 'Music List' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toBeVisible()
})

test('playlist list navigates to playlist detail by name', async ({ page }) => {
  await page.goto('/playlists')
  await expect(page.getByRole('heading', { name: 'Playlist' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'My Playlist1' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toHaveCount(0)

  await page.getByRole('link', { name: 'My Playlist1' }).click()
  await expect(page).toHaveURL(/\/playlists\/My(%20|\+)Playlist1/)
  await expect(page.getByRole('heading', { name: 'My Playlist1' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toBeVisible()
})

test('artist list navigates to albums, album tracks, and all music', async ({ page }) => {
  await page.goto('/artists')
  await expect(page.getByRole('heading', { name: 'Artist List' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Doubao' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toHaveCount(0)

  await page.getByRole('link', { name: 'Doubao' }).click()
  await expect(page).toHaveURL(/\/artists\/Doubao\/albums/)
  await expect(page.getByRole('heading', { name: 'Doubao' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'All music by this artist' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Album 1' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toHaveCount(0)

  await page.getByRole('link', { name: 'Album 1' }).click()
  await expect(page).toHaveURL(/\/artists\/Doubao\/albums\/Album(%20|\+)1/)
  await expect(page.getByRole('heading', { name: 'Album 1' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toBeVisible()

  await page.goto('/artists/Doubao/albums')
  await page.getByRole('link', { name: 'All music by this artist' }).click()
  await expect(page).toHaveURL(/\/artists\/Doubao$/)
  await expect(page.getByRole('heading', { name: 'Doubao' })).toBeVisible()
  await expect(page.getByText('Smile in the Wind')).toBeVisible()
})