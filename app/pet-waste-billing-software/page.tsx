'use client';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';

const SBP_URL  = 'https://knjdbgroiyhvqwrpqzcx.supabase.co';
const SBP_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuamRiZ3JvaXlodnF3cnBxemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0OTczMDMsImV4cCI6MjA5NTA3MzMwM30.zoExtkem-XZqU86S4yJjA_xOOaS1G0IPU2M9OAAza2g';
let sbpClient: any = null;
let sbpOpenForm = 0;

function getSbpClient() {
  if (!sbpClient) sbpClient = (window as any).supabase.createClient(SBP_URL, SBP_ANON);
  return sbpClient;
}

function openSignupModal(n: number, btn: HTMLElement) {
  closeAllModals();
  sbpOpenForm = n;
  const form = document.getElementById('sbp-form-' + n)!;
  const rect = btn.getBoundingClientRect();
  const formW = Math.min(420, window.innerWidth - 24);
  const centerX = rect.left + rect.width / 2;
  let top  = rect.bottom + 12;
  let left = centerX - formW / 2;
  if (top + 460 > window.innerHeight) { top = rect.top - 460 - 12; if (top < 12) top = 12; }
  top  = Math.max(12, top);
  left = Math.max(12, Math.min(left, window.innerWidth - formW - 12));
  form.style.top  = top  + 'px';
  form.style.left = left + 'px';
  form.style.display = 'block';
  document.getElementById('sbp-backdrop')!.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeSignupModal(n: number) {
  document.getElementById('sbp-form-' + n)!.style.display = 'none';
  document.getElementById('sbp-backdrop')!.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function closeAllModals() {
  [1, 2, 3].forEach(i => {
    const el = document.getElementById('sbp-form-' + i);
    if (el) el.style.display = 'none';
  });
  const backdrop = document.getElementById('sbp-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  document.body.style.overflow = '';
  sbpOpenForm = 0;
}

function sbpStep2(n: number) {
  const err = document.getElementById(`sbp${n}-err1`)!;
  err.style.display = 'none';
  const first = (document.getElementById(`sbp${n}-first`) as HTMLInputElement).value.trim();
  const last  = (document.getElementById(`sbp${n}-last`)  as HTMLInputElement).value.trim();
  const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
  const email = (document.getElementById(`sbp${n}-email`) as HTMLInputElement).value.trim();
  if (!first || !last)                return sbpShowErr(err, 'Please enter your first and last name.');
  if (!comp)                          return sbpShowErr(err, 'Please enter your company name.');
  if (!email || !email.includes('@')) return sbpShowErr(err, 'Please enter a valid email address.');
  (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value = email;
  document.getElementById(`sbp${n}-step1`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step2`)!.style.display = 'block';
  (document.getElementById(`sbp${n}-password`) as HTMLInputElement).focus();
}

function sbpBackToStep1(n: number) {
  document.getElementById(`sbp${n}-step2`)!.style.display = 'none';
  document.getElementById(`sbp${n}-step1`)!.style.display = 'block';
  document.getElementById(`sbp${n}-err2`)!.style.display  = 'none';
}

async function sbpCreateAccount(n: number) {
  const err = document.getElementById(`sbp${n}-err2`)!;
  const btn = document.getElementById(`sbp${n}-create-btn`) as HTMLButtonElement;
  err.style.display = 'none';
  const email    = (document.getElementById(`sbp${n}-login-email`) as HTMLInputElement).value.trim();
  const password = (document.getElementById(`sbp${n}-password`)    as HTMLInputElement).value;
  const confirm  = (document.getElementById(`sbp${n}-confirm`)     as HTMLInputElement).value;
  if (password.length < 8)  return sbpShowErr(err, 'Password must be at least 8 characters.');
  if (password !== confirm)  return sbpShowErr(err, 'Passwords do not match.');
  if (!(document.getElementById(`sbp${n}-agree`) as HTMLInputElement).checked)
    return sbpShowErr(err, 'Please agree to the Terms of Service and Privacy Policy.');
  btn.disabled = true;
  btn.textContent = 'Creating your account…';
  try {
    const res = await fetch(SBP_URL + '/functions/v1/manage-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SBP_ANON, 'apikey': SBP_ANON },
      body: JSON.stringify({ action: 'create', email, password }),
    });
    const result = await res.json();
    if (result.error) throw new Error(result.error);
    const sb = getSbpClient();
    const { data: signInData, error: signInErr } = await sb.auth.signInWithPassword({ email, password });
    if (signInErr) throw new Error(signInErr.message);
    const uid   = signInData.user.id;
    const first = (document.getElementById(`sbp${n}-first`)   as HTMLInputElement).value.trim();
    const last  = (document.getElementById(`sbp${n}-last`)    as HTMLInputElement).value.trim();
    const comp  = (document.getElementById(`sbp${n}-company`) as HTMLInputElement).value.trim();
    await sb.auth.updateUser({ data: { full_name: first + ' ' + last } });
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    await sb.from('user_profiles').upsert(
      { id: uid, email, role: 'full_access', is_primary_owner: true, tenant_id: null, trial_ends_at: trialEnd },
      { onConflict: 'id' }
    );
    await sb.from('company_info').insert({ user_id: uid, company_name: comp, display_name: comp });
    const reasons = ['Cancel Maintaining Self','Cancel Sold House','Cancel Too Expensive','Cancel Unknown','Dropping Customer','Sold House']
      .map(nm => ({ name: nm, active: true, user_id: uid }));
    await sb.from('cancellation_reasons').insert(reasons);
    document.getElementById(`sbp${n}-step2`)!.style.display   = 'none';
    document.getElementById(`sbp${n}-success`)!.style.display = 'block';
    let secs = 4;
    const cd = document.getElementById(`sbp${n}-countdown`)!;
    cd.textContent = 'Redirecting in ' + secs + ' seconds…';
    const iv = setInterval(() => {
      secs--;
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.poopbosspro.com/dashboard.html'; }
      else cd.textContent = 'Redirecting in ' + secs + ' second' + (secs === 1 ? '' : 's') + '…';
    }, 1000);
  } catch (e: any) {
    sbpShowErr(err, e.message || 'Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Create My Account';
  }
}

function sbpShowErr(el: HTMLElement, msg: string) { el.textContent = msg; el.style.display = 'block'; }

function SignupForm({ n }: { n: number }) {
  return (
    <div id={`sbp-form-${n}`} className="sbp-form">
      <div className="sbp-form-header">
        <div className="sbp-form-title">Start Your 14-Day Free Trial</div>
        <div className="sbp-form-subtitle">No credit card required. Full access. Cancel anytime.</div>
        <button className="sbp-form-close" onClick={() => closeSignupModal(n)}>×</button>
      </div>
      <div id={`sbp${n}-step1`} className="sbp-form-body">
        <div id={`sbp${n}-err1`} className="sbp-err"></div>
        <div className="sbp-field-row">
          <div className="sbp-field-half">
            <label className="sbp-label">First Name</label>
            <input id={`sbp${n}-first`} type="text" placeholder="John" className="sbp-input" />
          </div>
          <div className="sbp-field-half">
            <label className="sbp-label">Last Name</label>
            <input id={`sbp${n}-last`} type="text" placeholder="Smith" className="sbp-input" />
          </div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Company Name</label>
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Pet Waste Removal" className="sbp-input" />
        </div>
        <div className="sbp-field-last">
          <label className="sbp-label">Email Address</label>
          <input id={`sbp${n}-email`} type="email" placeholder="you@yourcompany.com" className="sbp-input" />
        </div>
        <button onClick={() => sbpStep2(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Next: Create Password →
        </button>
      </div>
      <div id={`sbp${n}-step2`} className="sbp-form-body" style={{display:'none'}}>
        <div id={`sbp${n}-err2`} className="sbp-err"></div>
        <div className="sbp-trial-note">
          <div className="sbp-trial-note-title">14-Day Free Trial — No Credit Card Required</div>
          <div className="sbp-trial-note-sub">Full access to every feature. $79/month after trial.</div>
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Login Email</label>
          <input id={`sbp${n}-login-email`} type="email" readOnly className="sbp-input sbp-input-readonly" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Password</label>
          <input id={`sbp${n}-password`} type="password" placeholder="At least 8 characters" className="sbp-input" />
        </div>
        <div className="sbp-field">
          <label className="sbp-label">Confirm Password</label>
          <input id={`sbp${n}-confirm`} type="password" placeholder="Repeat password" className="sbp-input" />
        </div>
        <div className="sbp-agree-row">
          <input type="checkbox" id={`sbp${n}-agree`} className="sbp-agree-check" />
          <label htmlFor={`sbp${n}-agree`} className="sbp-agree-label">
            I agree to the{' '}
            <a href="https://poopbosspro.com/terms" target="_blank" rel="noreferrer" className="sbp-link">Terms of Service</a>
            {' '}and{' '}
            <a href="https://poopbosspro.com/privacy-policy" target="_blank" rel="noreferrer" className="sbp-link">Privacy Policy</a>
          </label>
        </div>
        <button id={`sbp${n}-create-btn`} onClick={() => sbpCreateAccount(n)} className="btn-primary" style={{width:'100%', fontSize:'15px', padding:'13px'}}>
          Create My Account
        </button>
        <button className="sbp-btn-back" onClick={() => sbpBackToStep1(n)}>← Back</button>
      </div>
      <div id={`sbp${n}-success`} className="sbp-success-panel">
        <div className="sbp-success-icon">✓</div>
        <div className="sbp-success-title">You&#39;re In!</div>
        <div className="sbp-success-sub">Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
        <div id={`sbp${n}-countdown`} className="sbp-countdown"></div>
      </div>
    </div>
  );
}

export default function PetWasteBillingSoftware() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || !sbpOpenForm) return;
      const n = sbpOpenForm;
      if (document.getElementById('sbp-form-' + n)?.style.display !== 'block') return;
      if (document.getElementById(`sbp${n}-step2`)?.style.display === 'block') sbpCreateAccount(n);
      else sbpStep2(n);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Navbar onTrialClick={(el) => openSignupModal(1, el)} />

      <div className="hero">
        <div className="hero-badge">Billing, Subscriptions &amp; Payments</div>
        <h1>Pet Waste Removal Billing Software<br /><span>Get Paid Automatically, Every Single Month</span></h1>
        <p>Pooper scooper businesses live and die by recurring revenue. PoopBossPro keeps your monthly subscriptions running on autopilot &mdash; card-on-file billing, automatic charges, payment reminders, and a clean record of every dollar collected. No more chasing checks at the door or wondering who hasn&apos;t paid for last month&apos;s yard cleanups.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Monthly</div><div className="hero-stat-lbl">Subscriptions on Autopilot</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">Card</div><div className="hero-stat-lbl">On File via Stripe</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Industry Since</div></div>
        </div>
      </div>

      {/* HERO IMAGE */}
      <div style={{background:'var(--purple-dark)', padding:'0 40px 60px', textAlign:'center'}}>
        <img
          src="/dashboard-mockup.webp"
          width={1200}
          height={800}
          fetchPriority="high"
          decoding="async"
          alt="PoopBossPro pet waste removal billing software dashboard showing monthly subscriptions, card-on-file payments, and invoice tracking, with the mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Billing for Pet Waste Removal.</span></h2>
        <p>$79/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. PoopBossPro&apos;s billing engine is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t charge a percentage of every payment or a $200/month add-on just to put cards on file.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Monthly Subscriptions</h4><p>Put every recurring yard cleanup customer on a monthly plan. PoopBossPro charges their card automatically on the same day each month so your revenue arrives without a single phone call or paper invoice.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Card on File</h4><p>Store every customer&apos;s card securely through Stripe at signup. Charge after each cleanup or on a monthly cycle &mdash; no swiping, no checks left under the mat, no awkward &quot;you still owe me&quot; conversations.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Payment Texts</h4><p>Automatic payment reminders, receipts, and declined-card alerts go out by text. Customers know exactly what they were charged for that month&apos;s scooping &mdash; and you collect without lifting a finger.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🧾</div><h4>Invoicing</h4><p>One-time gate-fee or initial-cleanup invoices, sent and paid online in seconds. Filter by unpaid, partial, paid, or overdue so you always know exactly who owes you what.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📊</div><h4>Revenue Reporting</h4><p>See monthly recurring revenue, money collected, and money owed the moment you log in. Know what your pooper scooper routes are actually bringing in &mdash; not what you guessed last week.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Office staff can run billing while field crews never see a card number. Owner, Manager, Office, and Technician roles keep your payment data locked down and your books clean.</p></div>
        </div>
      </div>

      {/* SUBSCRIPTIONS HIGHLIGHT */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Recurring Subscriptions</span>
            <h2 style={{color:'#fff'}}>Put Every Yard on a Monthly Plan and Stop Billing by Hand.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Most pet waste removal businesses are recurring by nature &mdash; once-a-week or twice-a-week yard cleanups, billed monthly. PoopBossPro turns that into true recurring revenue. Set the plan once, attach the card on file, and the software charges every customer automatically on their billing date. You wake up to deposits, not a stack of invoices to mail.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Create monthly plans for weekly, twice-weekly, or bi-weekly cleanups</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Card on file charged automatically on each customer&apos;s billing day</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tie pricing to the number of dogs and yard size on the property profile</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Pause, resume, or cancel a subscription in one click</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Prorate the first month automatically when a customer signs up mid-cycle</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Automatic receipts texted after every successful charge</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Failed-payment alerts so you catch a declined card the same day</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts hours of monthly invoicing down to zero</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Subscriptions — Billing This Month</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>312</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Active Subscriptions</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>$24,180</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Recurring / Month</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Cleanup · 2 dogs</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · Charges the 1st</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$80/mo</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Twice-Weekly · 4 dogs</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · Charges the 15th</div></div>
              <div style={{marginLeft:'auto', background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$140/mo</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bi-Weekly · 1 dog</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · Charges the 1st</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$48/mo</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#f0820e', fontSize:'16px', fontWeight:700}}>Set it once. Collect every month.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No invoices to mail. No checks to chase.</div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Billing Tool Is Also the Easiest to Run</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most billing software is built for accountants. PoopBossPro is built for pooper scooper owners who&apos;d rather be running routes than reconciling spreadsheets. Connecting Stripe and turning your customers into automatic monthly subscriptions takes one afternoon &mdash; not a 90-day rollout.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Connect Stripe in Minutes', body:'Link your Stripe account, set your monthly plan pricing, and you\'re ready to collect. No merchant-account paperwork, no separate payment processor to integrate, no consultant. Most owners are taking card-on-file payments the same day they sign up.'},
            {n:'02', title:'Billing Lives Next to the Job', body:'Payments aren\'t bolted on as an afterthought. Each customer\'s subscription, card on file, invoices, and payment history sit right on their account next to the yard cleanups they\'re billed for. One screen, the whole money picture.'},
            {n:'03', title:'Customers Pay Without Being Asked', body:'Card on file plus automatic monthly charges means your customers don\'t have to do anything. They get a clear text receipt after each charge, and you get paid on time &mdash; without the monthly round of reminder calls.'},
            {n:'04', title:'Collections Run On Their Own', body:'Set up your payment reminders and declined-card alerts once. After that, PoopBossPro chases late payments and flags failed cards automatically, so you collect what you\'re owed whether you\'re on a route or off the clock.'},
          ].map(({n, title, body}) => (
            <div key={n} style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'12px', padding:'30px 26px'}}>
              <div style={{fontSize:'40px', fontWeight:800, color:'var(--orange)', opacity:.25, lineHeight:1, marginBottom:'12px'}}>{n}</div>
              <h3 style={{fontSize:'17px', fontWeight:700, color:'var(--text)', marginBottom:'8px'}}>{title}</h3>
              <p style={{color:'var(--muted)', fontSize:'14px', lineHeight:1.6}}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* THE PROBLEM */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-title">Chasing Payments Is Killing Your Pet Waste Business</h2>
          <p className="section-sub">You don&apos;t lose money on the scooping. You lose it on the billing &mdash; the checks that never show up, the cards that expired, the customers who &quot;forgot&quot; this month. Recurring revenue only works if the collecting is automatic.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we ran our own routes, the work was the easy part. The hard part was the end of the month: figuring out who owed what, mailing invoices, waiting on checks, and re-running cards that had quietly expired. We were doing <strong>hours of billing every week</strong> just to collect money customers already agreed to pay.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>Generic invoicing apps didn&apos;t fix it. They weren&apos;t built around recurring monthly yard service with a card on file. So we built PoopBossPro&apos;s billing engine ourselves. <strong>We were the customer.</strong> We&apos;ve been in this industry since 2006.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every billing feature exists because we needed it to get paid for real pet waste removal work &mdash; not because a product manager thought it sounded nice in a demo.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Billing &amp; Payments</span>
          <h2 className="section-title">Everything You Need to Get Paid on Time</h2>
          <p className="section-sub">Every billing tool in PoopBossPro was built around recurring pet waste removal &mdash; monthly plans, cards on file, and automatic collection. New here? Start with <a href="/blogs/pet-waste-billing-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Pet Waste Removal Billing Software: The Complete Guide for Pooper Scooper Businesses</a>.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🔁', title:'Monthly Subscriptions', body:'Put recurring yard cleanup customers on monthly plans that charge their card automatically on a set billing day. True recurring revenue without mailing a single invoice.'},
            {icon:'💳', title:'Card on File', body:'Securely store every customer\'s card through Stripe at signup. Charge after service or on a monthly cycle &mdash; no checks, no swiping, no chasing anyone down.'},
            {icon:'🧾', title:'Invoice Management', body:'Send one-time invoices for initial cleanups or gate fees. Filter by unpaid, partial, paid, or overdue, with full payment history, method, and date on every record.'},
            {icon:'⚡', title:'Charge After Service', body:'Mark a yard cleanup complete and charge the card on file in the same tap. The crew finishes the job and the payment is already collected before they pull away.'},
            {icon:'💬', title:'Automatic Payment Texts', body:'Receipts, payment reminders, and declined-card alerts go out by text automatically. Customers always know what they were charged for that month\'s scooping.'},
            {icon:'🔔', title:'Failed Payment Alerts', body:'When a card declines or expires, PoopBossPro flags it the same day and texts the customer to update their card &mdash; so a bad card never costs you a month of revenue.'},
            {icon:'📅', title:'Custom Billing Dates', body:'Bill on the 1st, the 15th, or any day that fits each customer. Spread your subscriptions across the month so deposits arrive steadily instead of all at once.'},
            {icon:'🐕', title:'Per-Dog & Yard Pricing', body:'Set subscription pricing based on the number of dogs and yard size stored on the property profile. Bigger yards and more dogs bill more &mdash; automatically and consistently.'},
            {icon:'➗', title:'Automatic Proration', body:'Sign a customer up mid-month and PoopBossPro prorates the first charge automatically. No napkin math, no awkward partial-month conversations.'},
            {icon:'⏸️', title:'Pause & Resume', body:'Winter slow-down or a customer out of town? Pause a subscription in one click and resume it when cleanups start again. Billing stops and starts with the work.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any plan or invoice, and set sales tax by jurisdiction so PoopBossPro calculates and tracks tax on every charge.'},
            {icon:'📊', title:'Revenue Dashboard', body:'See monthly recurring revenue, money collected, and money owed the moment you log in. Know exactly what your pet waste routes are bringing in at a glance.'},
            {icon:'📄', title:'Estimate-to-Invoice', body:'Turn an accepted new-customer estimate into an invoice or a recurring subscription in one click. The quote you sent becomes the plan they\'re billed on.'},
            {icon:'🔐', title:'Role-Based Billing Access', body:'Office staff run billing while field crews never see card data. Owner, Manager, Office, and Technician roles keep your payment information locked down.'},
            {icon:'💵', title:'Payment History', body:'Every charge, refund, and invoice tied to the customer and the property. Pull a complete payment record for any account in seconds &mdash; no spreadsheet required.'},
            {icon:'📨', title:'Payment Follow-Up Sequences', body:'Unpaid invoices trigger automated reminder texts until they\'re settled. Collect what you\'re owed without making a single uncomfortable phone call.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CARD ON FILE HIGHLIGHT */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Card on File</span>
            <h2>Store the Card Once. Never Chase a Payment Again.</h2>
            <p>This is the feature that fixes pet waste billing. PoopBossPro stores every customer&apos;s card securely through Stripe the day they sign up. From then on you charge after each cleanup or on their monthly plan &mdash; no checks left under the mat, no &quot;I&apos;ll pay you next week,&quot; no end-of-month invoice run. The money is collected the moment the work is done.</p>
            <ul className="check-list">
              <li>Card captured securely through Stripe at signup</li>
              <li>Charge automatically on a monthly subscription cycle</li>
              <li>Or charge the card the second a cleanup is marked complete</li>
              <li>Texted receipt sent after every successful charge</li>
              <li>Declined or expired cards flagged and re-collected automatically</li>
              <li>Refund any charge in a click with full history kept</li>
              <li>Customers update their own card through a secure link</li>
              <li>You never touch or store a raw card number yourself</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Payments — Collected This Week</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>187</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Cards Charged</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>$11,420</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Collected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>3</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Cards Declined</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>$0</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Checks to Chase</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Cleanup complete · Maple St</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · Receipt texted</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Paid $20</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Card declined · Oak Ave</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Update link texted to customer</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Retrying</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Billing Included.</h2>
          <p className="section-sub">We were paying $500–$700 a month for software that still charged extra to put a card on file. We built PoopBossPro to be the pricing we always wished existed &mdash; billing and payments built in, no percentage skimmed off the top.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>79</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited customers, properties, employees, and users. No tiers, no locked features, no per-transaction fees from us.</div>
            <ul className="price-features">
              <li>Unlimited Customers, Properties &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Monthly Subscriptions &amp; Recurring Billing</li>
              <li>Card-on-File Payments via Stripe</li>
              <li>Invoicing &amp; Charge-After-Service</li>
              <li>Automatic Payment Texts &amp; Reminders</li>
              <li>Failed-Card Alerts &amp; Auto-Retry</li>
              <li>Discount Codes &amp; Sales Tax</li>
              <li>Revenue Dashboard &amp; Reports</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees — ever. (Standard Stripe processing rates apply on payments.)</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Billing &amp; Payments — Common Questions</h2>
          {[
            {q:'Does PoopBossPro handle recurring monthly subscriptions?', a:'Yes. That\'s the core of it. You put each recurring yard cleanup customer on a monthly plan with a card on file, and PoopBossPro charges that card automatically on their billing day every month. Weekly, twice-weekly, and bi-weekly cleanups all become true recurring revenue with no manual invoicing.'},
            {q:'How does card-on-file billing work?', a:'You capture the customer\'s card securely through Stripe when they sign up. From then on you can charge it automatically on their monthly subscription, or charge it the moment a cleanup is marked complete. You never store a raw card number yourself, and customers can update their own card through a secure link.'},
            {q:'What happens when a card is declined or expires?', a:'PoopBossPro flags the failed payment the same day, automatically retries the charge, and texts the customer a secure link to update their card. A bad card gets caught and fixed instead of quietly costing you a full month of revenue.'},
            {q:'Can I price subscriptions by the number of dogs or yard size?', a:'Yes. Each property profile stores the number of dogs and the yard size, so you can set subscription pricing that reflects how much work the yard actually takes. Bigger yards and more dogs bill more, automatically and consistently across every customer.'},
            {q:'Can I send one-time invoices too?', a:'Yes. Alongside recurring subscriptions you can send one-time invoices for initial cleanups, gate fees, or extra visits. Filter invoices by unpaid, partial, paid, or overdue, and let automated reminder texts collect anything that goes past due.'},
            {q:'How much does PoopBossPro cost?', a:'$79/month, all features included &mdash; subscriptions, card-on-file payments, invoicing, and automated payment texts. No per-transaction fee from us and no add-on to enable billing. Standard Stripe processing rates apply on the payments themselves. 14-day free trial, no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>Billing is just one piece of how <a href="/" style={{color:'var(--orange)', fontWeight:600}}>PoopBossPro</a> runs your pooper scooper business &mdash; scheduling, routing, dispatch, and customer texts all live in the same platform.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Chasing Checks.<br />Put Your Pet Waste Billing on Autopilot.</h2>
        <p>PoopBossPro is billing built for pooper scooper businesses &mdash; monthly subscriptions, card on file, and automatic collection, all from one platform. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
