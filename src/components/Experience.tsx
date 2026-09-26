'use client';

import { useState } from 'react';
import type { BusinessConfig } from '@/lib/types';
import type { BookingContext } from '@/lib/whatsapp';
import BookingForm from './BookingForm';
import ChatAssistant from './ChatAssistant';

/**
 * Client island that keeps the booking-form state and the AI chat in sync:
 * whatever the visitor types into the enquiry form is shared with the
 * assistant, so it can acknowledge and refine it before WhatsApp handoff.
 */
export default function Experience({ business }: { business: BusinessConfig }) {
  const [booking, setBooking] = useState<BookingContext>({});
  return (
    <>
      <BookingForm key={`form-${business.id}`} business={business} onBookingChange={setBooking} />
      <ChatAssistant key={`chat-${business.id}`} business={business} booking={booking} />
    </>
  );
}
