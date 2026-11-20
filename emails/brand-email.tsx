import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components';
import * as React from 'react';

export interface BrandEmailProps {
  brandName: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Hex colours; the first is the accent. */
  palette?: string[];
}

/** Responsive brand announcement email (React Email). Rendered server-side by /api/email/render. */
export default function BrandEmail({ brandName, headline, body, ctaLabel, ctaUrl, palette = ['#4f46e5', '#ec4899'] }: BrandEmailProps) {
  const accent = palette[0] ?? '#4f46e5';
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);
  return (
    <Html lang="en">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={{ backgroundColor: '#f6f7fb', fontFamily: 'Helvetica, Arial, sans-serif', margin: 0, padding: '24px 0' }}>
        <Container style={{ backgroundColor: '#ffffff', maxWidth: 560, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }}>
          <Section style={{ backgroundColor: accent, padding: '20px 32px' }}>
            <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 700, margin: 0 }}>{brandName}</Text>
          </Section>
          <Section style={{ padding: '32px' }}>
            <Heading as="h1" style={{ fontSize: 26, lineHeight: '32px', margin: '0 0 16px', color: '#111827' }}>{headline}</Heading>
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ fontSize: 16, lineHeight: '24px', color: '#374151', margin: '0 0 16px' }}>{p}</Text>
            ))}
            {ctaLabel && ctaUrl && (
              <Button href={ctaUrl} style={{ backgroundColor: accent, color: '#ffffff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
                {ctaLabel}
              </Button>
            )}
          </Section>
          <Hr style={{ borderColor: '#e5e7eb', margin: 0 }} />
          <Section style={{ padding: '16px 32px' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>You are receiving this email from {brandName}.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
