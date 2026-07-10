import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopBossPro | Pooper Scooper & Pet Waste Removal Software",
  description: "PoopBossPro is all-in-one software for pooper scooper and pet waste removal businesses, built by people who've run real routes. Recurring scheduling, route building, crew dispatch, and card-on-file billing. $79/month, everything included.",
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://poopbosspro.com/#organization","name":"PoopBossPro","url":"https://poopbosspro.com","logo":"https://poopbosspro.com/icon.svg","description":"Pet waste removal and pooper scooper software with recurring route scheduling, crew dispatch, and card-on-file billing."},{"@type":"WebSite","@id":"https://poopbosspro.com/#website","url":"https://poopbosspro.com","name":"PoopBossPro","publisher":{"@id":"https://poopbosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"PoopBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Pet waste removal and pooper scooper software with recurring route scheduling, crew dispatch, and card-on-file billing.","offers":{"@type":"Offer","price":"79","priceCurrency":"USD","description":"$79/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://poopbosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
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
