import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()

const USER_SCRIPTS = [
  'test.sh',
  'format.sh',
  'dev-start.sh',
  'dev-stop.sh',
  'build.sh',
  'install-dependency.sh',
] as const

function runScript(script: string, args: string[]) {
  return spawnSync('bash', [resolve(ROOT, 'scripts', script), ...args], {
    encoding: 'utf8',
    cwd: ROOT,
    env: { ...process.env },
  })
}

describe('scripts CLI', () => {
  it.each(USER_SCRIPTS)('%s --help exits 0 and prints Usage', (script) => {
    const result = runScript(script, ['--help'])
    expect(result.status).toBe(0)
    expect(`${result.stdout}${result.stderr}`).toMatch(/Usage:/)
  })

  it.each(USER_SCRIPTS)('%s rejects positional arguments', (script) => {
    const result = runScript(script, ['positional'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/positional|named flags/i)
  })

  it.each(USER_SCRIPTS)('%s rejects unknown flags', (script) => {
    const result = runScript(script, ['--nope'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/unknown argument/i)
  })
})

describe('format.sh flag contracts', () => {
  it('--help mentions type-check', () => {
    const result = runScript('format.sh', ['--help'])
    expect(result.status).toBe(0)
    expect(`${result.stdout}${result.stderr}`).toMatch(/type-check/i)
  })
})

describe('test.sh flag contracts', () => {
  it('rejects an unknown --layer value without running tests', () => {
    const result = runScript('test.sh', ['--layer', 'nope'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/unknown layer/i)
    expect(result.stdout).not.toMatch(/^test: /m)
  })

  it('rejects --layer all combined with --file', () => {
    const result = runScript('test.sh', ['--layer', 'all', '--file', 'src/__tests__/App.spec.ts'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/--layer all[\s\S]*--file|--file[\s\S]*--layer all/i)
  })

  it('rejects a unit --file with --layer e2e', () => {
    const result = runScript('test.sh', ['--file', 'src/__tests__/App.spec.ts', '--layer', 'e2e'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/layer/i)
  })

  it('rejects ./e2e --file with --layer unit', () => {
    const result = runScript('test.sh', ['--file', './e2e/vue.spec.ts', '--layer', 'unit'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/layer/i)
  })

  it('rejects --platform when --layer is unit', () => {
    const result = runScript('test.sh', ['--layer', 'unit', '--platform', 'firefox'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/--platform/i)
    expect(result.stdout).not.toMatch(/^test: /m)
  })

  it('rejects an unknown --platform before starting runners', () => {
    const result = runScript('test.sh', ['--platform', 'edge'])
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/unknown e2e platform/i)
    expect(result.stdout).not.toMatch(/^test: /m)
  })
})
