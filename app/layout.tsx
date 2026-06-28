import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopBossPro | Pooper Scooper & Pet Waste Removal Software",
  description: "PoopBossPro is all-in-one software for pooper scooper and pet waste removal businesses, built by people who've run real routes. Recurring scheduling, route building, crew dispatch, and card-on-file billing. $79/month, everything included.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
