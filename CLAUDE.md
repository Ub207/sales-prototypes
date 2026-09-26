# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

A config-driven, single-page AI sales prototype for local businesses (demo: "Ocean Massage & Spa"). The same app renders any business by swapping its JSON config — components are fully generic. Core loop: a Gemini-powered chat assistant + a booking-**enquiry** form that hands off to WhatsApp. No database, no auth, no real bookings — a human confirms on WhatsApp.

## Commands

```bash
npm run dev            # dev server (Turbopack) at http://localhost:3000
npm run build          # production build
npm run lint           # eslint (flat config, eslint-config-next)
npx tsc --noEmit       # type-check (no test framework exists)
```

Requires `.env.local` with `GROQ_API_KEY` (preferred) and/or `GEMINI_API_KEY` (see `.env.example`); optional `GROQ_MODEL` / `GEMINI_MODEL` overrides. The `gemini-1.5`/`2.0`/`2.5` ids now return 404 "no longer available to new users", and the Gemini free tier allows only 20 generate-content requests/day/model — which is why Groq leads the ladder. The `gemini-flash-latest` alias 503s frequently, so it is only the last fallback.

## Architecture

The whole app is one server component tree that reads a JSON config; the only client code is the `Experience` island.

**Config pipeline (server-only):**
- `config/registry.json` maps business ids → JSON files under `config/businesses/`; `defaultBusiness` selects which one renders.
- `src/lib/config.ts` — reads registry + business JSON from disk with `fs`, cached in module state. Types in `src/lib/types.ts` (`BusinessConfig`).
- Theme colors flow from config into CSS variables (`--brand`, `--brand-dark`, `--brand-accent`) set in `src/app/layout.tsx`; `globals.css` maps them into Tailwind v4 `@theme` so `bg-brand` etc. work.

**Chat pipeline:**
- `src/app/api/chat/route.ts` — single POST endpoint. Validates/trims history to last 12 turns, last message must be `user`.
- `src/lib/prompt.ts` — `buildSystemPrompt()` injects services/FAQs/hours/guardrails from config into the system prompt. The assistant must never state prices, availability, staff names, or confirmations — they're intentionally absent from the config and forbidden by guardrails.
- `src/lib/llm.ts` — provider-agnostic completion with a fallback ladder: Groq (`openai/gpt-oss-120b` → `qwen/qwen3.8-27b`, via plain `fetch` on the OpenAI-compatible endpoint) first, then Gemini (`gemini-3.8-flash` → `gemini-3-flash-preview` → `gemini-flash-latest`) when `GROQ_API_KEY` is absent. Bounded by a wall-clock deadline under the route's `maxDuration`. Failures are classified as `transient` (retry same model) or `auth`/`quota`/`model-gone` (skip to the next candidate — these are per-provider, so one rate-limited model must not kill the request). Length truncation is detected per provider (`finish_reason === 'length'` on Groq, `finishReason === 'MAX_TOKENS'` on Gemini) and retried at a higher ceiling rather than returned as a complete answer. `thinkingBudget: 0` is deliberate on Gemini: reasoning tokens used to consume half the output budget and truncate replies.
- The current booking form state is injected into chat as a `[form-update]` pseudo-message so the assistant can acknowledge it before WhatsApp handoff.

**Client island:**
- `src/components/Experience.tsx` holds `BookingContext` state shared between `BookingForm.tsx` and `ChatAssistant.tsx`. If a change needs form⇄chat sync, it goes through this state, not new props between siblings.
- `src/lib/whatsapp.ts` is deliberately client-safe (no `fs`/SDK imports) — builds `wa.me` links and the enquiry draft text. `prompt.ts` re-exports `BookingContext` from here.

## Adding a new business demo

1. Write `config/businesses/<id>.json` conforming to `BusinessConfig` (name, services without prices, FAQs, hours, WhatsApp number, theme colors, persona, `guardrails` array).
2. Register it in `config/registry.json` and set it as `defaultBusiness`.
3. No component changes should be needed — if one is, that's a bug in genericity.

## Conventions

- `@/*` path alias maps to `src/*`.
- Server components (`page.tsx`, `layout.tsx`) read config directly via `src/lib/config.ts`; only `Experience` and its children are `'use client'`.
- All user-visible copy, contact info, and colors come from config JSON — never hardcode business-specific strings in components.
