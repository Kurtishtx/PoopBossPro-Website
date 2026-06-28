import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PoopBossPro vs Jobber | PoopBossPro',
  description: 'PoopBossPro vs Jobber: spray-native scheduling, flat $129/month pricing, circle-map routing, and chemical compliance logs. Feature-by-feature comparison.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
