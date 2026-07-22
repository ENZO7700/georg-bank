export type AssistantRole = 'user' | 'assistant' | 'system' | 'tool'

export interface AssistantSource {
  title: string
  url?: string
  snippet?: string
}

export interface AssistantChatMessage {
  id: string
  role: AssistantRole
  content: string
  sources: AssistantSource[]
  createdAt: string
}

export interface AssistantContext {
  user: {
    id: string
    name: string | null
    email: string
  }
  accounts: Array<{
    id: string
    accountNumber: string
    accountType: string
    balance: string
    currency: string
  }>
  recentTransactions: Array<{
    id: string
    amount: string
    type: string
    description: string | null
    balanceBefore: string | null
    balanceAfter: string | null
    createdAt: string
  }>
}

export interface AssistantProviderResult {
  content: string
  sources: AssistantSource[]
  provider: 'mistral' | 'demo'
  model: string
}

export interface AssistantConfigStatus {
  mistralConfigured: boolean
  model: string
  webSearchEnabled: boolean
}
