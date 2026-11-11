import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../run-in-test-env.sh',
);

const resolveProbe = 'command -v node; node -v; command -v npm; npm -v';

function hostEnv(overrides: Record<string, string | undefined> = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.npm_config_prefix;
  delete env.NPM_CONFIG_PREFIX;
  delete env.RUN_TESTS_IN_CONTAINER;
  delete env.TDMUSIC_INSIDE_TEST_CONTAINER;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete env[key];
    } else {
      env[key] = value;
    }
  }
  return env;
}

function runLogin(command: string, overrides: Record<string, string | undefined> = {}) {
  return spawnSync(scriptPath, ['bash', '-lc', command], {
    encoding: 'utf8',
    env: hostEnv(overrides),
  });
}

function directLogin(command: string) {
  return spawnSync('bash', ['-lc', command], {
    encoding: 'utf8',
    env: hostEnv(),
  });
}

describe('run-in-test-env login shell', () => {
  it.each([
    { label: 'npm_config_prefix=/', overrides: { npm_config_prefix: '/' } },
    { label: 'NPM_CONFIG_PREFIX=/', overrides: { NPM_CONFIG_PREFIX: '/' } },
    {
      label: 'npm_config_prefix=/ and NPM_CONFIG_PREFIX=/',
      overrides: { npm_config_prefix: '/', NPM_CONFIG_PREFIX: '/' },
    },
  ])('resolves npm when $label', ({ overrides }) => {
    const result = runLogin('npm -v', overrides);
    const expected = directLogin('npm -v');

    expect(result.status).toBe(0);
    expect(expected.status).toBe(0);
    expect(result.stderr).not.toContain('not compatible');
    expect(result.stdout.trim()).toBe(expected.stdout.trim());
  });

  it('keeps the login shell node and npm resolution when the prefix is unset', () => {
    const via = runLogin(resolveProbe);
    const direct = directLogin(resolveProbe);

    expect(via.status).toBe(0);
    expect(direct.status).toBe(0);
    expect(via.stdout).toBe(direct.stdout);
  });

  it('returns the login command exit code', () => {
    expect(runLogin('exit 0').status).toBe(0);
    expect(runLogin('exit 3').status).toBe(3);
    expect(runLogin('exit 127').status).toBe(127);
    expect(runLogin('tdmusic-missing-bin').status).toBe(127);
    expect(runLogin('exit 5', { npm_config_prefix: '/', NPM_CONFIG_PREFIX: '/' }).status).toBe(5);
  });
});
