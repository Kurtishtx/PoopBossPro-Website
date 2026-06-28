import BlogShell from '../blog-shell';

export const metadata = {
  title: 'Setting Late Fees and Dunning Rules in Pet Waste Removal Software | PoopBossPro',
  description: 'Configure late fees, retry schedules, and dunning rules in PoopBossPro so your scooping business gets paid on time without chasing every customer by hand.',
};

export default function Page() {
  return (
    <BlogShell>
      <article className="blog-article">
        <p className="blog-meta">PoopBossPro Blog &mdash; Billing, Subscriptions &amp; Payments</p>
        <h1>Setting Late Fees and Dunning Rules in Pet Waste Removal Software</h1>
        <p>Every pooper scooper business eventually runs into the same problem: a customer&apos;s card declines, the yard cleanup keeps happening on schedule, and a month later you realize three visits went unpaid. Chasing that money by hand &mdash; texting reminders, re-running cards, remembering who owes what &mdash; eats hours you don&apos;t have. PoopBossPro handles this for you with late fees and dunning rules. Once you set them up, the software watches for failed payments, retries them on a schedule you control, and applies fees automatically so your recurring revenue stays healthy without you babysitting it.</p>

        <h2>What Dunning Actually Means for a Scooping Business</h2>
        <p>Dunning is just the process of following up on a payment that didn&apos;t go through. When you bill a monthly yard cleanup subscription to a card on file and it declines &mdash; expired card, insufficient funds, a bank flag &mdash; the dunning system kicks in. Instead of the charge silently failing and you losing the money, PoopBossPro logs the failure, notifies the customer, retries the card on a timeline you define, and escalates if it still doesn&apos;t clear. For a business running dozens or hundreds of weekly and twice-weekly stops, this is the difference between getting paid and writing off revenue. The crew keeps scooping; the software keeps collecting.</p>

        <h2>Configuring Late Fees That Fit Your Plans</h2>
        <p>In your billing settings, you decide how late fees work. You can set a flat amount &mdash; say a $10 charge added when an invoice passes its due date &mdash; or a percentage of the outstanding balance. You control the grace period too, so a card that clears one day late doesn&apos;t automatically get hit. PoopBossPro lets you apply different fee rules to different plan types, which matters because your pricing isn&apos;t one-size-fits-all. The way you structure fees often follows the same logic as how you handle <a href="/blogs/billing-tiers-by-visit-frequency-pet-waste">Billing by Visit Frequency: Weekly, Twice-Weekly, and Monthly Plans</a>, since a customer paying for eight visits a month carries a bigger balance than a once-a-month yard. The software calculates the fee, adds it to the next invoice, and shows it as a clear line item so the customer knows exactly what happened.</p>

        <h2>Building Your Retry Schedule</h2>
        <p>A declined card is rarely a lost customer &mdash; it&apos;s usually a timing issue. That&apos;s why retries matter. PoopBossPro lets you build a retry schedule for failed charges: attempt again in two days, then four days, then seven, for as many cycles as you want. Many declines clear on the second or third try once the customer&apos;s balance refreshes or they update their card. You set the spacing and the total number of attempts in your dunning rules. Smart spacing means you recover most of the failed payments automatically, before a late fee ever needs to apply. Each retry is tied to the customer&apos;s property profile, so you always know which yard and which subscription the charge belongs to.</p>

        <h2>Automated Customer Texts and Reminders</h2>
        <p>The fastest way to fix a failed payment is to let the customer fix it themselves. PoopBossPro sends automated texts when a card declines, with a secure link for the customer to update their card on file. You decide the wording and the timing &mdash; a friendly nudge on day one, a firmer reminder if it&apos;s still unpaid by day five. Because these messages go out automatically, you&apos;re not the one drafting awkward &quot;your payment didn&apos;t go through&quot; texts at night. The customer updates their card, the next retry clears, and the cleanup schedule never skips a beat. You can also configure the system to pause service notifications if an account stays unpaid past a certain point, so your crew isn&apos;t driving to a yard that hasn&apos;t paid in weeks.</p>

        <h2>Escalation Rules and Pausing Service</h2>
        <p>Sometimes a card never clears, and you need a clear cutoff. Your dunning rules let you define what happens after the final retry fails. PoopBossPro can flag the account as delinquent, notify you, and optionally pause the recurring yard cleanup so you stop dispatching crews to a property that isn&apos;t paying. This protects your margins &mdash; every wasted trip to a non-paying yard is fuel, time, and a route slot another paying customer could have used. When the customer settles up and updates their card, you reactivate the subscription in a click and the route picks the stop back up. The whole escalation path is automatic, but you stay in control of the thresholds.</p>

        <h2>Reporting So You Know Where You Stand</h2>
        <p>Late fees and dunning only help if you can see the results. PoopBossPro gives you a clear view of failed payments, pending retries, applied late fees, and recovered revenue. You can spot a customer whose card keeps declining and reach out personally, or notice that a particular plan tier has more failures than the rest. This ties directly back into your broader <a href="/pet-waste-billing-software">billing, subscriptions &amp; payments</a> setup, where every recurring charge, card-on-file profile, and invoice lives in one place. Instead of guessing how much money is stuck in limbo, you see it on a dashboard and let the automation do the recovery work.</p>

        <p>Set your fees once, build a sensible retry schedule, write a couple of polite reminder texts, and define your escalation cutoff. After that, PoopBossPro collects on your behalf &mdash; turning declined cards into recovered revenue while you focus on running routes and growing the business.</p>

        <div className="blog-cta-box">
          <h3>Stop Chasing Failed Payments</h3>
          <p>PoopBossPro automates late fees, card retries, and dunning so your pet waste removal business gets paid on time without the manual follow-up.</p>
          <a href="https://my.poopbosspro.com">Start Free Trial</a>
        </div>
        <div className="blog-keywords">Keywords: pet waste removal billing software, dunning automation, late fee rules, card on file retries, recurring subscription payments, pooper scooper invoicing</div>
      </article>
    </BlogShell>
  );
}
