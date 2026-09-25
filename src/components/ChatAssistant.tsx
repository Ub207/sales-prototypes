'use client';

import { useRef, useState } from 'react';
import type { BusinessConfig } from '@/lib/types';
import type { BookingContext } from '@/lib/whatsapp';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatAssistant({
  business,
  booking,
}: {
  business: BusinessConfig;
  /** Live state of the booking enquiry form, shared so the AI can reference it. */
  booking?: BookingContext;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: business.assistant.greeting },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          messages: next,
          booking: booking && Object.values(booking).some(Boolean) ? booking : undefined,
        }),
      });
      const data = await res.json();
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: data.reply || data.fallback || data.error || 'Something went wrong — please try again.',
        },
      ]);
    } catch {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: 'I couldn\'t reach the assistant just now. You can still send your enquiry to the team on WhatsApp.',
        },
      ]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      });
    }
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : `Chat with ${business.assistant.personaName}`}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:bg-brand-dark"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l2.4-5.7A8.38 8.38 0 0 1 4.5 11.5 8.5 8.5 0 0 1 13 3a8.38 8.38 0 0 1 8 8.5z" /></svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-h-[70vh] w-auto max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:inset-x-auto sm:right-5 sm:w-96 animate-fade-up">
          <div className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
              {business.assistant.personaName.slice(0, 1)}
            </div>
            <div>
              <p className="text-sm font-semibold">{business.assistant.personaName} · AI assistant</p>
              <p className="text-xs text-white/80">Answers from {business.name}&apos;s info</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3" style={{ minHeight: '16rem' }}>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'rounded-br-md bg-brand text-white'
                      : 'rounded-bl-md bg-white text-slate-800 shadow-sm ring-1 ring-slate-100'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-slate-400 shadow-sm ring-1 ring-slate-100">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-3 pt-3">
              {business.assistant.quickPrompts.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs text-brand-dark transition hover:bg-brand/10"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-slate-100 bg-white p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${business.name.toLowerCase()}…`}
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-40"
            >
              Send
            </button>
          </form>

          <a
            href={buildWhatsAppUrl(business.whatsapp.number, business.whatsapp.defaultMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs font-medium text-emerald-700 hover:bg-slate-100"
          >
            Prefer a human? Continue on WhatsApp →
          </a>
        </div>
      )}
    </>
  );
}
