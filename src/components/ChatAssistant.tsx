'use client';

import { useRef, useState } from 'react';
import type { BusinessConfig } from '@/lib/types';
import type { BookingContext } from '@/lib/whatsapp';
import { buildWhatsAppUrl, hasWhatsAppNumber } from '@/lib/whatsapp';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Extracts selectable options if the assistant reply presents a bulleted/numbered list
 * (e.g. - Residential \n - Commercial, or 1. Plot \n 2. Villa).
 */
function extractOptions(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n');
  const results: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const match =
      trimmed.match(/^[-*•]\s+([A-Za-z0-9\s/&,–—'-]+)$/) ||
      trimmed.match(/^\d+[.)]\s+([A-Za-z0-9\s/&,–—'-]+)$/);
    if (match) {
      const opt = match[1].trim();
      // Keep only clean short options, avoiding long narrative sentences
      if (opt.length > 0 && opt.length <= 40 && !results.includes(opt)) {
        results.push(opt);
      }
    }
  }
  return results.length >= 2 && results.length <= 8 ? results : [];
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

  const lastMsg = messages[messages.length - 1];
  const detectedOptions =
    !busy && lastMsg && lastMsg.role === 'assistant'
      ? extractOptions(lastMsg.content)
      : [];

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : `Chat with ${business.assistant.personaName}`}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl transition-all duration-200 hover:scale-105 hover:bg-brand-dark cursor-pointer"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 0 0 1-3.8-.9L3 21l2.4-5.7A8.38 8.38 0 0 1 4.5 11.5 8.5 8.5 0 0 1 13 3a8.38 8.38 0 0 1 8 8.5z" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-h-[75vh] w-auto max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 sm:inset-x-auto sm:right-5 sm:w-96 animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between bg-brand px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                {business.assistant.personaName.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold">{business.assistant.personaName}</p>
                <p className="text-xs text-white/80">AI Real Estate Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white transition p-1 cursor-pointer"
              aria-label="Close assistant"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conversation history */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3.5" style={{ minHeight: '16rem' }}>
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
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Option Pills / Starter Prompts */}
          {messages.length <= 1 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2.5">
              {business.assistant.quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark transition hover:bg-brand/15 hover:border-brand cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : detectedOptions.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-3 py-2.5">
              {detectedOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => send(opt)}
                  className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-medium text-brand-dark transition hover:bg-brand hover:text-white cursor-pointer"
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : null}

          {/* Message input */}
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
              placeholder="Type your message…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-1 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-40 cursor-pointer"
            >
              Send
            </button>
          </form>

          {/* WhatsApp Handoff Bar */}
          {hasWhatsAppNumber(business) ? (
            <a
              href={buildWhatsAppUrl(business.whatsapp.number, business.whatsapp.defaultMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
            >
              Prefer a human? Continue on WhatsApp →
            </a>
          ) : (
            <p className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
              WhatsApp number configurable for live handoff
            </p>
          )}
        </div>
      )}
    </>
  );
}
