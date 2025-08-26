'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Feature, getDemoSession, checkDemoLimits } from '@/lib/auth';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DemoWrapperProps {
  children: React.ReactNode;
  feature: Feature;
}

export function DemoWrapper({ children, feature }: DemoWrapperProps) {
  const [demoAvailable, setDemoAvailable] = useState(true);
  const [generationsLeft, setGenerationsLeft] = useState(3);

  useEffect(() => {
    const session = getDemoSession();
    setGenerationsLeft(session.generationsLeft);
    setDemoAvailable(checkDemoLimits(feature));
  }, [feature]);

  if (!demoAvailable) {
    return (
      <Card className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">Demo Limit Reached</h3>
        <p className="text-muted-foreground mb-6">
          You&apos;ve reached the demo limit for this feature. Sign up for full access.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
              Sign Up Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="lg">
              View Pricing
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
          Demo Mode
        </Badge>
        <div className="text-sm text-muted-foreground">
          {generationsLeft} generations remaining
        </div>
      </div>
      {children}
    </div>
  );
}