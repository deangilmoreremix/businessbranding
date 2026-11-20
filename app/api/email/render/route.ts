import { NextResponse } from 'next/server';
import * as React from 'react';
import { render } from '@react-email/render';
import BrandEmail from '@/emails/brand-email';
import { withUser } from '@/lib/server/user';

export const runtime = 'nodejs';

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const hex = /^#[0-9a-fA-F]{6}$/;

/**
 * Render the brand email template (React Email) to HTML and plain text.
 * POST { brandName, headline, body, ctaLabel?, ctaUrl?, palette? } -> { html, text }
 */
export async function POST(request: Request) {
  return withUser(request, { bucket: 'email-render', limit: 30, requireKey: false }, async () => {
    const b = await request.json();
    const ctaUrl = str(b.ctaUrl, 500);
    const props = {
      brandName: str(b.brandName, 100) || 'Your Brand',
      headline: str(b.headline, 200) || 'Hello',
      body: str(b.body, 5000),
      ctaLabel: str(b.ctaLabel, 60) || undefined,
      // only http(s) links are allowed in the CTA
      ctaUrl: /^https?:\/\//i.test(ctaUrl) ? ctaUrl : undefined,
      palette: Array.isArray(b.palette) ? b.palette.filter((c: unknown) => typeof c === 'string' && hex.test(c)).slice(0, 5) : undefined
    };
    const element = React.createElement(BrandEmail, props);
    const [html, text] = await Promise.all([render(element), render(element, { plainText: true })]);
    return NextResponse.json({ html, text });
  });
}
