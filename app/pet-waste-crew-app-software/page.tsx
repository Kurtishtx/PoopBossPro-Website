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
          <input id={`sbp${n}-company`} type="text" placeholder="Smith Scoop Co." className="sbp-input" />
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
          <div className="sbp-trial-note-sub">Full access to every feature. $129/month after trial.</div>
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
        <div className="sbp-success-title">You&apos;re In!</div>
        <div className="sbp-success-sub">Your 14-day free trial has started.<br />Taking you to your dashboard…</div>
        <div id={`sbp${n}-countdown`} className="sbp-countdown"></div>
      </div>
    </div>
  );
}

export default function CrewMobileAppFieldTools() {
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
        <div className="hero-badge">Built for Pet Waste Removal Crews</div>
        <h1>The Crew Mobile App &amp; Field Tools<br /><span>That Run Your Scoop Routes From the Truck</span></h1>
        <p>PoopBossPro puts every stop, gate code, pet name, and skip request in your scooper&apos;s pocket. Your crew opens the app, sees their run for the day, scoops the yard, snaps photo proof, and taps complete &mdash; no phone calls to the office, no paper stop sheets, no missed yards. This is the field side of the only software built from the ground up for pet waste removal businesses.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">In Pocket</div><div className="hero-stat-lbl">Every Stop, Gate Code &amp; Pet Note</div></div>
          <div><div className="hero-stat-val">$129</div><div className="hero-stat-lbl">Flat Monthly &mdash; No Add-Ons</div></div>
          <div><div className="hero-stat-val">Photo</div><div className="hero-stat-lbl">Proof of Pickup on Every Yard</div></div>
          <div><div className="hero-stat-val">2006</div><div className="hero-stat-lbl">In the Field Service Industry Since</div></div>
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
          alt="PoopBossPro pet waste removal crew mobile app showing the day's stop list, gate codes, pet info, and photo proof of pickup on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Your Crew&apos;s Day, In Their Pocket.<br /><span>This Is the Field App Pet Waste Removal Has Been Missing.</span></h2>
        <p>$129/month sounds modest. But the crew app you&apos;re getting isn&apos;t. PoopBossPro&apos;s mobile field tools were built so a scooper can run an entire route with one thumb &mdash; stop list, GPS navigation, gate codes, pet info, photo proof, and instant skip and hold handling, all without ever calling the office. To go deeper on how it all fits together, read <a href="/blogs/crew-mobile-app-pet-waste-removal-complete-guide">The Crew Mobile App For Pet Waste Removal: A Complete Guide For Scoop Business Owners</a>.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">📱</div><h4>The Crew Stop List</h4><p>Every scooper opens the app to their run for the day, in route order. Tap a stop to see the address, the pet, the gate code, and any special notes. Complete, skip, or flag a yard &mdash; the office sees it the second it happens.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📍</div><h4>GPS Route Navigation</h4><p>One tap launches turn-by-turn directions to the next yard. Stops are ordered to cut windshield time, so your crew spends the day scooping instead of hunting for the right house on a cul-de-sac.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📸</div><h4>Photo Proof of Pickup</h4><p>Before-and-after photos snap right inside the app and attach to the stop automatically. When a customer asks &quot;did you come today?&quot; the answer is a timestamped photo of their clean yard &mdash; not an argument.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔑</div><h4>Gate Codes &amp; Pet Info on File</h4><p>The locked gate code, the dog&apos;s name, the &quot;beware the German Shepherd&quot; warning &mdash; it all lives on the stop, visible to whoever runs that yard. New crew members are productive on day one, not week three.</p></div>
          <div className="premium-card"><div className="premium-card-icon">⏱️</div><h4>Time Tracking by Stop</h4><p>The app stamps when your scooper arrives and finishes each yard. You get real time-on-property data and payroll-ready hours without a separate punch clock or a single timesheet to chase down.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔁</div><h4>Skip &amp; Hold Requests</h4><p>A customer texts &quot;skip this week&quot; and it drops straight onto the crew&apos;s app as a hold &mdash; no double-charge, no wasted trip. Vacation holds and one-time skips flow from the client portal to the truck automatically.</p></div>
        </div>
      </div>

      {/* STOP LIST HIGHLIGHT */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The In-App Stop List</span>
            <h2 style={{color:'#fff'}}>Open the App. See Every Yard You&apos;re Scooping Today.</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The stop list is the heart of the crew app. Your scooper logs in and sees the entire day laid out in route order &mdash; each yard with its address, the pet on file, the gate code, and the last visit&apos;s notes. They scoop, snap a photo, tap complete, and the next stop slides up. No clipboard, no printed sheet, no calling the office to ask &quot;which house is next?&quot;</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Today&apos;s run in route order, ready the moment the app opens</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Tap any stop for address, pet name, gate code, and notes</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Mark complete, skip, or flag a yard with one thumb</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Photo proof of pickup attaches to the stop automatically</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Skips and holds appear instantly so no one wastes a trip</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Office sees every completion in real time &mdash; no end-of-day report</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Works one-handed at the gate, even on a weak signal</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Built for scoopers &mdash; nothing on the screen they don&apos;t need</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Today&apos;s Run &mdash; Crew App</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>412 Oak Ridge Dr</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Bella (Lab) · Gate code 1847</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Done</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>88 Maple Court</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Max &amp; Cooper · Back gate, latch sticks</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Done</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(240,130,14,.4)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>1209 Birchwood Ln</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Daisy · Friendly · Photo required</div></div>
              <div style={{marginLeft:'auto', background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Next</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'rgba(255,255,255,.3)', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>57 Sycamore St</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>On vacation hold this week</div></div>
              <div style={{marginLeft:'auto', background:'rgba(255,255,255,.15)', color:'rgba(255,255,255,.7)', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Hold</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#f0820e', fontSize:'16px', fontWeight:700}}>2 of 18 yards done.</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Tap a stop to navigate, scoop, and snap proof.</div>
            </div>
          </div>
        </div>
      </section>

      {/* EASIER TO USE */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto 56px'}}>
          <span className="section-label">Simplicity</span>
          <h2 className="section-title">The Most Capable Crew App Is Also the Easiest to Learn</h2>
          <p className="section-sub" style={{maxWidth:'720px'}}>Most field apps are bloated with buttons your scooper will never tap. PoopBossPro&apos;s crew app shows them their stops, their pet notes, and a complete button &mdash; that&apos;s it. A new hire is running a full route confidently on their first morning.</p>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px', maxWidth:'1100px', margin:'0 auto'}}>
          {[
            {n:'01', title:'Hand a New Scooper a Phone', body:'No training videos, no IT ticket, no week-long ramp. A new crew member opens the app, sees their stop list with every gate code and pet note already on file, and starts scooping. The yards they don\'t know are the yards the app already knows for them.'},
            {n:'02', title:'One Screen Runs the Route', body:'Stop list, GPS navigation, gate codes, pet info, photo proof, and the complete button all live on one screen. Your crew isn\'t swiping between five tabs in a parking lot &mdash; everything they need for the next yard is right in front of them.'},
            {n:'03', title:'The Office Never Calls the Truck', body:'Skips, holds, schedule changes, and new pet notes push to the crew app the instant the office enters them. No more calling a scooper mid-route to say &quot;skip the Johnsons today.&quot; It\'s already on their list as a hold.'},
            {n:'04', title:'Proof Captures Itself', body:'Time-on-property, completion times, and photo proof of pickup are recorded automatically as your crew works. You get the full record of every yard without anyone filling out a single form at the end of the day.'},
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
          <h2 className="section-title">Paper Stop Sheets Are Costing You Yards</h2>
          <p className="section-sub">A printed route sheet can&apos;t show a gate code that changed yesterday, can&apos;t prove you scooped a yard, and can&apos;t tell your crew the Hendersons asked for a skip this week. When the field runs on paper and phone calls, yards get missed, customers get double-charged, and your office spends the day playing dispatcher.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we ran field crews ourselves, the truck was a black box. Did the yard get scooped? Was the gate locked? Did the customer&apos;s &quot;skip this week&quot; text actually make it to the scooper? You found out when the complaint came in, not before. A printed route sheet has <strong>no gate codes that update, no pet warnings, and no proof of anything.</strong></p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>So we built the crew app we always needed. Every stop, gate code, and pet note lives in the scooper&apos;s pocket. Every pickup is timestamped and photographed. Every skip and hold flows from the customer straight to the truck. <strong>We&apos;ve been in field service since 2006</strong>, and this is the field tool we always wished existed.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>Every feature in the crew app exists because we needed it on a real scoop route &mdash; not because a product manager thought it sounded good in a demo.</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Crew Mobile App &amp; Field Tools</span>
          <h2 className="section-title">Everything Your Scooper Needs, On One Phone</h2>
          <p className="section-sub">Every tool below was built around how a pet waste removal crew actually works a route &mdash; not adapted from a generic field app and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📱', title:'In-App Stop List', body:'Your scooper opens the app to the full day in route order. Each yard shows the address, pet, gate code, and notes. Complete, skip, or flag from the field &mdash; the office sees it instantly.'},
            {icon:'📍', title:'GPS Route Navigation', body:'One tap launches turn-by-turn directions to the next yard. Stops are ordered to cut drive time so your crew scoops more yards in less windshield time.'},
            {icon:'📸', title:'Photo Proof of Pickup', body:'Before-and-after photos snap inside the app and attach to the stop with a timestamp. Settle any &quot;did you come today?&quot; question with a picture, not an argument.'},
            {icon:'🔑', title:'Gate Codes on File', body:'Every gate code lives on the stop and updates the moment the office changes it. No locked-out crew, no calling the customer from the curb, no missed yard.'},
            {icon:'🐕', title:'Pet Info on Every Stop', body:'Dog names, temperament, and warnings like &quot;aggressive &mdash; call first&quot; are right there on the stop. Your crew knows what&apos;s behind the gate before they open it.'},
            {icon:'⏱️', title:'Time Tracking by Stop', body:'The app stamps arrival and completion at every yard, giving you real time-on-property and payroll-ready hours with no separate punch clock or timesheet.'},
            {icon:'🔁', title:'Skip &amp; Hold Requests', body:'Customer skips and vacation holds flow from the portal straight to the crew app. No wasted trip, no double-charge, no mid-route phone call to the scooper.'},
            {icon:'✅', title:'One-Tap Job Complete', body:'When a yard is scooped, your crew taps complete. The visit logs, the photo attaches, the customer notification fires, and the next stop slides up automatically.'},
            {icon:'🗒️', title:'Field Notes per Yard', body:'Crew can leave a note on any stop &mdash; &quot;gate latch broken,&quot; &quot;new puppy,&quot; &quot;extra heavy today.&quot; It saves to the property so the next scooper sees it too.'},
            {icon:'🚪', title:'Service Issue Flags', body:'Locked gate, dog out, can\'t access the yard &mdash; your crew taps a flag and the office is alerted in real time to reach the customer before it becomes a complaint.'},
            {icon:'📶', title:'Works on Weak Signal', body:'The crew app holds the route and queues completions when service drops in a backyard or a dead-zone neighborhood, then syncs the moment the signal comes back.'},
            {icon:'🧭', title:'Route Order on the Map', body:'See every yard for the day pinned and numbered in driving order. Your crew always knows which house is next without flipping through a paper sheet.'},
            {icon:'🔔', title:'On-My-Way Notifications', body:'When your scooper starts a yard, the customer can get an automatic &quot;we&apos;re on the way&quot; or &quot;your yard is done&quot; text &mdash; triggered straight from the field.'},
            {icon:'📋', title:'Daily Run Summary', body:'At a glance your crew sees yards done, yards remaining, holds, and flags for the day. The office sees the same live count without a single phone call.'},
            {icon:'👤', title:'Per-Crew Assignment', body:'Assign each route to a specific scooper and they only see their own stops. No scrolling past other trucks&apos; yards, no confusion about who has which run.'},
            {icon:'💬', title:'Customer Sign-Up Online', body:'New customers sign up on your site, and the new yard flows into the system ready to be routed and dropped onto a crew\'s app &mdash; no manual data entry.'},
            {icon:'🏠', title:'Client Portal Sync', body:'Skip requests, hold dates, and account changes a customer makes in the client portal push straight to the crew app, so the field always matches what the customer asked for.'},
            {icon:'⭐', title:'Review Requests After Service', body:'A completed yard can automatically trigger a review request to the happy customer &mdash; fired off the moment your crew taps complete in the field.'},
            {icon:'🔐', title:'Role-Based Field Access', body:'Mobile-only scoopers see their stops and nothing else. Owners and managers control exactly what each role can view and do, in the office and in the field.'},
            {icon:'👥', title:'Unlimited Crew Members', body:'Add every scooper and driver at no extra cost. No per-seat fees &mdash; unlimited crew on the mobile app is included in the flat $129/month rate.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PHOTO PROOF HIGHLIGHT */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Photo Proof &amp; Accountability</span>
            <h2>Proof Every Yard Was Scooped &mdash; Without Asking Your Crew for It</h2>
            <p>The single biggest source of pet waste removal disputes is &quot;you didn&apos;t come.&quot; PoopBossPro ends it. Your scooper snaps a before-and-after photo right inside the app and it attaches to the stop with a timestamp and location. When a customer questions a visit, you forward a photo of their clean yard &mdash; not a defense.</p>
            <ul className="check-list">
              <li>Before-and-after photos captured inside the crew app</li>
              <li>Timestamp and location stamped on every pickup</li>
              <li>Photos attach to the exact stop automatically</li>
              <li>Time-on-property logged with no extra taps</li>
              <li>Office sees proof in real time as the crew works</li>
              <li>Resolve any &quot;did you come?&quot; question in seconds</li>
              <li>Build trust and retention with visible, reliable service</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Proof Log &mdash; Today</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>18</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Yards Scooped</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>18</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Photos Captured</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>2</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Holds Skipped</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>1</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Gate Flagged</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>412 Oak Ridge Dr · Bella</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Photo · 9:14 AM · 6 min on yard</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Proof ✓</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>1209 Birchwood Ln · Daisy</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Photo · 9:31 AM · 5 min on yard</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Proof ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Crew App Included.</h2>
          <p className="section-sub">No per-seat fees for your scoopers, no add-on charge for the mobile app, no upsell for photo proof. The full crew app and field tools come standard with PoopBossPro.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>129</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited customers, yards, and crew members on the mobile app. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Crew Mobile App for Unlimited Scoopers</li>
              <li>In-App Stop List &amp; GPS Navigation</li>
              <li>Photo Proof of Pickup on Every Yard</li>
              <li>Gate Codes &amp; Pet Info on File</li>
              <li>Time Tracking by Stop</li>
              <li>Skip &amp; Hold Requests From the Field</li>
              <li>Online Customer Sign-Up &amp; Client Portal</li>
              <li>Automated Customer Notifications</li>
              <li>Review Requests After Service</li>
              <li>Role-Based Field Access</li>
              <li>Unlimited Customers, Yards &amp; Crew</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>The Crew Mobile App &mdash; Common Questions</h2>
          {[
            {q:'What does the crew mobile app do for a pet waste removal business?', a:'It puts the entire route in your scooper\'s pocket. They open the app to their stops for the day in route order, see the gate code and pet info for each yard, navigate by GPS, snap photo proof of pickup, and tap complete. The office sees every completion, skip, and flag in real time &mdash; no phone calls and no paper stop sheets.'},
            {q:'How does photo proof of pickup work?', a:'Your scooper snaps a before-and-after photo right inside the app and it attaches to that stop with a timestamp automatically. When a customer asks whether you came, you forward a picture of their clean yard. It ends service disputes and builds the kind of trust that keeps customers on the books.'},
            {q:'Can the app store gate codes and pet information?', a:'Yes. Every stop carries the gate code, the dog\'s name, and any warnings like &quot;aggressive &mdash; call first.&quot; It updates the instant the office changes it, so a new scooper can run an unfamiliar route on day one without getting locked out or surprised at the gate.'},
            {q:'How do skip and hold requests reach the crew?', a:'When a customer requests a skip or vacation hold &mdash; in the client portal or to your office &mdash; it drops onto the crew app as a hold automatically. Your scooper sees it on the stop list and skips that yard, so there\'s no wasted trip and no double-charge.'},
            {q:'Does it track my crew\'s time and location?', a:'The app stamps arrival and completion at each yard, giving you real time-on-property and payroll-ready hours without a separate punch clock. Photo proof carries a timestamp and location, so you always know each yard was actually serviced.'},
            {q:'How much does PoopBossPro cost?', a:'$129/month with everything included &mdash; the crew mobile app for unlimited scoopers, photo proof, GPS, time tracking, online sign-up, and the client portal. No per-seat fees and no add-ons. 14-day free trial, no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}}>{q}</h3>
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}}>{a}</p>
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>The crew app is one part of the complete pet waste removal platform &mdash; scheduling, billing, online sign-up, and the client portal all connect to it. <a href="/" style={{color:'var(--orange)', fontWeight:600}}>See the full PoopBossPro platform overview</a>, or dig into the field side with <a href="/blogs/crew-mobile-app-pet-waste-removal-complete-guide" style={{color:'var(--orange)', fontWeight:600}}>The Crew Mobile App For Pet Waste Removal: A Complete Guide For Scoop Business Owners</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Stop Running Your Crew on Paper Sheets<br />and Phone Calls to the Truck.</h2>
        <p>PoopBossPro is the only pet waste removal software with a crew mobile app built by people who have actually run scoop routes. Put every stop, gate code, and pet note in your scooper&apos;s pocket. Try it free for 14 days.</p>
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
