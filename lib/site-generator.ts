import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { put } from "@vercel/blob";

export type BusinessInfo = {
  name: string;
  industry: string;
  location: string;
  phone: string;
  email: string | null;
  address: string;
};

const industries: Record<string, { emoji: string; primary: string; gradient: string; imageKeyword: string }> = {
  roofing: { emoji: "🏠", primary: "#ea580c", gradient: "from-orange-500 to-red-600", imageKeyword: "roof" },
  plumbing: { emoji: "🔧", primary: "#0284c7", gradient: "from-sky-500 to-blue-600", imageKeyword: "plumber" },
  landscaping: { emoji: "🌿", primary: "#16a34a", gradient: "from-green-500 to-emerald-600", imageKeyword: "garden" },
  electrical: { emoji: "⚡", primary: "#ca8a04", gradient: "from-yellow-500 to-amber-600", imageKeyword: "electrician" },
  hvac: { emoji: "❄️", primary: "#dc2626", gradient: "from-red-500 to-rose-600", imageKeyword: "hvac" },
  cleaning: { emoji: "✨", primary: "#7c3aed", gradient: "from-violet-500 to-purple-600", imageKeyword: "cleaning" },
  painting: { emoji: "🎨", primary: "#db2777", gradient: "from-pink-500 to-rose-500", imageKeyword: "painting" },
  default: { emoji: "🏢", primary: "#2563eb", gradient: "from-blue-500 to-indigo-600", imageKeyword: "business" },
};

function getIndustryData(industry: string) {
  const key = industry.toLowerCase();
  for (const k of Object.keys(industries)) {
    if (key.includes(k)) return industries[k];
  }
  return industries.default;
}

function getServices(industry: string): string[] {
  const key = industry.toLowerCase();
  if (key.includes("roof")) return ["Roof Repair", "New Roof Installation", "Gutter Services", "Roof Inspections", "Emergency Leak Repair"];
  if (key.includes("plumb")) return ["Leak Repair", "Drain Cleaning", "Water Heater Install", "Pipe Replacement", "Emergency Plumbing"];
  if (key.includes("landscap") || key.includes("lawn")) return ["Lawn Maintenance", "Garden Design", "Tree Trimming", "Hardscaping", "Seasonal Cleanup"];
  if (key.includes("elect")) return ["Wiring & Rewiring", "Panel Upgrades", "Lighting Installation", "Ceiling Fans", "EV Charger Install"];
  if (key.includes("hvac") || key.includes("air")) return ["AC Repair", "Heating Installation", "Duct Cleaning", "Thermostat Upgrades", "Maintenance Plans"];
  if (key.includes("clean")) return ["Deep Cleaning", "Move-In/Move-Out", "Office Cleaning", "Post-Construction", "Recurring Service"];
  if (key.includes("paint")) return ["Interior Painting", "Exterior Painting", "Cabinet Refinishing", "Pressure Washing", "Color Consultation"];
  return ["Consultation", "Installation", "Repair Services", "Maintenance Plans", "Emergency Support"];
}

