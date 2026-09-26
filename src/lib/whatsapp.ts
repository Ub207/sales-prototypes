import type { BusinessConfig, EnquiryFieldKey } from './types';

/** Client-safe helpers: no server-only imports (fs, SDK) — usable from browser components. */

export interface BookingContext {
  name?: string;
  phone?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  /** Broad grouping, e.g. "Residential" / "Commercial". */
  category?: string;
  /** Preferred location, e.g. an area or phase. */
  area?: string;
  /** Stated budget, kept as free text so nothing is implied as approved. */
  budget?: string;
  /** Transaction type, e.g. "Buy" / "Rent". */
  intent?: string;
}

/** Order used in the WhatsApp enquiry summary. */
const DRAFT_ORDER: EnquiryFieldKey[] = [
  'name',
  'phone',
  'category',
  'service',
  'area',
  'budget',
  'intent',
  'preferredDate',
  'preferredTime',
  'notes',
];

/** Neutral summary labels. Overridable per business via `booking.fieldLabels`. */
const DRAFT_LABELS: Record<EnquiryFieldKey, string> = {
  name: 'Name',
  phone: 'Phone',
  category: 'Category',
  service: 'Service',
  area: 'Preferred area',
  budget: 'Budget',
  intent: 'Buy or Rent',
  preferredDate: 'Preferred date',
  preferredTime: 'Preferred time',
  notes: 'Notes',
};

export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/**
 * A business may ship without a WhatsApp number yet. Rather than link to a
 * broken `wa.me` URL (or invent a number), the UI checks this first.
 */
export function hasWhatsAppNumber(business: BusinessConfig): boolean {
  return Boolean(business.whatsapp.number && business.whatsapp.number.replace(/\D/g, '').length >= 7);
}

export function buildEnquiryDraft(business: BusinessConfig, booking: BookingContext): string {
  const labels = { ...DRAFT_LABELS, ...business.booking.fieldLabels };

  const greetingIntro =
    business.category === 'Real Estate'
      ? `Hello ${business.name}! I'd like to send a property enquiry:`
      : `Hello ${business.name}! I'd like to send a booking enquiry:`;

  const closing =
    business.category === 'Real Estate'
      ? 'Please confirm details and availability with me. Thank you!'
      : 'Please confirm availability. Thank you!';

  const lines: (string | undefined)[] = [
    greetingIntro,
    ...DRAFT_ORDER.map((key) =>
      booking[key]?.trim() ? `${labels[key]}: ${booking[key]}` : undefined
    ),
    closing,
  ];

  return lines.filter(Boolean).join('\n');
}
