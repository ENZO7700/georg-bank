'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, Sparkles, X } from 'lucide-react'
import type { AssistantChatMessage, AssistantConfigStatus } from '@/lib/assistant/types'

interface AssistantConversation {
  id: string
  title: string
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [booting, setBooting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<AssistantConversation | null>(null)
  const [messages, setMessages] = useState<AssistantChatMessage[]>([])
  const [config, setConfig] = useState<AssistantConfigStatus | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    setBooting(true)
    fetch('/api/assistant/chat')
      .then(async (response) => {
        if (!response.ok) throw new Error('Asistenta sa nepodarilo načítať.')
        return response.json()
      })
      .then((data) => {
        setConversation(data.conversation ?? null)
        setMessages(data.messages ?? [])
        setConfig(data.config ?? null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Asistent sa nenačítal.'))
      .finally(() => setBooting(false))
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setError(null)
    setLoading(true)

    const optimisticMessage: AssistantChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: text,
      sources: [],
      createdAt: new Date().toISOString(),
    }
    setMessages((current) => [...current, optimisticMessage])

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversation?.id,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Asistent teraz nevie odpovedať.')
      }

      setConversation(data.conversation ?? conversation)
      setConfig(data.config ?? config)
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimisticMessage.id),
        ...(data.messages ?? []),
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Správu sa nepodarilo odoslať.')
      setMessages((current) => current.filter((message) => message.id !== optimisticMessage.id))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-end mt-4">
      {open && (
        <div className="mb-3 flex h-[min(560px,calc(100dvh-120px))] w-full flex-col overflow-hidden rounded-[20px] border border-[#2b3347] bg-[#111620]/95 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-[#242b3a] bg-[#171c28] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1d63ed]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black">George asistent</p>
                <p className="text-[11px] font-semibold text-[#8e9bb5]">
                  {config?.mistralConfigured ? config.model : 'Demo režim'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#22c55e]/30 bg-[#22c55e]/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[#22c55e]">
                Pripravený
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-[#8e9bb5] transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Zavrieť asistenta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {booting ? (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-[#8e9bb5]">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Načítavam asistenta...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#2b3347] bg-[#171c28]">
                  <Sparkles className="h-5 w-5 text-[#1d63ed]" />
                </div>
                <p className="mt-3 text-sm font-black">Ako môžem pomôcť?</p>
                <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-[#8e9bb5]">
                  Viem čítať tvoje demo účty a posledné transakcie. Platby za teba nepotvrdzujem.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-[16px] px-3 py-2 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-[#1d63ed] text-white'
                          : 'border border-[#2b3347] bg-[#171c28] text-[#eef3ff]'
                      }`}
                    >
                      <p>{message.content}</p>
                      {message.sources.length > 0 && (
                        <div className="mt-2 border-t border-white/10 pt-2">
                          <p className="text-[10px] font-black uppercase tracking-wide text-[#8e9bb5]">Zdroje</p>
                          {message.sources.map((source) => (
                            <p key={`${message.id}-${source.title}`} className="mt-1 text-[11px] text-[#c5cde0]">
                              {source.title}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="rounded-[16px] border border-[#2b3347] bg-[#171c28] px-3 py-2 text-sm text-[#8e9bb5]">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Premýšľam...
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </div>

          {error && (
            <p className="border-t border-red-500/20 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-300">
              {error}
            </p>
          )}

          <form
            className="flex gap-2 border-t border-[#242b3a] bg-[#171c28] p-3"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 1200))}
              placeholder="Opýtaj sa na účet, platby alebo históriu..."
              className="h-11 min-w-0 flex-1 rounded-[14px] border border-[#2b3347] bg-[#0f121a] px-3 text-sm font-semibold text-white outline-none transition-colors placeholder:text-[#5f6a80] focus:border-[#1d63ed]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1d63ed] text-white transition-colors hover:bg-[#154fc2] disabled:bg-[#263042] disabled:text-[#6f7a90]"
              aria-label="Odoslať správu"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 items-center gap-3 rounded-full border border-[#2b3347] bg-[#151922] px-4 text-sm font-black text-white shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-transform hover:border-[#1d63ed] active:scale-[0.98]"
        aria-expanded={open}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1d63ed]">
          <Bot className="h-4 w-4" />
        </span>
        Asistent
      </button>
    </div>
  )
}
