import type { AssistantSource } from '@/lib/assistant/types'

export function isWebSearchEnabled() {
  return process.env.ASSISTANT_WEB_SEARCH_ENABLED === 'true'
}

export async function searchWeb(query: string): Promise<AssistantSource[]> {
  if (!isWebSearchEnabled()) {
    return []
  }

  // Provider hook: keep this explicit until a real search provider is configured.
  return [
    {
      title: 'Internetové vyhľadávanie je pripravené na napojenie',
      snippet: `Vyhľadávací provider ešte nie je nakonfigurovaný pre dotaz: ${query}`,
    },
  ]
}
