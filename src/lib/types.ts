/**
 * Enquiry fields a business can ask for. The first six are appointment-shaped
 * (spa, clinic); the rest let other industries describe a requirement instead
 * of booking a time slot. All optional — each business picks its own subset
 * via `booking.requiredFields`.
 */
export type EnquiryFieldKey =
  | 'name'
  | 'phone'
  | 'service'
  | 'preferredDate'
  | 'preferredTime'
  | 'notes'
  | 'category'
  | 'area'
  | 'budget'
  | 'intent';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  /** Optional display duration, e.g. "60 min". Never a price claim. */
  duration?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface OpeningHours {
  days: string;
  hours: string;
}

export interface AssistantConfig {
  /** Short persona name used in prompts and UI. */
  personaName: string;
  /** First line of the chat greeting. */
  greeting: string;
  /** Extra guidance injected into the system prompt. */
  systemGuidance: string;
  /** Suggested starter questions shown as chips. */
  quickPrompts: string[];
  /**
   * Optional business-specific enquiry flow, injected into the system prompt in
   * place of the generic "collect these details" instruction. Use this when a
   * business qualifies a lead differently (e.g. property type, then budget)
   * rather than booking a time slot.
   */
  enquiryScript?: string;
}

export interface BookingConfig {
  /** Label for the enquiry form heading. */
  formTitle: string;
  /** Fields the AI should try to collect before the WhatsApp handoff. */
  requiredFields: EnquiryFieldKey[];
  /** Note shown to users about confirmation (no invented availability). */
  disclaimer: string;
  /**
   * Overrides for the default English field labels, so a business can speak in
   * its own terms (e.g. "Property type" instead of "Service of interest").
   * Affects both the form and the WhatsApp enquiry summary.
   */
  fieldLabels?: Partial<Record<EnquiryFieldKey, string>>;
  /**
   * Fixed option lists for choice-style fields. A field listed here renders as
   * a dropdown; anything else renders as a free-text input.
   */
  fieldOptions?: Partial<Record<EnquiryFieldKey, string[]>>;
  /** Label for the WhatsApp handoff button. Also referenced in the AI prompt. */
  ctaLabel?: string;
}

export interface WhatsAppConfig {
  /** Full international number digits only, e.g. "919876543210". From config only. */
  number: string;
  /** Default prefilled message text (business name intro). */
  defaultMessage: string;
}

export interface ThemeConfig {
  /** Tailwind-friendly hex colors driving the UI. */
  primary: string;
  primaryDark: string;
  accent: string;
  /** Tinted background for chips/pills. Defaults to the CSS fallback if omitted. */
  soft?: string;
  /** Google font name for headings, optional. */
  font?: string;
}

export interface BusinessConfig {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  website?: string;
  theme: ThemeConfig;
  assistant: AssistantConfig;
  services: ServiceItem[];
  faqs: FaqItem[];
  openingHours: OpeningHours[];
  booking: BookingConfig;
  whatsapp: WhatsAppConfig;
  /**
   * Hard guardrails for the AI: things it must NEVER invent.
   * Injected verbatim into the system prompt.
   */
  guardrails: string[];
}