export async function generateSite(business: BusinessInfo, id: number) {
  const data = getIndustryData(business.industry);
  const services = getServices(business.industry);
  const slug = business.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
  const filename = `${slug}-${id}.html`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${business.name} | ${business.industry} Services in ${business.location}</title>
  <meta name="description" content="Top-rated ${business.industry} services in ${business.location}. Call ${business.phone} for fast, reliable service.">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root { --primary: ${data.primary}; --primary-dark: color-mix(in srgb, ${data.primary}, black 15%); --primary-light: color-mix(in srgb, ${data.primary}, white 20%); }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color: #1f2937; line-height: 1.6; }
    a { text-decoration: none; color: inherit; }
    header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.05); }
    .nav-container { max-width: 1100px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .logo { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 1.25rem; }
    .logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: grid; place-items: center; color: #fff; font-size: 1.25rem; }
    .nav-links { display: none; gap: 28px; font-weight: 500; font-size: 0.95rem; }
    .nav-links a:hover { color: var(--primary); }
    .nav-cta { display: none; background: var(--primary); color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 600; }
    .menu-btn { width: 40px; height: 40px; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; background: #fff; cursor: pointer; display: grid; place-items: center; }
    .mobile-menu { display: none; position: absolute; top: 100%; left: 0; right: 0; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.08); padding: 16px 24px; flex-direction: column; gap: 12px; }
    .mobile-menu.open { display: flex; }
    .mobile-menu a { padding: 10px 0; font-weight: 500; }
    .mobile-cta { background: var(--primary); color: #fff; text-align: center; padding: 12px; border-radius: 8px; font-weight: 600; }
    @media(min-width:768px){ .nav-links,.nav-cta{display:flex}.menu-btn{display:none}.mobile-menu{display:none!important} }
    .hero { padding: 140px 24px 100px; background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%); }
    .hero-inner { max-width: 1100px; margin: 0 auto; display: grid; gap: 48px; align-items: center; }
    @media(min-width:900px){ .hero-inner { grid-template-columns: 1.05fr 0.95fr; } }
    .badge-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.06); padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 500; color: #374151; margin-bottom: 18px; }
    .badge-pill span { color: #f59e0b; }
    h1 { font-size: clamp(2rem, 4.5vw, 3rem); line-height: 1.1; font-weight: 800; letter-spacing: -0.02em; }
    .hero p.lead { font-size: 1.125rem; color: #4b5563; margin-top: 16px; }
    .hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; align-items: center; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 26px; border-radius: 10px; font-weight: 600; font-size: 1rem; transition: all .15s ease; cursor: pointer; border: none; }
    .btn-primary { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; box-shadow: 0 10px 28px rgba(0,0,0,0.12); }
    .btn-secondary { background: #fff; color: #1f2937; border: 1px solid rgba(0,0,0,0.1); }
    .hero-visual { position: relative; border-radius: 18px; overflow: hidden; background: linear-gradient(135deg, #f1f5f9, #e2e8f0); min-height: 320px; display: grid; place-items: center; box-shadow: 0 20px 60px rgba(0,0,0,0.08); }
    .hero-visual::before { content: ""; position: absolute; inset: 0; background: url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80') center/cover; opacity: 0.35; }
    .hero-card { position: relative; z-index: 2; background: rgba(255,255,255,0.96); padding: 22px 26px; border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.1); max-width: 280px; text-align: center; }
    .stars { color: #f59e0b; font-size: 1.1rem; margin-top: 8px; }
    .trust { background: #0b1220; color: #fff; padding: 28px 24px; }
    .trust-inner { max-width: 1100px; margin: 0 auto; display: grid; gap: 16px; grid-template-columns: repeat(2, 1fr); }
    @media(min-width:700px){ .trust-inner { grid-template-columns: repeat(4, 1fr); } }
    .trust-item { text-align: center; }
    .trust-item h3 { font-size: 1.6rem; font-weight: 800; }
    .section { padding: 90px 24px; }
    .section-alt { background: #f8fafc; }
    .container { max-width: 1100px; margin: 0 auto; }
    .section h2 { font-size: clamp(1.6rem, 3vw, 2.1rem); font-weight: 800; text-align: center; }
    .section-sub { text-align: center; color: #4b5563; margin-top: 10px; max-width: 680px; margin-inline: auto; }
    .services-grid { display: grid; gap: 20px; margin-top: 44px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .service-card { background: #fff; border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 26px; transition: transform .2s ease, box-shadow .2s ease; }
    .service-card:hover { transform: translateY(-4px); box-shadow: 0 18px 48px rgba(0,0,0,0.08); }
    .service-icon { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); display: grid; place-items: center; color: #fff; font-size: 1.4rem; margin-bottom: 14px; }
    .why-grid { display: grid; gap: 28px; margin-top: 44px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .why-box { background: #fff; border-radius: 16px; padding: 28px; border: 1px solid rgba(0,0,0,0.06); }
    .reviews-grid { display: grid; gap: 20px; margin-top: 44px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .review { background: #fff; border-radius: 16px; padding: 24px; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .review-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #e2e8f0, #cbd5e1); display: grid; place-items: center; font-weight: 700; color: #475569; }
    .cta-section { padding: 90px 24px; background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; text-align: center; }
    .cta-phone { display: inline-block; margin-top: 22px; background: #fff; color: var(--primary-dark); padding: 16px 32px; border-radius: 12px; font-weight: 800; font-size: 1.25rem; box-shadow: 0 12px 36px rgba(0,0,0,0.2); }
    footer { background: #0f172a; color: #cbd5e1; padding: 40px 24px; text-align: center; }
    .float-cta { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 50px; padding: 10px 18px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); z-index: 900; }
    .float-cta a { background: var(--primary); color: #fff; padding: 10px 18px; border-radius: 50px; font-weight: 700; font-size: 0.95rem; }
    @media(min-width:768px){ .float-cta { display: none; } }
  </style>
</head>
<body>
  <header>
    <div class="nav-container">
      <a href="#" class="logo"><div class="logo-icon">${data.emoji}</div>${business.name}</a>
      <nav class="nav-links"><a href="#services">Services</a><a href="#why">Why Us</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a></nav>
      <a class="nav-cta" href="tel:${business.phone.replace(/\D/g, "")}">Call Now</a>
      <button class="menu-btn" onclick="document.getElementById('mobileMenu').classList.toggle('open')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="#services">Services</a><a href="#why">Why Us</a><a href="#reviews">Reviews</a><a href="#contact">Contact</a>
      <a class="mobile-cta" href="tel:${business.phone.replace(/\D/g, "")}">Call ${business.phone}</a>
    </div>
  </header>

  <section class="hero">
    <div class="hero-inner">
      <div>
        <div class="badge-pill"><span>★</span> Top-rated ${business.industry} in ${business.location}</div>
        <h1>Your Local ${business.industry} Experts in ${business.location}</h1>
        <p class="lead">Reliable, fast, and fairly priced. We help homeowners and businesses in ${business.location} get the job done right—the first time.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="tel:${business.phone.replace(/\D/g, "")}">📞 Get a Free Quote</a>
        </div>
      </div>
      <div class="hero-visual">
        <div class="hero-card">
          <h4>"Highly recommend!"</h4>
          <p>Local customer from ${business.location}</p>
          <div class="stars">★★★★★</div>
        </div>
      </div>
    </div>
  </section>

  <section class="trust">
    <div class="trust-inner">
      <div class="trust-item"><h3>10+</h3><p>Years Experience</p></div>
      <div class="trust-item"><h3>500+</h3><p>Happy Customers</p></div>
      <div class="trust-item"><h3>24/7</h3><p>Emergency Service</p></div>
      <div class="trust-item"><h3>100%</h3><p>Satisfaction Guaranteed</p></div>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      <h2>Services We Offer</h2>
      <p class="section-sub">From routine maintenance to major projects, we've got ${business.location} covered.</p>
      <div class="services-grid">
        ${services.map((s) => `<div class="service-card"><div class="service-icon">${data.emoji}</div><h3>${s}</h3><p>Professional ${s.toLowerCase()} delivered by experienced local experts.</p></div>`).join("")}
      </div>
    </div>
  </section>

  <section class="section section-alt" id="why">
    <div class="container">
      <h2>Why ${business.name}?</h2>
      <p class="section-sub">We're not just another ${business.industry} company—we're your neighbors.</p>
      <div class="why-grid">
        <div class="why-box"><h4>⚡ Fast Response Times</h4><p>We know delays cost money. That’s why we prioritize urgent requests and arrive on time.</p></div>
        <div class="why-box"><h4>💰 Upfront Pricing</h4><p>No hidden fees, no surprises. You get a clear quote before any work begins.</p></div>
        <div class="why-box"><h4>🛡️ Licensed & Insured</h4><p>Peace of mind matters. Our team is fully licensed and insured for every job we take.</p></div>
        <div class="why-box"><h4>🏆 Quality Guaranteed</h4><p>We stand behind our work. If something isn’t right, we’ll make it right—period.</p></div>
      </div>
    </div>
  </section>

  <section class="section" id="reviews">
    <div class="container">
      <h2>What ${business.location} Customers Say</h2>
      <p class="section-sub">Real reviews from real people in your community.</p>
      <div class="reviews-grid">
        <div class="review"><div class="review-header"><div class="review-avatar">JD</div><div><div class="review-name">James D.</div></div></div><div class="stars">★★★★★</div><p>"${business.name} was incredibly professional. They showed up on time, explained everything, and the price was fair."</p></div>
        <div class="review"><div class="review-header"><div class="review-avatar">SM</div><div><div class="review-name">Sarah M.</div></div></div><div class="stars">★★★★★</div><p>"I had an emergency and they came out within the hour. Highly recommended!"</p></div>
        <div class="review"><div class="review-header"><div class="review-avatar">RK</div><div><div class="review-name">Robert K.</div></div></div><div class="stars">★★★★★</div><p>"Best ${business.industry} service I’ve used in ${business.location}. Honest pricing, great communication, and quality work."</p></div>
      </div>
    </div>
  </section>

  <section class="cta-section" id="contact">
    <div class="container">
      <h2>Ready to get started?</h2>
      <p>Call now for a free, no-obligation quote. We're available 24/7.</p>
      <a class="cta-phone" href="tel:${business.phone.replace(/\D/g, "")}">${business.phone}</a>
      <p style="margin-top:18px;font-size:0.9rem;opacity:0.85">${business.address}</p>
    </div>
  </section>

  <footer>
    <p>&copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
    <p style="margin-top:8px;font-size:0.9rem;opacity:0.9">${business.phone}</p>
  </footer>

  <div class="float-cta">
    <span>${business.phone}</span>
    <a href="tel:${business.phone.replace(/\D/g, "")}">Call Now</a>
  </div>
</body>
</html>`;

  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    const { url } = await put(`generated-sites/${filename}`, html, {
      access: "public",
      contentType: "text/html",
    });
    return { url, filename };
  } else {
    const dir = join(process.cwd(), "public", "generated-sites");
    mkdirSync(dir, { recursive: true });
    const filepath = join(dir, filename);
    writeFileSync(filepath, html);
    return { url: `/generated-sites/${filename}`, filename };
  }
}
