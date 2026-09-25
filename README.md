# Ocean Massage & Spa — AI Sales Prototype

A reusable, config-driven single-page business site with a Gemini-powered AI
assistant and a booking-**enquiry** → WhatsApp handoff flow. Built with Next.js
(App Router), TypeScript and Tailwind CSS v4.

The same app renders any business by swapping its JSON config — no component
changes needed. Ocean Massage & Spa is the live demo; `config/businesses/brightsmile-dental.json`
shows reusability for a dental clinic (and by extension salons, restaurants, academies…).

## Run

```bash
npm install
cp .env.example .env.local   # add your Gemini API key from https://aistudio.google.com/apikey
npm run dev                  # http://localhost:3000
```

## Switch the demo business

Edit `config/registry.json` → set `defaultBusiness` to `"brightsmile-dental"`
(or add your own JSON under `config/businesses/` and register it there).

## How it's wired

| Piece | File |
|---|---|
| Business registry (which JSON = which id) | `config/registry.json` |
| Business config (name, services, FAQs, hours, WhatsApp number, theme, guardrails) | `config/businesses/*.json` |
| Typed config schema | `src/lib/types.ts` |
| Config loader (server-side) | `src/lib/config.ts` |
| System prompt builder (injects services/FAQs/hours/guardrails) | `src/lib/prompt.ts` |
| Gemini call (`@google/genai`, model via `GEMINI_MODEL`) | `src/lib/gemini.ts` |
| Chat API route | `src/app/api/chat/route.ts` |
| WhatsApp link + enquiry draft (client-safe) | `src/lib/whatsapp.ts` |
| Landing page (hero, services, hours, FAQ, booking) | `src/app/page.tsx` |
| Floating AI assistant | `src/components/ChatAssistant.tsx` |
| Booking enquiry form → WhatsApp handoff | `src/components/BookingForm.tsx` |
| Form ⇄ chat shared state island | `src/components/Experience.tsx` |

## Deliberate constraints

- The assistant never states prices, availability, therapist/staff names or confirmations —
  these are not in the config, and prompt guardrails forbid inventing them.
- Everything is a **booking enquiry** ("preferred date/time"); a human confirms on WhatsApp.
- WhatsApp number, brand colors and copy all come from the JSON config — components are generic.
- No database, auth, RAG, or vector stores: a prototype is config + prompt + one API route.
