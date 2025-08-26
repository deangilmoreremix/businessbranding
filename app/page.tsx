import { LandingPage } from '@/components/landing-page';
import { ClientProvider } from '@/components/client-provider';

export default function Home() {
  return (
    <ClientProvider>
      <LandingPage />
    </ClientProvider>
  );
}