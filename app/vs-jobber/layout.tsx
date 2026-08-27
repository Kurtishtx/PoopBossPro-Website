import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PoopBossPro vs Jobber | PoopBossPro',
  description: 'PoopBossPro vs Jobber: spray-native scheduling, published pricing from $49/month, circle-map routing, and native two-way texting logs. Feature-by-feature comparison.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
