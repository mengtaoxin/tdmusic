import { test, expect } from './fixtures';

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

const LONG_SONG_TITLE =
  'An Extremely Long Song Title That Must Not Wrap Onto A Second Line And Push The Player Controls Down On A Narrow Screen';

test('song title stays on one line when the title is long on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.route('**/sample/configs.json', async (route) => {
    const response = await route.fetch();
    const json = (await response.json()) as {
      songs: { id: string; title?: string }[];
    };
    const song = json.songs.find((item) => item.id === 'smile-in-the-wind');
    if (song) song.title = LONG_SONG_TITLE;
    await route.fulfill({ json });
  });
  await page.addInitScript((state) => {
    localStorage.setItem('tdmusic.player', JSON.stringify(state));
  }, PLAYER_STATE);

  await page.goto('/now-playing');

  const title = page.getByRole('heading', { level: 5, name: LONG_SONG_TITLE });
  await expect(title).toBeVisible();

  const titleLayout = await title.evaluate((el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const tops = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
    return {
      lineCount: tops.size,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    };
  });
  expect(titleLayout.lineCount).toBe(1);
  expect(titleLayout.scrollWidth).toBeGreaterThan(titleLayout.clientWidth);
  expect(titleLayout.scrollHeight).toBeLessThanOrEqual(titleLayout.clientHeight + 1);

  const layout = await page.evaluate(() => {
    const titleEl = document.querySelector('h5');
    const pageEl = document.querySelector('[data-testid="now-playing-page"]');
    const scroller = document.querySelector('[data-testid="main-scroller"]');
    const controls = ['Repeat', 'Previous', 'Play', 'Pause', 'Next', 'Shuffle']
      .map((name) => document.querySelector(`[aria-label="${name}"]`))
      .filter((el): el is HTMLElement => el instanceof HTMLElement);
    const titleBox = titleEl?.getBoundingClientRect();
    const pageBox = pageEl?.getBoundingClientRect();
    return {
      title: titleBox
        ? { left: titleBox.left, right: titleBox.right, top: titleBox.top, bottom: titleBox.bottom }
        : null,
      page: pageBox ? { left: pageBox.left, right: pageBox.right } : null,
      controls: controls.map((el) => {
        const box = el.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, left: box.left, right: box.right };
      }),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      scrollWidth: scroller instanceof HTMLElement ? scroller.scrollWidth : null,
      clientWidth: scroller instanceof HTMLElement ? scroller.clientWidth : null,
    };
  });

  expect(layout.title).not.toBeNull();
  expect(layout.page).not.toBeNull();
  expect(layout.controls.length).toBeGreaterThanOrEqual(5);
  expect(layout.title!.left).toBeGreaterThanOrEqual(layout.page!.left - 1);
  expect(layout.title!.right).toBeLessThanOrEqual(layout.page!.right + 1);
  expect(layout.scrollWidth).toBeLessThanOrEqual((layout.clientWidth ?? 0) + 1);

  const firstControl = layout.controls[0]!;
  for (const box of layout.controls) {
    const sharesRow = box.bottom > firstControl.top && box.top < firstControl.bottom;
    expect(sharesRow).toBe(true);
    expect(box.left).toBeGreaterThanOrEqual(0);
    expect(box.right).toBeLessThanOrEqual(layout.viewportWidth + 1);
    expect(box.top).toBeGreaterThanOrEqual(layout.title!.bottom);
    expect(box.bottom).toBeLessThanOrEqual(layout.viewportHeight);
  }
});

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

test('queue rows do not overlap their neighbours', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript((state) => {
    localStorage.setItem('tdmusic.player', JSON.stringify(state));
  }, PLAYER_STATE);

  await page.goto('/now-playing');
  const rows = page.locator('.queue-list .track-row');
  await expect(rows).toHaveCount(3);

  const boxes = await rows.evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom };
    }),
  );
  for (let i = 1; i < boxes.length; i++) {
    expect(boxes[i]!.top).toBeGreaterThanOrEqual(boxes[i - 1]!.bottom);
  }
});

test('queue list aligns the playing track at the top on entry', async ({ page }) => {
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
});
