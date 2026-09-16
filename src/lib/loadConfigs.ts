import type { ClientStorage } from './clientStorage'
import { resolveConfigUrl } from './configUrl'

export async function loadConfigsJson(
  fetchImpl: typeof fetch = fetch,
  storage: ClientStorage = localStorage,
): Promise<unknown> {
  const url = resolveConfigUrl(storage)
  const response = await fetchImpl(url)
  if (!response.ok) {
    throw new Error(`Failed to load configs: ${response.status}`)
  }
  return response.json()
}
