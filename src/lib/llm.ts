import { GoogleGenAI } from '@google/genai';
import type { BusinessConfig } from './types';
import { buildSystemPrompt, type BookingContext, type ChatTurn } from './prompt';

/**
 * Provider-agnostic chat completion with a fallback ladder across providers.
 *
 * Groq is preferred because it is far more generous than the Gemini free tier
 * (20 requests/day/model), but the ladder degrades to Gemini when no Groq key
 * is configured, so the app still works on a single-provider setup.
 */

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODELS = [
  process.env.GROQ_MODEL,
  // gpt-oss-120b is first: qwen/qwen3.8-27b rate-limits readily on free keys,
  // and every wasted candidate costs the user a visible round-trip.
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
].filter((m): m is string => Boolean(m));

const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.8-flash',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
].filter((m): m is string => Boolean(m));

const MAX_ATTEMPTS = 2;
const RETRY_BASE_MS = 400;
/** Must stay under `maxDuration` in app/api/chat/route.ts, leaving room to serialise the response. */
const DEADLINE_MS = 25_000;

const MAX_OUTPUT_TOKENS = 2048;
/** A length-truncated answer is retried once at this ceiling before we give up and surface it. */
const MAX_OUTPUT_TOKENS_RETRY = 4096;

let geminiClient: GoogleGenAI | null = null;

type FailureKind = 'auth' | 'quota' | 'model-gone' | 'transient';

class ProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

function classify(err: unknown): FailureKind {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof ProviderError ? err.status : (err as { status?: number })?.status;

  if (status === 401 || status === 403 || /\b(401|403)\b|API_KEY|PERMISSION_DENIED|invalid.*key/i.test(message)) {
    return 'auth';
  }
  // Quota and auth problems are per-provider, not per-request: retrying the same
  // model cannot help, but another candidate still might.
  if (status === 429 || /quota|rate limit|billing|insufficient_quota/i.test(message)) {
    return 'quota';
  }
  if (status === 404 || /\b404\b|NOT_FOUND|is not found|not supported|deprecated/i.test(message)) {
    return 'model-gone';
  }
  return 'transient';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface GenerateArgs {
  systemInstruction: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  maxOutputTokens: number;
  signal: AbortSignal;
}

interface GenerateResult {
  text: string;
  /** True when the provider stopped because it ran out of output budget. */
  truncated: boolean;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ProviderError('GEMINI_API_KEY is not set. Add it to .env.local (see .env.example).');
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 10_000,
        // NOTE: initialDelay/maxDelay are in *seconds*, not milliseconds.
        // The SDK defaults to 5 attempts with backoff up to 60s, which alone can
        // outlive the route's maxDuration and surface as a non-JSON timeout.
        retryOptions: { attempts: 2, initialDelay: 0.5, maxDelay: 2 },
      },
    });
  }
  return geminiClient;
}

async function generateWithGroq(model: string, args: GenerateArgs): Promise<GenerateResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new ProviderError('GROQ_API_KEY is not set.');
  }

  const res = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [{ role: 'system', content: args.systemInstruction }, ...args.messages],
      temperature: 0.4,
      max_tokens: args.maxOutputTokens,
    }),
    signal: args.signal,
  });

  const json = (await res.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: { finish_reason?: string; message?: { content?: string } }[];
  } | null;

  if (!res.ok) {
    throw new ProviderError(
      `groq ${model} failed [${res.status}]: ${json?.error?.message ?? res.statusText}`,
      res.status
    );
  }

  const choice = json?.choices?.[0];
  return {
    text: (choice?.message?.content ?? '').trim(),
    truncated: choice?.finish_reason === 'length',
  };
}

