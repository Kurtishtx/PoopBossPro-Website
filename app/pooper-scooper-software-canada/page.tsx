'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroDemo from '../components/HeroDemo';
import SignupModal from '../components/SignupModal';
import PlanCompare from '../components/PlanCompare';

/* Canada landing page — long-form, homepage-depth. Targets "pooper scooper software canada"
   searches with real substance: CAD customer billing is native (Country = Canada in Company
   Info), so the page can make that claim honestly instead of geo word-swapping US copy.
   The two things that are NOT instant in Canada — the subscription bills in USD, and texting
   needs a Canadian carrier-registered number — are stated plainly in the FAQ. */

const faqs = [
  {
    q: 'Does PoopBossPro actually work for Canadian pooper scooper companies?',
    a: 'Yes. Recurring scheduling, route building, crew dispatch, yard profiles, estimates, the crew app and the customer app all work in Canada today. You connect your own Canadian Stripe account, and every customer invoice, card charge, and payment link bills in Canadian dollars.',
  },
  {
    q: 'Are my customers billed in Canadian dollars?',
    a: 'Yes. Set your country to Canada on the Company Info page and CAD becomes your billing currency everywhere — invoices, card-on-file charges, Pay Now links, and the customer app. Your customers see plain Canadian dollars, never a USD line item with a conversion fee behind it.',
  },
  {
    q: 'What does the PoopBossPro subscription itself cost in Canada?',
    a: 'Plans are priced in US dollars — from $49 USD a month, never billed per user. Your card is charged in USD and your bank converts it to CAD. We say that plainly because a surprise on your own statement is exactly the kind of thing software companies bury.',
  },
  {
    q: 'Do the automated customer texts work in Canada?',
    a: 'Texting in Canada requires registering a Canadian sending number with the carriers, which takes some setup — it is not flip-a-switch on day one. We walk you through it during onboarding. Email alerts and customer-app notifications work everywhere from your first day.',
  },
  {
    q: 'Can I run spring one-time cleanups alongside my weekly routes?',
    a: 'Yes, and that combination is the whole point in Canada. One-time spring cleanups land on the job board next to your recurring routes — schedule them into an open day, and when the yard is caught up, flip the customer to a weekly or bi-weekly plan without re-entering anything.',
  },
  {
    q: 'Is there a free trial? Do I have to sign a contract?',
    a: 'The trial is 14 days with no credit card required, and there is no contract after it either — you can cancel the software the same way your customers can cancel their scoop service. If it does not earn its keep on your routes, stop paying for it.',
  },
];

