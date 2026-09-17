import { test, expect } from '@playwright/test'

const PLAYER_STATE = {
  v: 1,
  queue: ['smile-in-the-wind', 'drink-in-the-wind', 'life-in-the-wind'],
  originalQueue: ['smile-in-the-wind', 'drink-in-the-wind', 'life-in-the-wind'],
  currentId: 'smile-in-the-wind',
  currentIndex: 0,
  currentTime: 0,
  repeatMode: 'off',
  shuffle: false,
}

test('queue heading stays on one line on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.addInitScript((state) => {
    localStorage.setItem('tdmusic.player', JSON.stringify(state))
  }, PLAYER_STATE)

  await page.goto('/now-playing')
  await expect(page.getByTestId('clear-upcoming')).toBeVisible()

  const heading = page.getByRole('heading', { name: 'Now playing queue' })
  await expect(heading).toBeVisible()

  const lineCount = await heading.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return range.getClientRects().length
  })

  expect(lineCount).toBe(1)
})
