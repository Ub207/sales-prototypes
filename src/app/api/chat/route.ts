import { NextResponse } from 'next/server';
import { loadBusiness, getDefaultBusinessId } from '@/lib/config';
import { askAssistant } from '@/lib/llm';
import type { BookingContext, ChatTurn } from '@/lib/prompt';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      businessId?: string;
      messages?: ChatTurn[];
      booking?: BookingContext;
    };

    const business = loadBusiness(body.businessId || getDefaultBusinessId());

    const messages = (body.messages || []).filter(
      (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()
    ).slice(-12);

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Send at least one user message.' }, { status: 400 });
    }

    const reply = await askAssistant(business, messages, body.booking);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[chat] request failed:', err);
    return NextResponse.json(
      { error: 'The assistant could not respond right now.', fallback: 'The assistant is unavailable right now. You can still send your enquiry to the team on WhatsApp.' },
      { status: 500 }
    );
  }
}
