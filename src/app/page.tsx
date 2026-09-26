import { loadBusiness, getDefaultBusinessId } from '@/lib/config';
import Experience from '@/components/Experience';
import { buildWhatsAppUrl, hasWhatsAppNumber } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams?: Promise<{ biz?: string; business?: string }>;
}

export default async function Home(props: PageProps) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const bizId = searchParams?.biz || searchParams?.business || getDefaultBusinessId();
  const business = loadBusiness(bizId);

  const canHandOff = hasWhatsAppNumber(business);
  const waUrl = buildWhatsAppUrl(business.whatsapp.number, business.whatsapp.defaultMessage);
  const hasHours = business.openingHours && business.openingHours.length > 0;

  const themeStyles = {
    '--brand': business.theme.primary,
    '--brand-dark': business.theme.primaryDark,
    '--brand-accent': business.theme.accent,
    '--brand-soft': business.theme.soft || '#f1f5f9',
  } as React.CSSProperties;

  return (
    <main className="flex-1" style={themeStyles}>
      {/* Hero */}
      <header className="bg-gradient-to-br from-brand-dark to-brand text-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white/15 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-white/90">
              {business.category}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-medium text-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Assistant Ready
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {business.name}
          </h1>
          <p className="mt-2 text-lg font-medium text-white/90 sm:text-xl">{business.tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/80">{business.description}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#booking"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-white/90"
            >
              {business.booking.formTitle}
            </a>
            {canHandOff ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                WhatsApp us
              </a>
            ) : (
              <a
                href="#booking"
                className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Chat with AI Assistant
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-14 px-5 py-12">
        {/* Services / Property Categories */}
        <section id="services">
          <h2 className="text-2xl font-bold text-slate-900">
            {business.category === 'Real Estate' ? 'Property Categories' : 'Our services'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {business.category === 'Real Estate'
              ? 'Enquire about residential and commercial properties in DHA Karachi. Current pricing, availability, and documents are verified directly by our team.'
              : 'Ask our assistant or message the team for current pricing — prices are confirmed personally.'}
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {business.services.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900">{s.name}</h3>
                  {s.duration && (
                    <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
                      {s.duration}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Hours + contact */}
        <section id="visit" className={`grid gap-6 ${hasHours ? 'sm:grid-cols-2' : ''}`}>
          {hasHours && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-bold text-slate-900">Opening hours</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                {business.openingHours.map((o) => (
                  <div key={o.days} className="flex justify-between gap-4">
                    <dt className="text-slate-600">{o.days}</dt>
                    <dd className="font-medium text-slate-900">{o.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Location &amp; Contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <span className="font-medium text-slate-900">Coverage:</span> {business.location}
              </li>
              {business.phone && (
                <li>
                  <span className="font-medium text-slate-900">Phone:</span>{' '}
                  <a className="text-brand hover:underline" href={`tel:${business.phone.replace(/\s/g, '')}`}>
                    {business.phone}
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <span className="font-medium text-slate-900">Email:</span>{' '}
                  <a className="text-brand hover:underline" href={`mailto:${business.email}`}>
                    {business.email}
                  </a>
                </li>
              )}
            </ul>
            {canHandOff ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Chat with the team on WhatsApp
              </a>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
                WhatsApp handoff configured for client contact.
              </p>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-6 space-y-3">
            {business.faqs.map((f) => (
              <details
                key={f.question}
                className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 open:ring-brand/30"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span className="shrink-0 text-brand transition group-open:rotate-45" aria-hidden="true">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Booking / Enquiry & AI Assistant */}
        <section id="booking">
          <Experience business={business} />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-5 py-8 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{business.name}</p>
          <p>
            {business.location} {business.phone ? `· ${business.phone}` : ''}
          </p>
          <p>Enquiries are verified and confirmed by the team — the AI assistant qualifies and routes your request.</p>
        </div>
      </footer>
    </main>
  );
}
