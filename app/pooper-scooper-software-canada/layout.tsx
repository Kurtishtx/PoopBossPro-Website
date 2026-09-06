import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pooper Scooper Software for Canada | CAD Billing Built In — PoopBossPro',
  description: 'Pooper scooper software that works in Canada out of the box — bill your customers in Canadian dollars, run weekly scoop routes by neighbourhood, and book the spring-thaw cleanup rush. Live demo, no sales call. From $49 USD/month.',
  alternates: { canonical: 'https://poopbosspro.com/pooper-scooper-software-canada' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
