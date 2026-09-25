import { loadBusiness, getDefaultBusinessId } from '@/lib/config';
import Experience from '@/components/Experience';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default function Home() {
  const business = loadBusiness(getDefaultBusinessId());
  const waUrl = buildWhatsAppUrl(business.whatsapp.number, business.whatsapp.defaultMessage);

  return (
    <main className="flex-1">
      {/* Hero */}
      <header className="bg-gradient-to-br from-brand-dark to-brand text-white">
        <div className="mx-auto max-w-4xl px-5 py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{business.category}</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-5xl">{business.name}</h1>
          <p className="mt-3 text-lg text-white/90 sm:text-xl">{business.tagline}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75">{business.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#booking"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-dark shadow-sm transition hover:bg-white/90"
            >
              Send a booking enquiry
            </a>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              WhatsApp us
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-14 px-5 py-12">
        {/* Services */}
        <section id="services">
          <h2 className="text-2xl font-bold text-slate-900">Our services</h2>
          <p className="mt-1 text-sm text-slate-500">
            Ask our assistant or message the team for current pricing — prices are confirmed personally.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {business.services.map((s) => (
              <div key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md">
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
        <section id="visit" className="grid gap-6 sm:grid-cols-2">
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
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Visit &amp; contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li>
                <span className="font-medium text-slate-900">Address:</span> {business.location}
              </li>
              <li>
                <span className="font-medium text-slate-900">Phone:</span>{' '}
                <a className="text-brand hover:underline" href={`tel:${business.phone.replace(/\s/g, '')}`}>
                  {business.phone}
                </a>
              </li>
              <li>
                <span className="font-medium text-slate-900">Email:</span>{' '}
                <a className="text-brand hover:underline" href={`mailto:${business.email}`}>
                  {business.email}
                </a>
              </li>
            </ul>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Chat with the team on WhatsApp
            </a>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <h2 className="text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          <div className="mt-6 space-y-3">
            {business.faqs.map((f) => (
              <details key={f.question} className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 open:ring-brand/30">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span className="shrink-0 text-brand transition group-open:rotate-45" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Booking enquiry */}
        <section id="booking">
          <Experience business={business} />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-5 py-8 text-center text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{business.name}</p>
          <p>
            {business.location} · {business.phone}
          </p>
          <p>Enquiries are confirmed by the team — this assistant never books or prices on its own.</p>
        </div>
      </footer>
    </main>
  );
}
