'use client';

import { useState } from 'react';
import type { BusinessConfig } from '@/lib/types';
import type { BookingContext } from '@/lib/whatsapp';
import { buildEnquiryDraft, buildWhatsAppUrl } from '@/lib/whatsapp';

const FIELD_LABELS: Record<keyof BookingContext, string> = {
  name: 'Your name',
  phone: 'Phone number',
  service: 'Service of interest',
  preferredDate: 'Preferred date',
  preferredTime: 'Preferred time',
  notes: 'Anything we should know?',
};

export default function BookingForm({
  business,
  onBookingChange,
}: {
  business: BusinessConfig;
  onBookingChange?: (b: BookingContext) => void;
}) {
  const [form, setForm] = useState<BookingContext>({});
  const [draft, setDraft] = useState<string | null>(null);

  const required = business.booking.requiredFields;
  const has = (f: keyof BookingContext) => required.includes(f as (typeof required)[number]);
  const set = (f: keyof BookingContext, v: string) => {
    const next = { ...form, [f]: v };
    setForm(next);
    onBookingChange?.(next);
  };

  const canSubmit =
    (!has('name') || form.name?.trim()) &&
    (!has('phone') || form.phone?.trim()) &&
    (!has('service') || form.service?.trim()) &&
    (!has('preferredDate') || form.preferredDate?.trim());

  function prepare() {
    setDraft(buildEnquiryDraft(business, form));
  }

  const inputCls =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15';

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-7">
      <h2 className="text-xl font-bold text-slate-900">{business.booking.formTitle}</h2>
      <p className="mt-1 text-sm text-slate-500">{business.booking.disclaimer}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {has('name') && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.name}</span>
            <input className={inputCls} value={form.name || ''} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Priya" />
          </label>
        )}
        {has('phone') && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.phone}</span>
            <input className={inputCls} type="tel" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 …" />
          </label>
        )}
        {has('service') && (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.service}</span>
            <select className={inputCls} value={form.service || ''} onChange={(e) => set('service', e.target.value)}>
              <option value="">Select a treatment…</option>
              {business.services.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                  {s.duration ? ` — ${s.duration}` : ''}
                </option>
              ))}
            </select>
          </label>
        )}
        {has('preferredDate') && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.preferredDate}</span>
            <input className={inputCls} type="date" value={form.preferredDate || ''} onChange={(e) => set('preferredDate', e.target.value)} />
          </label>
        )}
        {has('preferredTime') && (
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.preferredTime}</span>
            <input className={inputCls} type="time" value={form.preferredTime || ''} onChange={(e) => set('preferredTime', e.target.value)} />
          </label>
        )}
        {has('notes') && (
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-slate-700">{FIELD_LABELS.notes}</span>
            <textarea className={`${inputCls} min-h-20 resize-y`} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} placeholder="Preferences, first visit, questions for the team…" />
          </label>
        )}
      </div>

      {!draft ? (
        <button
          onClick={prepare}
          disabled={!canSubmit}
          className="mt-6 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Review enquiry
        </button>
      ) : (
        <div className="mt-6 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your enquiry preview</p>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-100">{draft}</pre>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <a
              href={buildWhatsAppUrl(business.whatsapp.number, draft)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.664-1.602-.91-2.193-.244-.59-.492-.51-.67-.518-.173-.009-.371-.01-.57-.01-.197 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
              </svg>
              Send on WhatsApp
            </a>
            <button
              onClick={() => setDraft(null)}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Edit details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
