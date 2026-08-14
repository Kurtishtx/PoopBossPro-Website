import type { Metadata } from "next";
import Script from "next/script";
import Footer from "./components/Footer";
import DemoPopup from "./components/DemoPopup";
import "./globals.css";

export const metadata: Metadata = {
  title: "PoopBossPro | Pooper Scooper & Pet Waste Removal Software",
  description: "PoopBossPro is all-in-one software for pooper scooper and pet waste removal businesses, built by people who've run real routes. Recurring scheduling, route building, crew dispatch, and card-on-file billing. $79/month, everything included.",
  /* Google's search results still show Vercel's default triangle for this domain, cached from
     before the crown existed. The files themselves have been correct for a month — /favicon.ico
     contains the crown at 16, 32 and 48px — but Google has no reason to refetch a URL it already
     has, so the stale copy just sits there.

     Versioning the URLs gives it something it has never seen. Paired with Request Indexing in
     Search Console, that is what actually breaks the cache; waiting does not. */
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/apple-icon.png?v=2",
  },
};


const structuredData = {"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://poopbosspro.com/#organization","name":"PoopBossPro","url":"https://poopbosspro.com","logo":"https://poopbosspro.com/icon.png","description":"Pet waste removal and pooper scooper software with recurring route scheduling, crew dispatch, and card-on-file billing."},{"@type":"WebSite","@id":"https://poopbosspro.com/#website","url":"https://poopbosspro.com","name":"PoopBossPro","publisher":{"@id":"https://poopbosspro.com/#organization"}},{"@type":"SoftwareApplication","name":"PoopBossPro","applicationCategory":"BusinessApplication","operatingSystem":"Web, iOS, Android","description":"Pet waste removal and pooper scooper software with recurring route scheduling, crew dispatch, and card-on-file billing.","offers":{"@type":"Offer","price":"79","priceCurrency":"USD","description":"$79/month flat — everything included, 14-day free trial."},"publisher":{"@id":"https://poopbosspro.com/#organization"}}]};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        {children}
        <DemoPopup />
        <Footer />
        <Script
          src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
          strategy="afterInteractive"
        />
        {/* Google tag (gtag.js) — Ads conversion tracking base */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-97QJVSZQ1M"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-97QJVSZQ1M');
            gtag('config', 'AW-994175437');
            /* Google Ads conversion: Live Demo Click — fires on any link to the demo */
            document.addEventListener('click', function(e){
              var a = e.target && e.target.closest ? e.target.closest('a') : null;
              if (a && a.href && a.href.indexOf('my.poopbosspro.com/demo.html') !== -1) {
                gtag('event', 'conversion', { send_to: 'AW-994175437/lmKICNnrvtgcEM3Th9oD', transport_type: 'beacon' });
              }
            });`}
        </Script>
      </body>
    </html>
  );
}
