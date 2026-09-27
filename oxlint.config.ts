import { defineConfig } from 'oxlint';
import react from '@mengtaoxin/oxc-config/react';

export default defineConfig({
  extends: [react],
  // Empty array = do not re-add default plugins on top of the preset.
  plugins: [],
  ignorePatterns: ['dist-ssr', 'src/routeTree.gen.ts', 'playwright-report', 'test-results'],
  overrides: [
    {
      // Test helpers are never hot-reloaded, so Fast Refresh export rules do not apply.
      files: ['**/__tests__/**'],
      rules: {
        'react/only-export-components': 'off',
      },
    },
  ],
});
