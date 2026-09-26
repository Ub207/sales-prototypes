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
cp .env.example .env.local   # add a GROQ_API_KEY (https://console.groq.com/keys); GEMINI_API_KEY also works as a fallback
npm run dev                  # http://localhost:3000
```

## Switch the demo business

Edit `config/registry.json` → set `defaultBusiness` to any registered id:
`"hk-associates"` (default), `"ocean-massage-spa"` or `"brightsmile-dental"`.
Restart the dev server afterwards — the registry is cached in module state.

To add a business, drop a new JSON under `config/businesses/` and register it in
`config/registry.json`. No code changes needed: the page, chat assistant, enquiry
form and WhatsApp handoff all read from config. Useful optional keys:

- `booking.requiredFields` — which enquiry fields to show (defaults to the appointment-style six)
- `booking.fieldLabels` / `booking.fieldOptions` — rename fields, or turn one into a dropdown
- `assistant.enquiryScript` — override how the AI qualifies and collects a lead
- `theme.soft` — tint for chips/pills (defaults to the `globals.css` value)
- `whatsapp.number` — may be left empty; CTAs then show a "not available yet" state

## How it's wired

| Piece | File |
|---|---|
| Business registry (which JSON = which id) | `config/registry.json` |
| Business config (name, services, FAQs, hours, WhatsApp number, theme, guardrails) | `config/businesses/*.json` |
| Typed config schema | `src/lib/types.ts` |
| Config loader (server-side) | `src/lib/config.ts` |
| System prompt builder (injects services/FAQs/hours/guardrails) | `src/lib/prompt.ts` |
| LLM call (Groq via OpenAI-compatible API, Gemini fallback) | `src/lib/llm.ts` |
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
