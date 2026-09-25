import type { BusinessConfig } from './types';

/** Client-safe helpers: no server-only imports (fs, SDK) — usable from browser components. */

export interface BookingContext {
  name?: string;
  phone?: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

export function buildWhatsAppUrl(number: string, message: string): string {
  const digits = number.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildEnquiryDraft(business: BusinessConfig, booking: BookingContext): string {
  const lines = [
    `Hello ${business.name}! I'd like to send a booking enquiry:`,
    '',
    booking.name && `Name: ${booking.name}`,
    booking.phone && `Phone: ${booking.phone}`,
    booking.service && `Service: ${booking.service}`,
    booking.preferredDate && `Preferred date: ${booking.preferredDate}`,
    booking.preferredTime && `Preferred time: ${booking.preferredTime}`,
    booking.notes && `Notes: ${booking.notes}`,
    '',
    'Please confirm availability. Thank you!',
  ].filter(Boolean);
  return lines.join('\n');
}
