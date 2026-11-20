export interface ContactForm { name: string; email: string; message: string }
export type ContactErrors = Partial<Record<keyof ContactForm, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(f: ContactForm): ContactErrors {
  const e: ContactErrors = {};
  if (!f.name.trim()) e.name = 'Please tell us your name.';
  if (!EMAIL.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.message.trim().length < 10) e.message = 'Please write at least 10 characters.';
  if (f.message.length > 5000) e.message = 'Please keep the message under 5000 characters.';
  return e;
}

/** mailto: link for the form (CR/LF stripped from single-line fields so headers cannot be injected). */
export function contactMailto(to: string, f: ContactForm): string {
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();
  const subject = `Message from ${oneLine(f.name)}`;
  const body = `${f.message.trim()}\n\n— ${oneLine(f.name)} <${oneLine(f.email)}>`;
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
