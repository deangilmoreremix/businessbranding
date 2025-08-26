'use client';

import { useEffect, useState } from 'react';
import HeroSection from '@/components/hero-section';
import ParallaxFeatures from '@/components/parallax-features';
import { IndustriesSection } from '@/components/industries-section';

export function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <main className="overflow-hidden">
      <HeroSection />
      <ParallaxFeatures />
      <IndustriesSection />
    </main>
  );
}