export default function Page() {
  const openTrial = (el: HTMLElement) => { (window as any).__openSignup?.(1, el); };

  /* FAQPage structured data, built from the same array rendered below so the two can never
     drift apart. */
  useEffect(() => {
    const ID = 'canada-faq-ld';
    if (document.getElementById(ID)) return;
    const s = document.createElement('script');
    s.id = ID;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(s);
    return () => { document.getElementById(ID)?.remove(); };
  }, []);

  return (
    <>
      <Navbar onTrialClick={openTrial} />

      {/* ═══ PRICE + LIVE DEMO ═══ same fold order as the homepage: price, trial terms, and
          the running product take the first screen. */}
      <div style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 60%, #1a1a1a 100%)', padding: 'clamp(76px,7vw,80px) clamp(14px,4vw,40px) 0', textAlign: 'center' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(22px,3vw,32px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', color: '#fff' }}>
            <span style={{ fontSize: 'clamp(30px,4.6vw,46px)', fontWeight: 800, lineHeight: 1 }}><span style={{ fontSize: '.5em', fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>from </span>$49<span style={{ fontSize: '.46em', fontWeight: 700, color: 'rgba(255,255,255,.6)' }}>/month</span></span>
            <span style={{ fontSize: 'clamp(16px,2.2vw,22px)', fontWeight: 800, color: 'var(--orange)' }}>&middot; 14-Day Free Trial</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', fontWeight: 600, marginTop: '7px', letterSpacing: '.3px' }}>No credit card required &middot; Cancel anytime &middot; Your customers billed in CAD</div>
        </div>
        {/* EXACTLY ONE HeroDemo on the page — a second mount kills the first one's demo token. */}
        <HeroDemo />
      </div>

      {/* ═══ HERO ═══ */}
      <div className="hero" style={{ paddingTop: '60px' }}>
        <div className="hero-badge">🇨🇦 Works in Canada &middot; CAD customer billing built in</div>
        <h1>Pooper Scooper Software<br /><span>Built for Canada</span></h1>
        <p className="hero-sub" style={{ marginBottom: '36px' }}>Dog waste removal in Canada is a year-round route business with one brutal season change: the yards you scoop weekly all summer either run straight through the snow or wait under it — and when the thaw comes, months of buried waste surface at once. PoopBossPro runs the weekly routes, books the spring rush, and bills every one of your customers in Canadian dollars through your own Canadian Stripe account.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openTrial(e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; The demo above is the real software &nbsp;&middot;&nbsp; <b>from $49/mo USD</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">CAD</div><div className="hero-stat-lbl">Customer Billing Currency</div></div>
          <div><div className="hero-stat-val">12</div><div className="hero-stat-lbl">Months a Route Can Run</div></div>
          <div><div className="hero-stat-val">0</div><div className="hero-stat-lbl">Contracts, Yours or Theirs</div></div>
          <div><div className="hero-stat-val">3</div><div className="hero-stat-lbl">Apps: Office, Crew, Customer</div></div>
        </div>
      </div>

      {/* ═══ PREMIUM BAND — why a US platform half-works in Canada ═══ */}
      <div className="premium-band">
        <h2>Most Scooping Software Treats Canada<br /><span>Like a Rounding Error.</span></h2>
        <p>The usual experience for a Canadian scooping company on US software: your customers get invoices in USD or you keep a spreadsheet on the side, the map data is an afterthought, and support has never heard of a spring cleanup backlog. PoopBossPro was built so that setting your country to Canada on the Company Info page is the whole migration — after that, the invoices, the card charges, the payment links and the customer app are all in Canadian dollars, and everything else already worked.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🇨🇦</div><h4>CAD Billing, Native</h4><p>Connect your own Canadian Stripe account, set Country to Canada, and every invoice, card-on-file charge and Pay Now link bills your customers in Canadian dollars. No workarounds, no second system.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Routes That Survive Winter</h4><p>Weekly and bi-weekly visits build themselves week after week. Customers who pause for the snow keep their profile, their plan and their spot — restarting in March is a switch, not a re-signup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🌷</div><h4>The Spring-Thaw Rush</h4><p>Spring cleanup season is the biggest booking window of the year. One-time thaw cleanups land on the job board beside your recurring routes, so the busiest six weeks don&apos;t run on sticky notes.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔑</div><h4>Gate Codes &amp; Dog Names</h4><p>Every yard profile carries the gate code, the dogs&apos; names and count, and the notes that matter — the dog that charges the fence, the gate that freezes shut — right on your scooper&apos;s phone.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Card-on-File in CAD</h4><p>Charge the card after the visit or on a monthly subscription, send payment reminders automatically, and keep the full payment history — all of it in your customers&apos; own currency.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Customers Run Themselves</h4><p>Your customers get their own app — see visits, pay invoices, update their card, skip a week, refer a neighbour. In a no-contract industry, that convenience is what keeps them subscribed.</p></div>
        </div>
      </div>

      {/* ═══ CAD BILLING DEEP DIVE ═══ */}
      <section id="cad-billing">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Canadian Dollars, Everywhere</span>
            <h2 className="section-title">Your Customers Never See a USD Invoice</h2>
            <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '14px' }}>Billing is where US software quietly fails Canadian scooping companies. PoopBossPro makes the currency a one-time setting, not a monthly workaround: set your country to Canada in Company Info, connect your own Canadian Stripe account, and CAD flows through everything your customers touch.</p>
            <ul className="check-list">
              <li>Invoices, estimates and Pay Now links priced and charged in CAD</li>
              <li>Card-on-file charges after each visit or on a monthly subscription</li>
              <li>Automatic payment reminders chase unpaid invoices for you</li>
              <li>Partial payments, prepayments and full payment history per customer</li>
              <li>Your money settles through your own Canadian Stripe account — we never touch it</li>
            </ul>
            <p style={{ color: 'var(--muted)', fontSize: '14px', marginTop: '18px' }}>One honest exception, stated here instead of hidden: the PoopBossPro subscription itself bills in USD and your bank converts. Details in the FAQ below.</p>
          </div>
          <div className="highlight-visual">
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Invoice &mdash; Weekly Scoop Plan</div>
            <div className="mock-item">
              <div className="mock-dot green"></div>
              <div><div className="mock-label">Weekly cleanup &mdash; May</div><div className="mock-sub">4 visits &middot; 2 dogs</div></div>
              <div className="mock-badge green">$96.00 CAD</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot orange"></div>
              <div><div className="mock-label">Spring thaw cleanup</div><div className="mock-sub">One-time &middot; full yard</div></div>
              <div className="mock-badge">$140.00 CAD</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot blue"></div>
              <div><div className="mock-label">Card on file charged</div><div className="mock-sub">Visa &middot;&middot;&middot;&middot; 4242 &middot; auto-charge</div></div>
              <div className="mock-badge blue">Paid</div>
            </div>
            <div style={{ marginTop: '14px', textAlign: 'center', color: 'rgba(255,255,255,.35)', fontSize: '11px' }}>Billed through your own Canadian Stripe account</div>
          </div>
        </div>
        {/* Real screenshot, not a mockup — a live Stripe checkout from a Canada-set company on
            the platform. The country selector in it defaults to United States because Stripe
            lets each payer pick their own country; the charge itself is CA$. */}
        <div style={{ maxWidth: '900px', margin: '72px auto 0', textAlign: 'center' }}>
          <img
            src="/cad-checkout.png"
            alt="Stripe payment page for Hamann Lawn Care Invoice #459 charging CA$9.74, with card fields and a Pay button"
            style={{ width: '100%', maxWidth: '860px', height: 'auto', borderRadius: '14px', border: '1.5px solid var(--border)', boxShadow: '0 12px 48px rgba(10,10,10,.14)' }}
          />
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '14px', lineHeight: 1.6 }}>
            A real payment page from the platform &mdash; a Canada-set company&apos;s customer pays in Canadian dollars. (The founder&apos;s own company.)
          </p>
        </div>
      </section>

      {/* ═══ SPRING CLEANUP SEASON ═══ */}
      <section id="spring" style={{ background: 'var(--light-bg)' }}>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">The Thaw</span>
            <h2 className="section-title">Built for the Six Weeks That Make Your Year</h2>
            <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '14px' }}>Every Canadian scooper knows what April smells like. Yards that paused in November have five months of waste surfacing out of the snowpack, the phone rings all day, and every caller wants this week. The companies that win spring are the ones that can book, route and bill the surge without dropping their regulars.</p>
            <ul className="check-list">
              <li>One-time spring cleanups land on the job board beside recurring routes</li>
              <li>Price the big first cleanup separately from the weekly plan that follows</li>
              <li>Convert a thaw cleanup into a weekly or bi-weekly subscription in one step</li>
              <li>Winter-paused customers keep their profile and restart with a switch</li>
              <li>Day summaries show yards booked, completed and revenue as the rush builds</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Job Board &mdash; Week of April 13</div>
            <div className="mock-item">
              <div className="mock-dot orange"></div>
              <div><div className="mock-label">Spring cleanup &mdash; Tremblay</div><div className="mock-sub">One-time &middot; paused since Nov &middot; 3 dogs</div></div>
              <div className="mock-badge">New</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot orange"></div>
              <div><div className="mock-label">Spring cleanup &mdash; Chen</div><div className="mock-sub">One-time &middot; new customer &middot; 1 dog</div></div>
              <div className="mock-badge">New</div>
            </div>
            <div className="mock-item">
              <div className="mock-dot green"></div>
              <div><div className="mock-label">Weekly route &mdash; Riverbend</div><div className="mock-sub">11 yards &middot; ran all winter</div></div>
              <div className="mock-badge green">Routed</div>
            </div>
            <div className="stat-grid" style={{ marginTop: '4px' }}>
              <div className="stat-cell"><div className="stat-val">23</div><div className="stat-lbl">Cleanups Booked This Week</div></div>
              <div className="stat-cell"><div className="stat-val">9</div><div className="stat-lbl">Converted to Weekly Plans</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ROUTES BY NEIGHBOURHOOD ═══ */}
      <section id="routes">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Route Density Is the Business</span>
            <h2 className="section-title">Circle a Neighbourhood.<br />See What It&apos;s Worth.</h2>
            <p style={{ color: 'var(--muted)', fontSize: '16px', marginBottom: '14px' }}>Scooping margins live and die on drive time — five tight yards on one crescent beat eight scattered across the city. On the customer map, draw a circle around any neighbourhood and PoopBossPro totals what&apos;s inside before you commit a route to it: yards, visit frequencies, dogs, and the monthly revenue the circle represents.</p>
            <ul className="check-list">
              <li>Weekly, twice-weekly and bi-weekly stops build themselves onto route days</li>
              <li>Drag-and-drop stop ordering, live route map for every crew</li>
              <li>Circle selection totals yards, dogs and monthly recurring revenue</li>
              <li>Schedule everything in the circle at once, straight to the dispatch board</li>
              <li>Full Google mapping on Canadian streets and postal codes</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Customer Map &mdash; Circle Selection</div>
            <div className="lasso-map">
              <div className="lasso-ring"></div>
              <div className="lasso-pins">
                <div className="lpin s"></div><div className="lpin s"></div><div className="lpin u"></div>
                <div className="lpin s"></div><div className="lpin s"></div><div className="lpin s"></div>
                <div className="lpin u"></div><div className="lpin s"></div><div className="lpin s"></div>
                <div className="lpin s"></div><div className="lpin u"></div><div className="lpin s"></div>
              </div>
            </div>
            <div className="stat-grid">
              <div className="stat-cell"><div className="stat-val">12</div><div className="stat-lbl">Yards Selected</div></div>
              <div className="stat-cell"><div className="stat-val">17</div><div className="stat-lbl">Dogs</div></div>
              <div className="stat-cell full"><div className="stat-val">Weekly &middot; 7 &nbsp;|&nbsp; Bi-Weekly &middot; 4 &nbsp;|&nbsp; One-Time &middot; 1</div><div className="stat-lbl">Visit Frequency Breakdown</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CREW APP — DARK ═══ */}
      <section id="crew-app" className="dark-section">
        <div className="centered" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <span className="section-label">In the Field</span>
          <h2 className="section-title" style={{ color: '#fff' }}>Everything Your Scooper Needs,<br />Standing at the Gate</h2>
          <p className="section-sub" style={{ color: 'rgba(255,255,255,.65)' }}>The person doing the work is outside in Canadian weather with gloves on. The crew app is built for that person: today&apos;s stops in drive order, and every yard&apos;s particulars one tap away — no calling the office from the truck.</p>
        </div>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px 40px' }}>
          {[
            'Today’s stop list in route order, per scooper',
            'Gate codes and access notes shown right on the stop',
            'Dog names, dog count, and the yard’s special instructions',
            'Mark complete, skipped, or customer-not-ready with one tap',
            'Snap before-and-after photos from the yard',
            'Completed stops update the office and the customer instantly',
          ].map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'rgba(255,255,255,.82)', fontSize: '15px', lineHeight: 1.6 }}>
              <span style={{ color: 'var(--orange)', fontWeight: 800, flexShrink: 0 }}>✓</span><span>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CUSTOMER APP ═══ */}
      <section id="customer-app" style={{ background: 'var(--light-bg)' }}>
        <div className="centered" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <span className="section-label">No Contracts, So Earn the Renewal</span>
          <h2 className="section-title">Your Customers Manage Everything<br />From Their Own App</h2>
          <p className="section-sub">Scooping is a no-contract industry — customers stay because staying is easy. PoopBossPro gives every customer their own branded app, installed from a secure text link with no app store and no password to forget. The less they have to phone you about, the longer they keep the subscription.</p>
        </div>
        <div className="feat-grid" style={{ maxWidth: '1100px' }}>
          <div className="feat-card"><span className="feat-icon">📅</span><h3>See Their Visits</h3><p>Upcoming cleanups and full history — what was done, when, with the crew&apos;s notes and photos attached.</p></div>
          <div className="feat-card"><span className="feat-icon">💳</span><h3>Pay in CAD</h3><p>View and pay invoices from their phone, keep a card on file, and see every past payment — all in Canadian dollars.</p></div>
          <div className="feat-card"><span className="feat-icon">⏭️</span><h3>Skip a Week</h3><p>Going to the cottage? They skip or reschedule a visit themselves instead of calling your office at 7 a.m.</p></div>
          <div className="feat-card"><span className="feat-icon">🔔</span><h3>Alerts Their Way</h3><p>Text, email, or app notification — each customer picks which alerts they get and how they arrive.</p></div>
          <div className="feat-card"><span className="feat-icon">🐶</span><h3>Their Yard, On File</h3><p>Dogs, gate details and instructions live on their profile, so a new scooper on the route already knows the yard.</p></div>
          <div className="feat-card"><span className="feat-icon">⭐</span><h3>Reviews &amp; Referrals</h3><p>Refer-a-friend from the app, plus a Rate Us flow that routes happy customers toward your public reviews.</p></div>
        </div>
      </section>

      {/* ═══ MOST DEMOS ARE A PHONE CALL ═══ */}
      <div className="vs-band" style={{ background: '#fff' }}>
        <div className="vs-inner" style={{ textAlign: 'center' }}>
          <span className="section-label">The Difference</span>
          <h2 className="section-title">Most &ldquo;Demos&rdquo; Are a Phone Call</h2>
          <p className="section-sub" style={{ margin: '0 auto 44px' }}>
            Search for pooper scooper software and every demo button wants your name, your number,
            and a slot on a sales calendar. Ours is at the top of this page &mdash; it is already running.
          </p>
          <table className="vs-table">
            <thead>
              <tr>
                <th></th>
                <th className="sbp-col">PoopBossPro</th>
                <th className="other-col">Typical pet waste software</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>See the software</td><td className="sbp-col">Right now</td><td className="other-col">After a scheduled call</td></tr>
              <tr><td>Give your phone number</td><td className="sbp-col">Never</td><td className="other-col">Required</td></tr>
              <tr><td>Credit card for the trial</td><td className="sbp-col">Never</td><td className="other-col">Often</td></tr>
              <tr><td>Data in the demo</td><td className="sbp-col">A full company</td><td className="other-col">Empty, or a slide deck</td></tr>
              <tr><td>Crew &amp; customer apps</td><td className="sbp-col">Both, live</td><td className="other-col">Screenshots</td></tr>
              <tr><td>Sales follow-up</td><td className="sbp-col">None</td><td className="other-col">Expect it</td></tr>
            </tbody>
          </table>
          <p className="vs-note">No form stands between you and the demo above. There is nothing to fill in.</p>
        </div>
      </div>

      {/* ═══ THREE APPS / HOW IT FITS TOGETHER ═══ */}
      <section style={{ background: 'var(--light-bg)' }}>
        <div className="centered" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <span className="section-label">One Backend, Three Apps</span>
          <h2 className="section-title">Office, Crew, and Customer &mdash; Always in Sync</h2>
          <p className="section-sub">A yard your scooper marks complete shows up on the office dispatch board and in the customer&apos;s app at the same moment. The demo at the top of this page lets you switch between all three.</p>
          <div className="steps-grid">
            <div className="step-box">
              <div className="step-circle">1</div>
              <h3>The Office</h3>
              <p>Scheduling, the job board, the circle-map route builder, CAD invoicing and reports. Where you run the business from.</p>
            </div>
            <div className="step-box">
              <div className="step-circle">2</div>
              <h3>The Crew App</h3>
              <p>Today&apos;s stops in order, gate codes, dog names, photos, and one-tap complete — built for the person in the yard.</p>
            </div>
            <div className="step-box">
              <div className="step-circle">3</div>
              <h3>The Customer App</h3>
              <p>Visits, invoices, payments in CAD, skip-a-week, and alerts they choose themselves. Your brand on their phone.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing">
        <div className="centered" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <span className="section-label">Simple Pricing</span>
          <h2 className="section-title">From $49 a Month. Never Per User.</h2>
          <p className="section-sub">Three plans sized to your operation, from a solo scooper to a multi-truck crew. No add-on modules, no per-seat fees, no contract. One straight note for Canadian owners: plans are priced in US dollars and your bank converts &mdash; your customers, meanwhile, are always billed in CAD.</p>
        </div>
        {/* Same shared component the homepage and /pricing use, so this page can never quote
            different numbers than the rest of the site. */}
        <PlanCompare />
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', marginTop: '32px' }}>Prices in USD. No contracts. Cancel anytime.</p>
      </section>

      {/* ═══ FAQ ═══ */}
      <section style={{ background: 'var(--light-bg)' }}>
        <div style={{ maxWidth: '820px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center' }}>
            <span className="section-label">Canada Questions</span>
            <h2 className="section-title">The Honest Answers</h2>
          </div>
          <div style={{ marginTop: '48px' }}>
            {faqs.map(f => (
              <div key={f.q} style={{ borderBottom: '1px solid var(--border)', padding: '22px 0' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '10px' }}>{f.q}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <div className="cta-band">
        <h2>Ready Before the Next Thaw?</h2>
        <p>Set your country to Canada, connect your Stripe account, and your first invoice goes out in Canadian dollars. 14 days free, no card up front, from $49 USD/month after.</p>
        <button className="btn-primary" onClick={(e) => openTrial(e.currentTarget)}>
          Start Your 14-Day Free Trial
        </button>
      </div>

      <SignupModal />
    </>
  );
}
