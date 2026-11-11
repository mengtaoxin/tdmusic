import { test as base, type BrowserContext } from '@playwright/test';

/**
 * WebKit ephemeral contexts do not expose OPFS (`navigator.storage.getDirectory`),
 * which SQLite needs. Use a persistent context only for WebKit; keep the shared
 * browser + fresh context path for Chromium / Firefox.
 */
export const test = base.extend<{ context: BrowserContext }>({
  context: async (
    { playwright, browserName, browser, headless, launchOptions, contextOptions },
    run,
    testInfo,
  ) => {
    if (browserName === 'webkit') {
      const context = await playwright.webkit.launchPersistentContext(
        testInfo.outputPath('webkit-user-data'),
        {
          ...launchOptions,
          ...contextOptions,
          headless,
        },
      );
      await run(context);
      await context.close();
      return;
    }

    const context = await browser.newContext(contextOptions);
    await run(context);
    await context.close();
  },
});

export const expect = test.expect;
