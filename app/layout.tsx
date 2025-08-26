import './globals.css';
import type { Metadata } from 'next';
import { NavHeader } from '@/components/nav-header';
import { SupportAgent } from '@/components/support-agent';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Footer } from '@/components/footer';
import { Providers } from './providers';
import { Inter } from 'next/font/google';

// Initialize font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AI Brand Creator',
  description: 'Create your brand identity with AI',
};

// Define routes where footer should not be shown
const APP_ROUTES = [
  '/brand-strategy',
  '/visual-identity',
  '/voice-content',
  '/dashboard'
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <div className="min-h-screen flex flex-col">
          <Providers>
            <TooltipProvider>
              <NavHeader />
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-background to-background">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
                  
                  <div className="absolute inset-0 bg-background [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] opacity-40" />
                  
                  <div className="absolute h-full w-full bg-background [background:radial-gradient(75%_75%_at_50%_50%,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_100%)]" />
                </div>
                <div className="relative z-10">
                  {children}
                </div>
              </div>
              <SupportAgent />
            </TooltipProvider>
          </Providers>
        </div>
      </body>
    </html>
  );
}