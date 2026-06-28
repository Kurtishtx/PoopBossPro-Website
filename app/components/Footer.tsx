export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <a href="/" className="site-footer-brand">
            <span>💩</span>
            <span>PoopBossPro</span>
          </a>
          <div className="site-footer-cols">
            <div className="site-footer-col">
              <h4>Product</h4>
              <a href="/features">Features</a>
              <a href="/pricing">Pricing</a>
              <a href="https://my.poopbosspro.com" target="_blank" rel="noreferrer">Log In</a>
            </div>
            <div className="site-footer-col">
              <h4>Solutions</h4>
              <a href="/pooper-scooper-software">Pooper Scooper Software</a>
              <a href="/pet-waste-removal-software">Pet Waste Removal</a>
              <a href="/dog-waste-cleanup-scheduling-software">Dog Waste Scheduling</a>
              <a href="/pet-waste-routes-dispatch-software">Routes & Dispatch</a>
              <a href="/pet-waste-billing-software">Billing & Payments</a>
              <a href="/pet-waste-business-software">Pet Waste Business</a>
              <a href="/pet-waste-crew-app-software">Crew Mobile App</a>
              <a href="/pet-waste-customer-management-software">Customer Management</a>
            </div>
            <div className="site-footer-col">
              <h4>Compare</h4>
              <a href="/vs-jobber">vs. Jobber</a>
              <a href="/vs-servicetitan">vs. ServiceTitan</a>
              <a href="/vs-housecallpro">vs. Housecall Pro</a>
              <a href="/vs-gorilladesk">vs. GorillaDesk</a>
              <a href="/vs-serviceautopilot">vs. Service Autopilot</a>
            </div>
            <div className="site-footer-col">
              <h4>Resources</h4>
              <a href="/blogs">Blog</a>
            </div>
            <div className="site-footer-col">
              <h4>BossPro Family</h4>
              <a href="https://industrybosspro.com">IndustryBossPro</a>
            </div>
          </div>
        </div>
        <div className="site-footer-bottom">
          © {new Date().getFullYear()} PoopBossPro. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
