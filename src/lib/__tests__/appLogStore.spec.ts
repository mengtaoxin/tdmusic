import { beforeEach, describe, expect, it } from 'vitest'

import {
  appendAppLog,
  clearAppLogs,
  listAppLogs,
  MAX_APP_LOGS,
  resetAppLogDbForTests,
} from '../appLogStore'

describe('appLogStore', () => {
  beforeEach(async () => {
    await resetAppLogDbForTests()
  })

  it('appends and lists log entries newest first', async () => {
    await appendAppLog('first failure')
    await appendAppLog('second failure')

    const logs = await listAppLogs()
    expect(logs).toHaveLength(2)
    expect(logs[0]!.message).toBe('second failure')
    expect(logs[1]!.message).toBe('first failure')
    expect(logs[0]!.at).toBeGreaterThanOrEqual(logs[1]!.at)
    expect(typeof logs[0]!.id).toBe('number')
  })

  it(`keeps at most ${MAX_APP_LOGS} entries, dropping the oldest`, async () => {
    for (let i = 0; i < MAX_APP_LOGS + 5; i++) {
      await appendAppLog(`log-${i}`)
    }

    const logs = await listAppLogs()
    expect(logs).toHaveLength(MAX_APP_LOGS)
    expect(logs[0]!.message).toBe(`log-${MAX_APP_LOGS + 4}`)
    expect(logs[logs.length - 1]!.message).toBe('log-5')
  })

  it('clears all logs', async () => {
    await appendAppLog('keep me')
    await clearAppLogs()
    expect(await listAppLogs()).toEqual([])
  })
})
