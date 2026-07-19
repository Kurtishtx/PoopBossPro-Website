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
      if (secs <= 0) { clearInterval(iv); window.location.href = 'https://my.poopbosspro.com/dashboard.html' + (typeof signInData!=='undefined'&&signInData&&signInData.session?'#access_token='+encodeURIComponent(signInData.session.access_token)+'&refresh_token='+encodeURIComponent(signInData.session.refresh_token):''); }
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

export default function PetWasteRemovalSoftware() {
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
        <div className="hero-badge">Built Specifically for Pet Waste Removal</div>
        <h1>Pet Waste Removal Software<br /><span>Built for How You Actually Scoop</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. PoopBossPro is built from the ground up for pooper scooper businesses &mdash; the way you schedule recurring yard cleanups, build routes, dispatch your crew, and bill monthly subscriptions is completely different, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Yards</div><div className="hero-stat-lbl">Stops Waiting Per Day</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">500+</div><div className="hero-stat-lbl">SMS Alerts Included Monthly</div></div>
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
          alt="PoopBossPro pet waste removal software dashboard on laptop showing the route map and stop list, with mobile app on phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Pet Waste Removal Software.</span></h2>
        <p>$79/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. PoopBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🗺️</div><h4>Route Intelligence</h4><p>Live route maps, drag-and-drop stop ordering, geographic clustering, and a waiting list that shows you every yard due for a cleanup before you schedule a single stop. No other pet waste removal software has this.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Recurring Subscriptions</h4><p>Weekly, twice-weekly, and bi-weekly yard cleanups set up once and recur forever. Monthly subscription billing runs on autopilot so your customers stay scheduled and your revenue is predictable.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, 10+ automated alert types, &quot;we&apos;re on the way&quot; texts, payment reminders, review requests &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Stripe Payments</h4><p>Card-on-file, monthly subscription charges, invoicing, payment tracking, overdue reports &mdash; the full Stripe integration is wired in. Charge every yard automatically and see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Scooper, and Mobile-only roles. Granular permission control so your field crew only sees the stops they need and your office manager can&apos;t accidentally delete a customer record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your scoopers get a mobile-optimized dashboard with their stops for the day, gate codes, dog counts, and yard notes. Complete, skip, or reschedule each yard right from the truck without calling the office once.</p></div>
        </div>
      </div>

      {/* LASSO */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Lasso — Circle Map Scheduling</span>
            <h2 style={{color:'#fff'}}>Draw a Circle on the Map. See Every Yard Inside It.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>Lasso is the fastest way to build a scooping route we&apos;ve ever seen. Draw a circle on your service area map and PoopBossPro instantly surfaces every yard inside that radius that&apos;s due for a cleanup &mdash; with stop count, service frequency, and revenue all calculated in real time before you commit to a single schedule.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Draw any size circle on the map — instantly see all yards inside</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Breaks out stops, service frequency, and revenue automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows you what&apos;s already scheduled vs. what&apos;s still waiting</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>One click to schedule all selected yards to a date and crew</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tighten your routes geographically — no more scattered stops burning fuel</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Works across every cleanup frequency at once in one view</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts route-building time from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>No competitor has this. It doesn&apos;t exist anywhere else in pet waste removal software.</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Lasso — Route Selector</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #f0820e', borderRadius:'50%', opacity:.7}}></div>
              <div style={{display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', position:'relative', zIndex:1}}>
                {['s','s','u','s','s','s','u','s','s','u','s','s','s','u','s','s','s','u','s'].map((t,i) => (
                  <div key={i} style={{width:'11px', height:'11px', borderRadius:'50%', flexShrink:0, background: t==='s' ? '#f0820e' : 'rgba(255,255,255,.2)', boxShadow: t==='s' ? '0 0 0 3px rgba(240,130,14,.3)' : 'none'}}></div>
                ))}
              </div>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>14</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Yards Selected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>19</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Total Stops</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>27</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Dogs on Route</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>$420</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Route Revenue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Weekly · 8 &nbsp;|&nbsp; Twice-Weekly · 4 &nbsp;|&nbsp; Bi-Weekly · 2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Cleanup Frequency</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Pet Waste Removal Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. PoopBossPro is the exception. Every screen was designed by people who ran scooping routes &mdash; not UX designers who&apos;ve never opened a backyard gate. Your team will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your cleanup plans, import your customers and yards, set up your automated alerts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Scheduling, dispatch, waiting list, and route map are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the dispatch board and every yard you need for the day is right there in a single view.'},
            {n:'03', title:'Your Scoopers Learn It in Minutes', body:'The mobile app your crew uses shows them exactly what they need and nothing they don\'t. Their stops for the day, the gate code, the number of dogs, the yard notes, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your SMS alerts, recurring schedules, and payment reminders once. After that, PoopBossPro handles every notification, every monthly charge, and every review request automatically — whether you\'re on a route, at home, or on vacation.'},
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Pet Waste Removal</h2>
          <p className="section-sub">Scooping yards is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re managing hundreds of yards, recurring weekly and bi-weekly schedules, gate codes, dog counts, and a waiting list of new customers that never stops growing.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own scooping routes, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to run <strong>800 recurring yards</strong> and need to know exactly which gate codes, how many dogs, and which stops were due before you sent a single truck out the door.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a pet waste removal business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and PoopBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in PoopBossPro exists because we needed it on a real scooping route. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Pet Waste Removal</span>
          <h2 className="section-title">Features Designed Around Your Operation</h2>
          <p className="section-sub">Every tool in PoopBossPro was built with pet waste removal workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📋', title:'New-Customer Waiting List', body:'Before you schedule a single stop, PoopBossPro shows you every new yard waiting to be added to a route, grouped by area and cleanup frequency. Know exactly how many weekly, twice-weekly, and bi-weekly stops you can fit before you make a single call.'},
            {icon:'🗺️', title:'Live Route Map', body:'See every scheduled yard pinned on an interactive map. Drag to reorder stops, build tight geographic routes, and cut drive time before your crew ever leaves the yard.'},
            {icon:'🔁', title:'Recurring Cleanup Scheduling', body:'Set a yard to weekly, twice-weekly, bi-weekly, or any custom cadence once and PoopBossPro recreates the stop on schedule forever. Never manually rebuild a recurring route again.'},
            {icon:'🏷️', title:'Monthly Subscription Plans', body:'Build flat monthly subscription plans for your recurring yards, assign customers to them, and let PoopBossPro bill the card on file every month automatically. Predictable revenue without chasing payments.'},
            {icon:'💬', title:'Automated Service Alerts', body:'Automatically text customers when their cleanup is scheduled, when your scooper is on the way, and when the yard is done. Set it once — PoopBossPro handles the communication for every single stop.'},
            {icon:'💰', title:'Estimates That Close', body:'Build a pet waste removal quote in minutes from your service catalog, email it directly from the platform, and let customers accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'💳', title:'Card-on-File Billing', body:'Store cards on file via Stripe. Run monthly subscription charges, send invoices, and collect payments without chasing anyone down. Every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Scoopers', body:'Your crew gets a mobile-optimized view of their stops for the day, complete with gate codes, dog counts, and yard notes. Mark yards complete, skip, or reschedule — right from the truck without calling the office.'},
            {icon:'🏠', title:'Yard & Property Profiles', body:'Every yard has its own record — gate code, number of dogs, access notes, service history, GPS coordinates, and photos. Everything tied to the property, not just the customer.'},
            {icon:'🔑', title:'Gate Codes & Access Notes', body:'Store the gate code, lock combo, side-gate location, and any access instructions on each yard profile. Your scooper sees exactly how to get into the backyard before they pull up to the curb.'},
            {icon:'🐕', title:'Dog Count Tracking', body:'Record how many dogs live at each yard so your crew knows what to expect and you can price recurring service accurately. The dog count travels with the stop straight to the mobile app.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive text messages with customers directly inside PoopBossPro. Full conversation history organized by contact — no more switching to your personal phone.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After every completed cleanup, PoopBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔁', title:'Estimate Follow-Up Sequences', body:'3 automated follow-up texts go out if a customer doesn\'t respond to your quote. Let PoopBossPro chase the deal so you don\'t have to.'},
            {icon:'💳', title:'Payment Follow-Up Sequences', body:'Unpaid invoices and failed subscription charges trigger automated payment reminder texts. Collect what you\'re owed without making uncomfortable calls.'},
            {icon:'👥', title:'Customer & Lead Management', body:'Manage existing customers and active prospects side by side. Track estimates, service history, and notes all tied to each contact — with a full searchable database.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted estimates to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🎟️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any estimate or subscription. Set sales tax rates by jurisdiction and let PoopBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Scooper, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck & Crew Management', body:'Create truck profiles, assign vehicles to routes, and track which crew handled each yard. Know exactly who covered every stop every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track scooper hours per route and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards on your dashboard show today\'s revenue, yards completed, stops served, money owed, and more — all at a glance the moment you log in.'},
            {icon:'🔔', title:'10+ Automated Alert Types', body:'Cleanup scheduled, completed, skipped, rescheduled, estimate sent, estimate accepted, review request, payment declined, inbound text — all automated, all customizable.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every scooper, office staff member, and crew lead at no extra cost. No per-seat fees. Unlimited users are included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Customers & Yards', body:'No caps on customers, yards, or leads. Whether you have 50 accounts or 5,000 — PoopBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEDULING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Recurring Cleanup Scheduling</span>
            <h2>Know Exactly Which Yards Are Due Before You Send a Single Truck</h2>
            <p>This is the feature no other pet waste removal software has. PoopBossPro&apos;s waiting list doesn&apos;t just show you which yards need a cleanup &mdash; it groups them by area and frequency so you know exactly how many stops you can fit in a day before you start building routes. For a closer look at how recurring scheduling and the waiting list run as the daily operational hub of a pooper scooper business, read <a href="/blogs/pet-waste-removal-software-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>Pet Waste Removal Software: The Complete Guide for Pooper Scooper Businesses</a>.</p>
            <ul className="check-list">
              <li>Waiting list grouped by area and cleanup frequency</li>
              <li>Schedule directly from the waiting list in one click</li>
              <li>Assign date, scooper, and truck at scheduling time</li>
              <li>Full dispatch board for the day&apos;s scheduled yards</li>
              <li>Drag-and-drop route reordering on the map</li>
              <li>Mark yards complete, skipped, or rescheduled from the field</li>
              <li>Print dispatch sheets for drivers with gate codes</li>
              <li>Summary bar: total stops, dogs, revenue for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Waiting List — By Frequency</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Cleanup</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>47 yards waiting</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>47 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Twice-Weekly Cleanup</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>31 yards waiting</div></div>
              <div style={{marginLeft:'auto', background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>62 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7ed957', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bi-Weekly Cleanup</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>22 yards waiting</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>22 stops</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>One-Time Initial Cleanup</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>15 yards waiting</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>15 stops</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#f0820e', fontSize:'16px', fontWeight:700}}>Know before you dial.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No other pet waste removal software shows you this.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION BILLING */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Billing</span>
            <h2>Monthly Subscription Billing Built for Recurring Yards</h2>
            <p>Recurring pet waste removal lives and dies on predictable billing. PoopBossPro makes it automatic &mdash; every recurring yard is tied to a monthly subscription plan, the card on file is charged on schedule, and you can see every payment, failure, and retry in one place without ever opening a spreadsheet.</p>
            <ul className="check-list">
              <li>Flat monthly subscription plans per cleanup frequency</li>
              <li>Card-on-file charged automatically every month via Stripe</li>
              <li>Failed-payment retries and automated reminder texts</li>
              <li>Track active, paused, and canceled subscriptions</li>
              <li>One-time charges for initial cleanups layered on top</li>
              <li>Filter billing reports by status, customer, or date range</li>
              <li>Every dollar collected tracked against the right yard</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Subscriptions — June 2026</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>218</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Active Plans</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>134</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Yards Billed</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>$19.4K</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Collected</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>3</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Retries Pending</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Weekly Plan · 1209 Oak St</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>J. Smith · Gate code 4471 · 2 dogs</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$89/mo</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Twice-Weekly · 88 Maple Ave</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>M. Torres · Side gate · 3 dogs</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>$149/mo</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Everything Included.</h2>
          <p className="section-sub">We were paying $500&ndash;$700 a month for software that nickel-and-dimed us. We built PoopBossPro to be the pricing we always wished existed.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>79</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited customers, yards, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Customers, Yards &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Full Scheduling, Dispatch &amp; Route Map</li>
              <li>Recurring Cleanups &amp; Waiting List</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Monthly Subscription Billing &amp; Card-on-File</li>
              <li>Gate Codes, Dog Counts &amp; Yard Profiles</li>
              <li>Mobile App for Scoopers</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees — ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Pet Waste Removal Software — Common Questions</h2>
          {[
            {q:'Is PoopBossPro built for pet waste removal businesses?', a:'Yes. PoopBossPro handles the full pooper scooper operation: recurring yard cleanup scheduling, route building, crew dispatch, monthly subscription billing, card-on-file payments, automated customer SMS, and yard profiles with gate codes and dog counts. It\'s designed for companies running scooping routes, not general service businesses.'},
            {q:'Can I manage weekly, twice-weekly, and bi-weekly cleanups in one platform?', a:'Yes. PoopBossPro supports any cleanup frequency from one account, with a waiting list grouped by frequency. You can run weekly, twice-weekly, bi-weekly, and one-time initial cleanups simultaneously with frequency-specific SMS alerts and independent pricing.'},
            {q:'How does route building work for a scooping route?', a:'You open the circle-map lasso tool, draw a circle around a geographic area, and every yard due inside is selected and added to your route. Stop count and estimated revenue update in real time. Route planning that takes 30 minutes in a spreadsheet takes 5 minutes on the map — and gate codes and dog counts ride along to the mobile app.'},
            {q:'Does PoopBossPro handle monthly subscription billing?', a:'Yes. Every recurring yard is tied to a flat monthly subscription plan, and the card on file is charged automatically each month through Stripe. Failed payments trigger automatic retries and reminder texts, so your recurring revenue stays predictable without manual invoicing.'},
            {q:'Does it replace spreadsheets and scheduling apps?', a:'Yes. PoopBossPro replaces spreadsheet scheduling, route planning, customer tracking, subscription billing, and SMS communication tools in one platform. Most owners are fully operational the same day they sign up — no onboarding consultant, no implementation timeline.'},
            {q:'How much does PoopBossPro cost?', a:'$79/month, all features included. No per-user fees, no add-ons for SMS or route tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>PoopBossPro runs your entire pet waste removal operation &mdash; recurring scheduling, routing, dispatch, subscription billing, and customer texts &mdash; all from one platform. Back to <a href="/" style={{color:'var(--orange)', fontWeight:600}}>PoopBossPro</a> for the full platform overview.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Pet Waste Removal Business<br />on Software Built for Plumbers.</h2>
        <p>PoopBossPro is the only pet waste removal management software built by someone who has actually run a scooping route. Try it free for 14 days.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(3, e.currentTarget as HTMLElement); }} className="btn-primary" style={{fontSize:'17px', padding:'18px 44px'}}>Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
      </div>

      <div id="sbp-backdrop" className="sbp-backdrop" onClick={() => closeAllModals()}></div>
      <SignupForm n={1} />
      <SignupForm n={2} />
      <SignupForm n={3} />
    </>
  );
}