async function generateWithGemini(model: string, args: GenerateArgs): Promise<GenerateResult> {
  const response = await getGeminiClient().models.generateContent({
    model,
    contents: args.messages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      text: m.content,
    })),
    config: {
      systemInstruction: args.systemInstruction,
      temperature: 0.4,
      maxOutputTokens: args.maxOutputTokens,
      // This assistant answers from a small fixed menu, so reasoning tokens are
      // pure overhead: they used to eat half the output budget and truncate replies.
      thinkingConfig: { thinkingBudget: 0 },
      abortSignal: args.signal,
    },
  });

  return {
    text: response.text?.trim() ?? '',
    truncated: response.candidates?.[0]?.finishReason === 'MAX_TOKENS',
  };
}

interface Candidate {
  provider: 'groq' | 'gemini';
  model: string;
}

function buildLadder(): Candidate[] {
  const ladder: Candidate[] = [];
  if (process.env.GROQ_API_KEY) {
    for (const model of GROQ_MODELS) ladder.push({ provider: 'groq', model });
  }
  if (process.env.GEMINI_API_KEY) {
    for (const model of GEMINI_MODELS) ladder.push({ provider: 'gemini', model });
  }
  return ladder;
}

export async function askAssistant(
  business: BusinessConfig,
  history: ChatTurn[],
  booking?: BookingContext
): Promise<string> {
  const ladder = buildLadder();
  if (ladder.length === 0) {
    throw new Error('No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env.local.');
  }

  const messages = history.map((t) => ({ role: t.role, content: t.content }));

  if (booking) {
    messages.push({
      role: 'user',
      content: `[form-update] The user has filled the booking enquiry form with: ${JSON.stringify(booking)}. Acknowledge briefly and tell them to tap the WhatsApp button to send it to the team for confirmation.`,
    });
  }

  let lastError: unknown;
  const deadline = Date.now() + DEADLINE_MS;
  const systemInstruction = buildSystemPrompt(business);

  for (const { provider, model } of ladder) {
    let maxOutputTokens = MAX_OUTPUT_TOKENS;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (Date.now() >= deadline) break;

      // A deadline check alone cannot interrupt an in-flight call, so cap each
      // attempt with the time actually left in the budget.
      const budgetMs = Math.min(Math.max(deadline - Date.now(), 2_000), 10_000);
      const args: GenerateArgs = {
        systemInstruction,
        messages,
        maxOutputTokens,
        signal: AbortSignal.timeout(budgetMs),
      };

      try {
        const result =
          provider === 'groq'
            ? await generateWithGroq(model, args)
            : await generateWithGemini(model, args);

        if (result.text && result.truncated) {
          // Never pass a half-sentence off as a complete answer.
          if (maxOutputTokens < MAX_OUTPUT_TOKENS_RETRY) {
            maxOutputTokens = MAX_OUTPUT_TOKENS_RETRY;
            continue;
          }
          console.warn(
            `[chat] ${provider}/${model} still truncated at ${maxOutputTokens} tokens; returning partial text`
          );
        }

        if (result.text) {
          return result.text;
        }

        lastError = new Error(`${provider}/${model} returned an empty response`);
      } catch (err) {
        lastError = err;
        const kind = classify(err);

        if (kind === 'transient') {
          if (Date.now() + RETRY_BASE_MS * attempt < deadline) {
            await sleep(RETRY_BASE_MS * attempt);
            continue;
          }
          break;
        }

        if (kind === 'auth') {
          console.error(`[chat] ${provider}/${model} rejected our credentials; trying next candidate`);
        } else if (kind === 'quota') {
          console.warn(`[chat] ${provider}/${model} rate limited or out of quota; trying next candidate`);
        } else {
          console.warn(`[chat] ${provider}/${model} is unavailable; trying next candidate`);
        }
        break;
      }
    }

    if (Date.now() >= deadline) break;
  }

  if (Date.now() >= deadline) {
    throw new Error(
      `No model answered within ${DEADLINE_MS}ms budget. Last error: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
  }

  throw lastError ?? new Error('No candidate model could answer the request.');
}
