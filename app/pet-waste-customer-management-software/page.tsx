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

export default function PetWasteCustomerManagementSoftware() {
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
        <div className="hero-badge">Customer Management &amp; Client Portal</div>
        <h1>Pet Waste Customer Management Software<br /><span>Every Client, Every Yard, In One Place</span></h1>
        <p>Running a pooper scooper route means keeping track of gate codes, dog names, pickup days, billing, and a hundred little requests. PoopBossPro pulls all of it into one customer record — and gives your clients a portal to sign up, pay, and request a skip without ever calling you. This is the customer-management hub for pet waste removal businesses.</p>
        <div className="hero-btns">
          <a href="#" onClick={(e) => { e.preventDefault(); openSignupModal(1, e.currentTarget as HTMLElement); }} className="btn-primary">Start Your 14-Day Free Trial</a>
        </div>
        <div className="hero-stats">
          <div><div className="hero-stat-val">1 Record</div><div className="hero-stat-lbl">Every Client &amp; Yard In One Place</div></div>
          <div><div className="hero-stat-val">$79</div><div className="hero-stat-lbl">Flat Monthly — No Add-Ons</div></div>
          <div><div className="hero-stat-val">24/7</div><div className="hero-stat-lbl">Self-Serve Client Portal</div></div>
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
          alt="PoopBossPro pet waste removal software showing a customer record with gate code, dog info, pickup schedule, and the client portal on a phone"
          style={{maxWidth:'1100px', width:'100%', borderRadius:'16px', boxShadow:'0 32px 80px rgba(0,0,0,.5)', display:'block', margin:'0 auto'}}
        />
      </div>

      {/* PREMIUM BAND */}
      <div className="premium-band">
        <h2>Your Customer List Is Your Business.<br /><span>Stop Running It Out of a Notebook.</span></h2>
        <p>Most pet waste removal companies grow on sticky notes, group texts, and a spreadsheet that only the owner understands. PoopBossPro replaces all of it with a real customer database &mdash; built for the way scooping routes actually run. Gate codes, dog details, pickup frequency, billing, photos, and every request a client has ever made, all attached to one record your whole crew can see.</p>
        <div className="premium-grid">
          <div className="premium-card"><div className="premium-card-icon">🐾</div><h4>Pet &amp; Gate Info On File</h4><p>Dog names, breed, temperament, gate codes, and exactly where the latch is &mdash; all saved to the customer record so any scooper can service the yard without a single phone call to the office.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📝</div><h4>Online Customer Signup</h4><p>A branded signup page lets new clients enter their address, pickup frequency, and pet details in two minutes. The account is created automatically and lands on your waiting list ready to schedule.</p></div>
          <div className="premium-card"><div className="premium-card-icon">🔐</div><h4>Self-Serve Client Portal</h4><p>Clients log in to update their address, see upcoming pickups, view photo proof, pay an invoice, or request a skip &mdash; without tying up your phone or your inbox.</p></div>
          <div className="premium-card"><div className="premium-card-icon">📸</div><h4>Photo Proof Of Pickup</h4><p>Every completed yard gets a timestamped photo from the crew app, attached to the customer record and visible in the client portal. Disputes end before they start.</p></div>
          <div className="premium-card"><div className="premium-card-icon">⏸️</div><h4>Skip &amp; Hold Requests</h4><p>Going out of town? Clients submit a skip or vacation hold right from the portal. It updates the route automatically so your crew never shows up to a yard that asked for a break.</p></div>
          <div className="premium-card"><div className="premium-card-icon">⭐</div><h4>Retention &amp; Reviews</h4><p>Automated check-ins, win-back texts for paused accounts, and review requests after a clean pickup &mdash; all tied to the customer record so you keep the yards you already earned.</p></div>
        </div>
      </div>

      {/* THE PROBLEM */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">The Problem</span>
          <h2 className="section-title">A Scooping Route Lives And Dies On Customer Details</h2>
          <p className="section-sub">You can have the best crew in town, but if the gate code is wrong, the dog is loose, or the client thinks they paused service last week, the day falls apart. Pet waste removal is a details business &mdash; and details belong in software, not in someone&apos;s head.</p>
        </div>
        <div style={{maxWidth:'900px', margin:'0 auto'}}>
          <div style={{background:'#fff', border:'1.5px solid var(--border)', borderRadius:'14px', padding:'36px 40px', borderLeft:'5px solid var(--orange)'}}>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>When we ran our own routes, the worst days weren&apos;t the cold ones &mdash; they were the days a scooper got to a yard and the <strong>gate code had changed</strong>, the dog was out, or the client swore they&apos;d asked for a hold that never made it onto the schedule. Every one of those was a customer-management failure, not a labor problem.</p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8, marginBottom:'16px'}}>We built PoopBossPro so every yard carries its own record: the gate code, the dog&apos;s name and temperament, the pickup frequency, the billing, and every request the client has ever made. <strong>Your crew sees it in the app. Your client sees their side in the portal.</strong></p>
            <p style={{fontSize:'17px', color:'var(--text)', lineHeight:1.8}}>When the customer record is the single source of truth, the office stops fielding the same five questions all day &mdash; and the route just runs.</p>
          </div>
        </div>
      </section>

      {/* CLIENT PORTAL HIGHLIGHT */}
      <section className="dark-section">
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">Client Portal</span>
            <h2 style={{color:'#fff'}}>Give Clients A Login &mdash; And Get Your Phone Back</h2>
            <p style={{color:'rgba(255,255,255,.65)'}}>The client portal is where customer management stops being your job and starts running itself. Every client gets a secure login to manage their own account &mdash; pay an invoice, see their next pickup, view photo proof, update their address, or request a skip. The work that used to interrupt your route now happens without you.</p>
            <ul className="check-list" style={{marginTop:'20px'}}>
              <li style={{color:'rgba(255,255,255,.75)'}}>Clients view their upcoming pickup days and service history</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Photo proof of every completed yard, right in the portal</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Pay an outstanding invoice with a card on file in seconds</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Submit a skip or vacation hold without calling the office</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Update gate codes, pet info, and address themselves</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Every portal change syncs straight to the customer record</li>
              <li style={{color:'rgba(255,255,255,.75)'}}>Cuts inbound calls and texts so your crew stays on the route</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px'}}>Client Portal — The Henderson Account</div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Next Pickup</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Thursday · Twice-Weekly Plan</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Scheduled</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Last Visit — Photo Proof</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Mon 9:14 AM · Back yard cleared</div></div>
              <div style={{marginLeft:'auto', background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>View</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#7ed957', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Balance Due</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Card on file · ending 4421</div></div>
              <div style={{marginLeft:'auto', background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Pay $48</div>
            </div>
            <div style={{marginTop:'16px', background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'14px 16px', textAlign:'center'}}>
              <div style={{color:'#f0820e', fontSize:'16px', fontWeight:700}}>Request a Skip</div>
              <div style={{color:'rgba(255,255,255,.45)', fontSize:'12px', marginTop:'4px'}}>Handled in the portal — never on your phone.</div>
            </div>
          </div>
        </div>
      </section>

      {/* CUSTOMER RECORD HIGHLIGHT */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="highlight-row">
          <div className="highlight-text">
            <span className="section-label">The Customer Record</span>
            <h2>Everything About A Yard, Attached To One Account</h2>
            <p>This is the heart of customer management for a pet waste removal business: a single record that holds the dog&apos;s name, the gate code, the pickup frequency, the billing method, and every note your crew has ever left. Any scooper can open the stop in the mobile app and know exactly how to service that yard. To see how all of these pieces fit together start to finish, read <a href="/blogs/pet-waste-removal-customer-management-software-guide" style={{color:'var(--orange)', fontWeight:600}}>Customer Management Software For Pet Waste Removal Businesses: The Complete Guide</a>.</p>
            <ul className="check-list">
              <li>Dog names, breed, temperament, and special handling notes</li>
              <li>Gate codes and exactly where the gate &amp; latch are</li>
              <li>Pickup frequency: weekly, twice-weekly, or custom plan</li>
              <li>Card on file, billing history, and outstanding balance</li>
              <li>Full timeline of skips, holds, and client requests</li>
              <li>Photo proof from every completed pickup</li>
              <li>GPS pin and address notes so new crew never get lost</li>
              <li>Searchable database of every client and prospect</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Customer Record — Garcia Residence</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>2</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Dogs On File</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>2x</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Per Week</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>#4417</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Gate Code</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>14 mo</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Client Since</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Bella &amp; Rocky · Friendly</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Latch on left side of side gate</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Pets</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Hold Requested · Jun 28&ndash;Jul 5</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Submitted via client portal</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Vacation</div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="centered" style={{maxWidth:'1200px', margin:'0 auto'}}>
          <span className="section-label">Built for Pet Waste Removal</span>
          <h2 className="section-title">Customer Management Tools Made For Scooping Routes</h2>
          <p className="section-sub">Every tool below was built around the way pet waste removal companies sign up, service, bill, and keep their clients &mdash; not borrowed from a generic CRM and called good enough.</p>
        </div>
        <div className="feature-grid">
          {[
            {icon:'📝', title:'Online Customer Signup', body:'A branded signup page collects address, pickup frequency, pet details, and a card on file. New clients self-onboard in minutes and drop onto your waiting list ready to schedule.'},
            {icon:'🔐', title:'Self-Serve Client Portal', body:'Every client gets a secure login to pay, view pickups, see photo proof, update info, and request skips &mdash; cutting the calls and texts that interrupt your route all day.'},
            {icon:'🐾', title:'Pet &amp; Gate Info On File', body:'Dog names, temperament, gate codes, and latch locations live on the customer record so any scooper can service the yard right the first time.'},
            {icon:'📸', title:'Photo Proof Of Pickup', body:'Crews snap a timestamped photo of every cleared yard from the mobile app. It attaches to the record and shows in the client portal &mdash; ending disputes instantly.'},
            {icon:'⏸️', title:'Skip &amp; Hold Requests', body:'Clients submit a vacation hold or one-time skip from the portal. The route updates automatically so crews never roll up to a paused yard.'},
            {icon:'📋', title:'Searchable Client Database', body:'Find any client by name, address, dog, or status in seconds. Active accounts, prospects, and paused clients all live in one searchable list.'},
            {icon:'📜', title:'Full Service History', body:'Every pickup, skip, hold, payment, and note is timestamped on the record. Pull up an account and see the entire relationship at a glance.'},
            {icon:'💳', title:'Card-On-File Billing', body:'Store a card via Stripe at signup and charge automatically on each client&apos;s plan. No chasing checks, no awkward collection calls.'},
            {icon:'💬', title:'Two-Way SMS Inbox', body:'Text clients about a gate that was locked or a missed pickup, with the full conversation saved to their record. No more using your personal phone.'},
            {icon:'🔔', title:'Automated Client Alerts', body:'Auto-text customers when a pickup is scheduled, when the scooper is on the way, and when the yard is done &mdash; tied to each customer record.'},
            {icon:'⭐', title:'Automated Review Requests', body:'After a clean pickup, PoopBossPro automatically asks happy clients for a Google review &mdash; on your schedule, without you lifting a finger.'},
            {icon:'🔁', title:'Retention &amp; Win-Back', body:'Paused accounts trigger automated check-ins and win-back texts so the yards you already earned don&apos;t quietly disappear off your route.'},
            {icon:'📱', title:'Crew Mobile App', body:'Scoopers open each stop and see the gate code, pet notes, and pickup instructions, then mark the yard complete with a photo &mdash; no calls to the office.'},
            {icon:'📍', title:'GPS &amp; Address Notes', body:'A pin and address notes on every record mean a brand-new scooper finds the side gate without calling you for directions.'},
            {icon:'📄', title:'Invoice Management', body:'Auto-generate invoices from each plan, filter by paid, unpaid, or overdue, and track every dollar with full payment history per client.'},
            {icon:'👑', title:'Role-Based Access', body:'Owner, office, and crew roles control exactly what each person sees. Field scoopers see the stop info they need and nothing they don&apos;t.'},
          ].map(({icon, title, body}) => (
            <div key={title} className="feature-card">
              <span className="feature-icon">{icon}</span>
              <h3 dangerouslySetInnerHTML={{__html: title}} />
              <p dangerouslySetInnerHTML={{__html: body}} />
            </div>
          ))}
        </div>
      </section>

      {/* RETENTION HIGHLIGHT */}
      <section>
        <div className="highlight-row reverse">
          <div className="highlight-text">
            <span className="section-label">Retention &amp; Reviews</span>
            <h2>Keep The Yards You Already Earned</h2>
            <p>In pet waste removal, the cheapest customer to win is the one you already have. PoopBossPro turns your customer record into a retention engine &mdash; flagging at-risk accounts, automatically following up on holds, and asking your happiest clients for reviews after a clean pickup.</p>
            <ul className="check-list">
              <li>Win-back texts go out automatically when an account pauses</li>
              <li>Holds get a reminder before service quietly drops off</li>
              <li>Review requests fire after a completed, photo-verified pickup</li>
              <li>At-risk flags surface clients who keep skipping</li>
              <li>Full request history shows you why a yard churns</li>
              <li>Reactivation is one click from the customer record</li>
            </ul>
          </div>
          <div className="highlight-visual">
            <div style={{color:'rgba(255,255,255,.5)', fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'14px'}}>Retention Board — This Month</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>312</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Active Yards</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#fff', fontSize:'20px', fontWeight:700}}>9</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>On Hold</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>5</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Win-Backs Sent</div>
              </div>
              <div style={{background:'rgba(255,255,255,.07)', borderRadius:'8px', padding:'12px', textAlign:'center'}}>
                <div style={{color:'#f0820e', fontSize:'20px', fontWeight:700}}>41</div>
                <div style={{color:'rgba(255,255,255,.45)', fontSize:'11px'}}>Reviews Asked</div>
              </div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#f0820e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Patel Account · 2 skips in a row</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Win-back text queued</div></div>
              <div style={{background:'#f0820e', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>At Risk</div>
            </div>
            <div style={{background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'8px', padding:'12px 14px', display:'flex', alignItems:'center', gap:'12px'}}>
              <div style={{width:'10px', height:'10px', borderRadius:'50%', background:'#22c55e', flexShrink:0}}></div>
              <div style={{flex:1}}><div style={{color:'rgba(255,255,255,.85)', fontSize:'13px', fontWeight:600}}>Nguyen Account · 5-star review</div><div style={{color:'rgba(255,255,255,.45)', fontSize:'11px', marginTop:'1px'}}>Left after Tuesday pickup</div></div>
              <div style={{background:'#16a34a', color:'#fff', fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px'}}>Happy</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{background:'var(--light-bg)'}}>
        <div className="centered" style={{maxWidth:'1100px', margin:'0 auto'}}>
          <span className="section-label">Pricing</span>
          <h2 className="section-title">One Flat Price. Every Customer Tool Included.</h2>
          <p className="section-sub">No per-client fees, no upcharge for the client portal, no add-on for SMS. Everything your pet waste removal business needs to sign up, serve, bill, and keep customers is in one plan.</p>
        </div>
        <div style={{maxWidth:'520px', margin:'0 auto'}}>
          <div className="lc-price-card featured">
            <div className="featured-badge">Everything Included</div>
            <div className="price-tier">One Plan. No Surprises.</div>
            <div style={{fontSize:'48px', fontWeight:800, color:'var(--text)', lineHeight:1}}><sup style={{fontSize:'22px', verticalAlign:'super'}}>$</sup>79</div>
            <div style={{color:'var(--muted)', fontSize:'13px', marginBottom:'24px', marginTop:'4px'}}>per month</div>
            <div style={{color:'var(--muted)', fontSize:'14px', marginBottom:'24px', lineHeight:1.5}}>Every feature. Unlimited clients, yards, employees, and users. No tiers, no locked features, no per-seat fees.</div>
            <ul className="price-features">
              <li>Unlimited Clients, Yards &amp; Leads</li>
              <li>Unlimited Employees &amp; Users</li>
              <li>Online Customer Signup Page</li>
              <li>Self-Serve Client Portal</li>
              <li>Pet, Gate &amp; Photo-Proof Records</li>
              <li>Skip &amp; Hold Request Handling</li>
              <li>Card-On-File Billing &amp; Invoices</li>
              <li>Two-Way SMS &amp; Automated Alerts</li>
              <li>Retention, Win-Back &amp; Review Requests</li>
              <li>Crew Mobile App Included</li>
              <li>500 Outbound SMS/month included</li>
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
          <h2 className="section-title" style={{marginBottom:'48px'}}>Customer Management &amp; Client Portal — Common Questions</h2>
          {[
            {q:'What does the customer record hold for a pet waste removal business?', a:'Everything tied to a yard: the dog names and temperament, gate codes and latch location, pickup frequency, card on file, billing history, photo proof of every pickup, and a full timeline of skips, holds, and requests. Any scooper can open the stop and service the yard correctly without calling the office.'},
            {q:'How does the client portal work?', a:'Each customer gets a secure login. From the portal they can view upcoming pickups, see photo proof, pay an invoice with their card on file, update their address and pet info, and submit a skip or vacation hold. Every change syncs straight back to their customer record, so your office stops fielding the same questions all day.'},
            {q:'Can new customers sign themselves up online?', a:'Yes. A branded online signup page collects the client&apos;s address, pickup frequency, pet details, and a card on file. The account is created automatically and lands on your waiting list ready to schedule &mdash; no manual data entry on your end.'},
            {q:'How are skip and hold requests handled?', a:'Clients submit a one-time skip or a vacation hold from the portal. PoopBossPro updates the route automatically so your crew never shows up to a yard that asked for a break, and the request is logged on the customer record for full history.'},
            {q:'Does photo proof of pickup attach to the customer?', a:'Yes. The crew snaps a timestamped photo from the mobile app when a yard is cleared. It attaches to that customer record and appears in the client portal, which ends most billing and missed-pickup disputes before they start.'},
            {q:'How much does PoopBossPro cost?', a:'$79/month with every feature included &mdash; online signup, client portal, customer records, billing, SMS, retention, and the crew app. No per-client fees and no portal upcharge. 14-day free trial, no credit card required.'},
          ].map(({q, a}, i, arr) => (
            <div key={i} style={{padding:'28px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'}}>
              <h3 style={{fontWeight:700, fontSize:'17px', color:'var(--text)', marginBottom:'10px', lineHeight:1.4}} dangerouslySetInnerHTML={{__html: q}} />
              <p style={{color:'var(--muted)', lineHeight:1.7, margin:0, fontSize:'15px'}} dangerouslySetInnerHTML={{__html: a}} />
            </div>
          ))}
          <p style={{marginTop:'40px', color:'var(--muted)', fontSize:'15px', lineHeight:1.7}}>Customer management is one piece of how PoopBossPro runs a pet waste removal business &mdash; <a href="/" style={{color:'var(--orange)', fontWeight:600}}>see the full PoopBossPro platform overview</a>.</p>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-band">
        <h2>Put Every Client, Gate Code, And Pickup<br />In One Place Your Whole Crew Can See.</h2>
        <p>PoopBossPro gives your pet waste removal business a real customer database and a self-serve client portal &mdash; built by people who ran the route. Try it free for 14 days.</p>
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
