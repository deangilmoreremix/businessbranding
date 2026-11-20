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
