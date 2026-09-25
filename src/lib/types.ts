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
}

export interface BookingConfig {
  /** Label for the enquiry form heading. */
  formTitle: string;
  /** Fields the AI should try to collect before the WhatsApp handoff. */
  requiredFields: Array<'name' | 'phone' | 'service' | 'preferredDate' | 'preferredTime' | 'notes'>;
  /** Note shown to users about confirmation (no invented availability). */
  disclaimer: string;
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
