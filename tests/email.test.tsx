import { describe, expect, it } from 'vitest';
import * as React from 'react';
import { render } from '@react-email/render';
import BrandEmail from '@/emails/brand-email';

describe('BrandEmail template', () => {
  it('renders the headline, paragraphs, accent colour and CTA link', async () => {
    const html = await render(<BrandEmail brandName="Acme" headline="Big news" body={'First paragraph.\n\nSecond paragraph.'} ctaLabel="Shop now" ctaUrl="https://example.com/shop" palette={['#123456']} />);
    expect(html).toContain('Big news');
    expect(html).toContain('First paragraph.');
    expect(html).toContain('Second paragraph.');
    expect(html).toContain('href="https://example.com/shop"');
    expect(html).toContain('#123456');
    expect(html).toContain('<!DOCTYPE html');
  });
  it('omits the button without a CTA and renders a plain-text version', async () => {
    const el = <BrandEmail brandName="Acme" headline="Hi" body="Hello there" />;
    expect(await render(el)).not.toContain('<a ');
    const text = await render(el, { plainText: true });
    expect(text.toLowerCase()).toContain('hello there');
    expect(text).not.toContain('<');
  });
  it('escapes HTML in user text', async () => {
    const html = await render(<BrandEmail brandName="Acme" headline={'<script>alert(1)</script>'} body="x" />);
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
