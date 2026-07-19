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

export default function RoutesCrewDispatchSoftware() {
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
        <div className="hero-badge">Routes &amp; Crew Dispatch Software</div>
        <h1>Pet Waste Routes &amp; Crew Dispatch Software<br /><span>Built for How Scoopers Actually Run a Day</span></h1>
        <p>Most field service software is built for plumbers and HVAC techs. PoopBossPro is built from the ground up for pooper scooper and pet waste removal businesses &mdash; the way you build recurring yard-cleanup routes, dispatch a crew across hundreds of stops, and bill it all is completely different, and your software should be too.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
          <div className="hero-trust">No credit card required &nbsp;&middot;&nbsp; 14-day free trial &nbsp;&middot;&nbsp; <b>$79/mo</b> after</div>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">Stops</div><div className="hero-stat-lbl">Yards Routed Per Day, Not Per Hour</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly &mdash; No Add-Ons</div></div>
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
          alt="PoopBossPro pet waste removal software dashboard on laptop showing the route builder and dispatch board, with the crew mobile app on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Affordable Doesn&apos;t Mean Cheap.<br /><span>This Is Enterprise-Level Dispatch Software.</span></h2>
        <p>$79/month sounds modest. But what you&apos;re getting isn&apos;t modest at all. PoopBossPro is built to the same standard as software that costs 10 times more &mdash; the difference is we built it ourselves, for ourselves, and we don&apos;t have a sales team, investor overhead, or a $500/month add-on for every feature you actually need to run pet waste routes.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🗺️</div><h4>Route Intelligence</h4><p>Live route maps, drag-and-drop stop ordering, and geographic clustering that groups nearby yards onto the same day. Build a tight weekly cleanup loop so your crew spends time scooping &mdash; not driving across town between two houses.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🚐</div><h4>Crew Dispatch</h4><p>Assign every yard to a crew, a truck, and a day. The dispatch board shows the whole route at a glance, and your scoopers see their stops on the mobile app the moment you assign them &mdash; no morning phone calls, no paper run sheets.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💬</div><h4>Communication Suite</h4><p>Two-way SMS inbox, on-my-way texts, &quot;yard&apos;s done&quot; alerts, and payment reminders &mdash; all built in at the flat price. No Twilio account, no Mailchimp, no third-party setup to text a customer that their gate was locked.</p></div>
          <div className="premium-card"><div className="premium-card-icon">💳</div><h4>Subscription Billing</h4><p>Recurring monthly plans, card-on-file, and charge-after-cleanup all wired through Stripe. Bill every weekly and twice-weekly account automatically and see every dollar collected in one place.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Role-Based Access</h4><p>Owner, Manager, Office Staff, Scooper, and Mobile-only roles. Granular permission control so your field crew only sees their stops and your office manager can&apos;t accidentally delete a customer record.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>Mobile App for Your Crew</h4><p>Your scoopers get a mobile-optimized dashboard with their yards for the day, the gate code, the number of dogs, and any notes. Complete, skip, or reschedule and snap a finished-yard photo &mdash; all from the truck without calling the office.</p></div>
        </div>
      </div>

      {/* ROUTE BUILDER */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Route Builder</span>
            <h2 style={{color:'#fff'}}>Build a Whole Week of Cleanup Routes in Minutes, Not Hours</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>PoopBossPro&apos;s route builder is the fastest way to turn a pile of recurring yard-cleanup accounts into tight, drivable routes. Drop your stops on the map, cluster the ones that sit near each other, and assign the whole group to a crew and a day in a couple of clicks &mdash; with stop count and projected revenue calculated in real time before you commit a single yard.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>See every yard pinned on an interactive service-area map</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cluster nearby properties onto the same day automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Shows what&apos;s already scheduled vs. what&apos;s still waiting</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Assign a batch of stops to a crew and date in one click</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Drag-and-drop stop order to cut backtracking and fuel</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Handles weekly, twice-weekly, and one-time cleanups in one view</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts route-building time from an hour to under 5 minutes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Built specifically for pet waste removal &mdash; not a plumbing app</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Route Builder &mdash; Tuesday Crew</div>
            <div style={{background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'10px', padding:'20px', marginBottom:'14px', position:'relative', minHeight:'130px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden'}}>
              <div style={{position:'absolute', top:'14px', left:'18px', right:'18px', bottom:'14px', border:'2.5px dashed #f0820e', borderRadius:'14px', opacity:.7}}></div>
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
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Total Dogs</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>$686</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Route Revenue</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px'}}>
                <div style={{color:'#f0820e', fontSize:'18px', fontWeight:800}}>3.4 mi</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Total Drive</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', gridColumn:'span 2'}}>
                <div style={{color:'#fff', fontSize:'13px', fontWeight:600}}>Weekly · 9 &nbsp;|&nbsp; Twice-Weekly · 3 &nbsp;|&nbsp; One-Time · 2</div>
                <div style={{color:'rgba(255,255,255,.42)', fontSize:'11px', marginTop:'1px'}}>Breakdown by Plan Type</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Dispatch Software Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most powerful software is complicated. PoopBossPro is the exception. Every screen was designed by people who ran pet waste routes &mdash; not UX designers who&apos;ve never walked a backyard with a rake. Your crew will be using it confidently on day one.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Set Up in One Afternoon', body:'Add your plans, import your customers and yards, set up your automated texts, and connect Stripe — most owners are fully operational the same day they sign up. No implementation consultant, no onboarding call, no 90-day setup timeline.'},
            {n:'02', title:'One Screen Does Everything', body:'Scheduling, dispatch, the route map, and the day\'s job board are all connected. You\'re not jumping between five different modules or browser tabs. Pull up the dispatch board and every yard your crews are cleaning today is right there in a single view.'},
            {n:'03', title:'Your Crew Learns It in Minutes', body:'The mobile app your scoopers use shows them exactly what they need and nothing they don\'t. Their yards for the day, the gate code, the number of dogs, the notes, and the complete button. No training videos, no IT ticket, no frustrated crew members.'},
            {n:'04', title:'Automation Runs Without You', body:'Set up your on-my-way texts, yard-done alerts, and payment reminders once. After that, PoopBossPro handles every notification and every reminder automatically — whether you\'re on a route, at home, or on vacation.'},
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
          <h2 className="section-title">Generic Software Wasn&apos;t Built for Pet Waste Routes</h2>
          <p className="section-sub">Pet waste removal is not plumbing. You&apos;re not sending one tech to one job for two hours. You&apos;re running a crew through fifty backyards a day, every yard on a recurring plan, every property with its own gate code and its own number of dogs.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we were running our own routes, we tried every piece of software out there. The big names, the small names, the ones built for &quot;field service.&quot; None of them understood what it meant to have <strong>hundreds of yards on weekly plans</strong> and need to dispatch them across two crews in a way that didn&apos;t send the same truck back and forth across town.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>They don&apos;t have that. Because they weren&apos;t built by someone who runs a pet waste removal business. <strong>We were.</strong> We&apos;ve been in this industry since 2006, and PoopBossPro is the software we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in PoopBossPro exists because we needed it on a real cleanup route. Not because a product manager in a tech office decided it sounded good.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Pet Waste Removal</span>
          <h2 className="section-title">Features Designed Around Your Routes</h2>
          <p className="section-sub">Every tool in PoopBossPro was built with pet waste workflows in mind &mdash; not adapted from a plumbing app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'🔁', title:'Recurring Yard Cleanup Scheduling', body:'Put every customer on a weekly, twice-weekly, or every-other-week plan and PoopBossPro generates the visits automatically. No re-entering the same yards every week — set the plan once and the schedule builds itself.'},
            {icon:'🗺️', title:'Route Builder & Live Map', body:'See every scheduled yard pinned on an interactive map. Drag to reorder stops, cluster nearby properties, and cut drive time before your crew ever leaves the yard.'},
            {icon:'🚐', title:'Crew Dispatch Board', body:'Assign yards to crews and trucks, then see the whole day on one dispatch board. Balance stops between two crews and reassign in a click when someone calls out sick.'},
            {icon:'📋', title:'The Job Board', body:'Every cleanup for the day lands on the job board — open, in progress, completed, or skipped. Your office sees real-time status on every yard without texting the crew to ask.'},
            {icon:'🏡', title:'Property & Yard Profiles', body:'Every yard has its own record: address, gate code, number of dogs, where the cans live, service history, notes, and photos. Everything tied to the property, not just the customer.'},
            {icon:'🔑', title:'Gate Codes & Access Notes', body:'Store the gate code, lockbox combo, and &quot;beware of the friendly lab&quot; note on each yard so the assigned scooper has it on their phone before they pull up — no calling the office to get in.'},
            {icon:'🐕', title:'Number of Dogs Tracking', body:'Record how many dogs live at each property so your crew knows what they&apos;re walking into and you can price plans accurately. The dog count rides along on every visit and every route summary.'},
            {icon:'💬', title:'Automated Customer Texts', body:'Automatically text customers when their cleanup is scheduled, when the crew is on the way, and when the yard is done. Set it once — PoopBossPro handles the texts for every visit.'},
            {icon:'💰', title:'Estimates That Close', body:'Build a yard-cleanup quote in minutes with your plan catalog, email it from the platform, and let customers accept with one click. Auto-follow-ups go out if they don\'t respond.'},
            {icon:'💳', title:'Card-on-File & Monthly Billing', body:'Store cards on file via Stripe and run recurring monthly charges for every plan. Charge after cleanup or bill on a cycle — every dollar tracked in one place.'},
            {icon:'📱', title:'Mobile App for Your Crew', body:'Your scoopers get a mobile view of their yards for the day, the gate code, the dog count, and the notes. Mark visits complete, skip a locked gate, or snap a photo — right from the truck.'},
            {icon:'📸', title:'Finished-Yard Photos', body:'Crews can snap a photo of the cleaned yard at the end of each visit. Proof of service is attached to the job and visible to the office and the customer — no more &quot;did you actually come?&quot; calls.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Send and receive texts with customers right inside PoopBossPro. Full conversation history organized by contact — no more switching to your personal phone to tell someone the gate was locked.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After a completed cleanup, PoopBossPro automatically sends a Google review request to the customer — on your schedule, every time, without you lifting a finger.'},
            {icon:'🔔', title:'Skip & Lockout Handling', body:'Locked gate? Dog in the yard? Mark the visit skipped with a reason and PoopBossPro texts the customer and flags it for the office automatically — no awkward guessing about what happened.'},
            {icon:'📄', title:'Invoice Management', body:'Convert accepted quotes to invoices instantly. Filter by unpaid, partial, paid, or overdue. Every dollar tracked with full payment history, method, and date.'},
            {icon:'🏷️', title:'Discount Codes & Sales Tax', body:'Apply percentage or fixed-dollar discounts to any quote. Set sales tax rates by jurisdiction and let PoopBossPro calculate and track tax on every invoice automatically.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, Manager, Office, Scooper, and Mobile roles. Control exactly what each person on your team can see and do — from full access down to field-only.'},
            {icon:'🚛', title:'Truck Management', body:'Create truck profiles, assign vehicles to crews, and track which truck handled each yard. Know exactly what\'s rolling and who\'s on it every day.'},
            {icon:'⏱️', title:'Employee Hour Tracking', body:'Track crew hours per route and generate payroll-ready reports. Know exactly what you owe before payday without running a separate system.'},
            {icon:'📊', title:'Dashboard & Reports', body:'Custom stat cards show today\'s revenue, yards cleaned, visits completed, money owed, and more — all at a glance the moment you log in.'},
            {icon:'👥', title:'Unlimited Users', body:'Add every scooper, office staff member, and manager at no extra cost. No per-seat fees. Unlimited users are included in the flat $79/month rate.'},
            {icon:'🏢', title:'Unlimited Customers & Yards', body:'No caps on customers, properties, or leads. Whether you have 50 accounts or 5,000 — PoopBossPro handles it all at the same flat price.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCHEDULING / DISPATCH */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Crew Dispatch</span>
            <h2>See Your Whole Day Across Every Crew Before a Single Truck Leaves the Yard</h2>
            <p>The dispatch board is the daily command center for a pet waste removal business. Every scheduled yard, grouped by crew, with stop counts and the route order laid out so you know exactly who is cleaning what and in what sequence. To go deeper on how routing and dispatch fit together to run a profitable scooping operation, read <a href="/blogs/pet-waste-routes-crew-dispatch-software-guide" style={{color:'var(--orange)', fontWeight:600}}>Routes &amp; Crew Dispatch Software for Pooper Scooper Businesses: The Complete Guide</a>.</p>
            <ul className="check-list">
              <li>Dispatch board grouped by crew with stop counts</li>
              <li>Assign yards to a crew, truck, and date in one click</li>
              <li>Drag-and-drop route reordering on the map</li>
              <li>Reassign stops between crews when someone calls out</li>
              <li>Crew sees their yards instantly on the mobile app</li>
              <li>Mark visits complete, skipped, or rescheduled from the field</li>
              <li>Print run sheets for any crew</li>
              <li>Summary bar: total yards, dogs, and revenue for the day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Dispatch Board &mdash; By Crew</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew A &mdash; North Loop</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>22 yards scheduled</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>31 dogs</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew B &mdash; East Side</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>18 yards scheduled</div></div>
              <div style={{marginLeft:'auto', background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>25 dogs</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7ed957', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Crew C &mdash; Downtown</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>14 yards scheduled</div></div>
              <div style={{marginLeft:'auto', background:'#2272c3', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>17 dogs</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>One-Time Cleanups</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>4 yards scheduled</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>6 dogs</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#f0820e', fontSize:'16px', fontWeight:700}}>Know before you dispatch.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>No other pet waste software shows you this.</div>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE / CREW */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">In the Field</span>
            <h2>Everything Your Crew Needs to Clean the Yard Is Already on Their Phone</h2>
            <p>The mobile app gives every scooper their stops for the day in route order, with the gate code, the number of dogs, and the access notes for each yard. They tap complete, snap a finished-yard photo, and the office sees it in real time &mdash; no morning meeting, no run sheet, no calls to ask which gate is locked.</p>
            <ul className="check-list">
              <li>Today&apos;s yards in route order on the crew&apos;s phone</li>
              <li>Gate code, dog count, and access notes on every stop</li>
              <li>One tap to mark a yard complete, skipped, or rescheduled</li>
              <li>Snap a finished-yard photo as proof of service</li>
              <li>Skip with a reason and the customer gets texted automatically</li>
              <li>Tap-to-navigate to the next yard from any stop</li>
              <li>Works for every crew, every truck, every day</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Crew App &mdash; Tuesday Route</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>22</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Yards Today</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>14</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Completed</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>2</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Locked Gates</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>31</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Dogs on Route</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>118 Maple St &middot; Gate #4821</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>2 dogs &middot; cans on left side</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Done</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>27 Birch Ln &middot; Gate locked</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>1 dog &middot; customer texted</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Skip</div>
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
              <li>Recurring Yard Cleanup Plans</li>
              <li>Estimates, Invoices &amp; Stripe Payments</li>
              <li>Card-on-File &amp; Monthly Subscription Billing</li>
              <li>Two-Way SMS &amp; Automated Customer Texts</li>
              <li>Gate Codes, Dog Counts &amp; Yard Profiles</li>
              <li>Mobile App for Your Crew</li>
              <li>500 Outbound SMS/month included</li>
              <li>+$15 per additional 500 SMS after that</li>
            </ul>
            <button onClick={(e) => openSignupModal(2, e.currentTarget as HTMLElement)} className="price-btn price-btn-primary">Start Your 14-Day Free Trial</button>
          </div>
        </div>
        <p style={{textAlign:'center', color:'var(--muted)', fontSize:'13px', marginTop:'32px'}}>No contracts. Cancel anytime. No hidden fees &mdash; ever.</p>
      </section>

      {/* FAQ */}
      <section style={{background:'#fff'}}>
        <div style={{maxWidth:'860px', margin:'0 auto', padding:'80px 40px'}}>
          <span className="section-label">FAQ</span>
          <h2 className="section-title" style={{marginBottom:'48px'}}>Routes &amp; Crew Dispatch Software &mdash; Common Questions</h2>
          {[
            {q:'Is PoopBossPro built for pooper scooper and pet waste removal businesses?', a:'Yes. PoopBossPro handles the full operation: recurring yard-cleanup scheduling, route building, crew dispatch, the job board, gate codes and dog counts on every yard, automated customer texts, card-on-file, and monthly subscription billing. It\'s designed for companies running cleanup routes, not general service businesses.'},
            {q:'How does route building and crew dispatch work?', a:'You drop your yards on the map, cluster the nearby ones onto the same day, and assign each group to a crew, a truck, and a date. The dispatch board shows the whole day by crew, and your scoopers see their stops on the mobile app the moment you assign them — with the gate code, the number of dogs, and the notes already attached.'},
            {q:'Can I run recurring weekly and twice-weekly plans automatically?', a:'Yes. Put each customer on a weekly, twice-weekly, or every-other-week plan and PoopBossPro generates every visit automatically. You set the plan once and the schedule keeps building itself — no re-entering the same yards each week.'},
            {q:'Does it handle gate codes, dog counts, and yard notes?', a:'Yes. Every property has its own profile with the gate code, the number of dogs, where the cans live, and any access notes. All of it rides along to the assigned scooper\'s phone so they can get into the yard and clean it without calling the office.'},
            {q:'How does billing work for recurring cleanup plans?', a:'PoopBossPro stores cards on file through Stripe and runs recurring monthly charges for every plan, or charges after each cleanup if you prefer. Quotes convert to invoices in one click, and every payment is tracked with method and date in one place.'},
            {q:'How much does PoopBossPro cost?', a:'$79/month, all features included. No per-user fees, no add-ons for SMS or route tools, no setup fees. 14-day free trial with no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>PoopBossPro handles routing and crew dispatch alongside recurring scheduling, subscription billing, and customer texting &mdash; all from one platform &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full PoopBossPro platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Pet Waste Business<br />on Software Built for Plumbers.</h2>
        <p>PoopBossPro is the only routes and crew dispatch software built by someone who has actually run a pet waste removal route. Try it free for 14 days.</p>
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
