import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PoopBossPro vs GorillaDesk | PoopBossPro',
  description: 'PoopBossPro vs GorillaDesk: circle-map routing, sq ft pricing, automated SMS, and spray-specific compliance logs — built for routes, not generic pest control.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}