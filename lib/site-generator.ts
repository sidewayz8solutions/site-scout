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

const industries: Record<string, { emoji: string; primary: string; secondary: string; keyword: string }> = {
  roofing: { emoji: "🏠", primary: "#ea580c", secondary: "#c2410c", keyword: "roof" },
  plumbing: { emoji: "🔧", primary: "#0284c7", secondary: "#0369a1", keyword: "plumber" },
  landscaping: { emoji: "🌿", primary: "#16a34a", secondary: "#15803d", keyword: "landscaping" },
  electrical: { emoji: "⚡", primary: "#ca8a04", secondary: "#a16207", keyword: "electrician" },
  hvac: { emoji: "❄️", primary: "#dc2626", secondary: "#b91c1c", keyword: "hvac" },
  cleaning: { emoji: "✨", primary: "#7c3aed", secondary: "#6d28d9", keyword: "cleaning" },
  painting: { emoji: "🎨", primary: "#db2777", secondary: "#be185d", keyword: "painting" },
  default: { emoji: "🏢", primary: "#2563eb", secondary: "#1d4ed8", keyword: "business" },
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

function getWhyUs(): { icon: string; title: string; text: string }[] {
  return [
    { icon: "⚡", title: "Fast Response Times", text: "We know delays cost money. That’s why we prioritize urgent requests and arrive on time." },
    { icon: "💰", title: "Upfront Pricing", text: "No hidden fees, no surprises. You get a clear quote before any work begins." },
    { icon: "🛡️", title: "Licensed & Insured", text: "Peace of mind matters. Our team is fully licensed and insured for every job we take." },
    { icon: "🏆", title: "Quality Guaranteed", text: "We stand behind our work. If something isn’t right, we’ll make it right—period." },
  ];
}

function getReviews(industry: string, location: string, name: string): { initials: string; fullName: string; text: string }[] {
  return [
    { initials: "JD", fullName: "James D.", text: `${name} was incredibly professional. They showed up on time, explained everything, and the price was fair.` },
    { initials: "SM", fullName: "Sarah M.", text: "I had an emergency and they came out within the hour. Highly recommended!" },
    { initials: "RK", fullName: "Robert K.", text: `Best ${industry} service I’ve used in ${location}. Honest pricing, great communication, and quality work.` },
    { initials: "AL", fullName: "Amanda L.", text: "From quote to cleanup, everything was seamless. I’ve already recommended them to my neighbors." },
  ];
}

export async function generateSite(business: BusinessInfo, id: number) {
  const data = getIndustryData(business.industry);
  const services = getServices(business.industry);
  const whyUs = getWhyUs();
  const reviews = getReviews(business.industry, business.location, business.name);
  const slug = business.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 30);
  const filename = `${slug}-${id}.html`;
  const cleanPhone = business.phone.replace(/\D/g, "");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${business.name} | ${business.industry} Services in ${business.location}</title>
<meta name="description" content="Top-rated ${business.industry} services in ${business.location}. Call ${business.phone} for fast, reliable service.">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{--primary:${data.primary};--secondary:${data.secondary};--bg:#0b0f19;--surface:#111827}
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#0f172a;line-height:1.55;overflow-x:hidden}
a{text-decoration:none;color:inherit}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-thumb{background:var(--primary);border-radius:4px}

/* Nav */
.nav{position:fixed;inset:0 0 auto;z-index:1000;transition:all .3s ease}
.nav.scrolled{background:rgba(255,255,255,.92);backdrop-filter:blur(14px);box-shadow:0 1px 0 rgba(0,0,0,.05)}
.nav-inner{max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between}
.logo{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.2rem}
.logo-icon{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:grid;place-items:center;color:#fff;font-size:1.2rem;box-shadow:0 10px 25px -8px var(--primary)}
.nav-links{display:none;gap:28px;font-weight:500;font-size:.95rem}
.nav-links a{position:relative}
.nav-links a::after{content:"";position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--primary);transition:width .3s ease}
.nav-links a:hover::after{width:100%}
.nav-cta{display:none;background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;padding:10px 22px;border-radius:999px;font-weight:600;box-shadow:0 10px 25px -8px var(--primary);transition:transform .2s ease}
.nav-cta:hover{transform:translateY(-2px)}
.menu-btn{width:40px;height:40px;border:1px solid rgba(0,0,0,.08);border-radius:8px;background:#fff;cursor:pointer;display:grid;place-items:center}
.mobile-menu{display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border-bottom:1px solid rgba(0,0,0,.08);padding:16px 24px;flex-direction:column;gap:12px}
.mobile-menu.open{display:flex;animation:slideDown .3s ease}
@keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
.mobile-menu a{padding:10px 0;font-weight:500}
.mobile-cta{background:var(--primary);color:#fff;text-align:center;padding:12px;border-radius:999px;font-weight:600}
@media(min-width:768px){.nav-links,.nav-cta{display:flex}.menu-btn{display:none}.mobile-menu{display:none!important}}

/* Hero */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:140px 24px 100px;overflow:hidden;background:radial-gradient(1200px 800px at 10% -10%,rgba(255,255,255,.6),transparent),radial-gradient(1000px 600px at 120% 20%,rgba(255,255,255,.5),transparent),linear-gradient(150deg,#f8fafc 0%,#ffffff 60%,#f1f5f9 100%)}
#particles{position:absolute;inset:0;pointer-events:none;z-index:0}
.hero-inner{position:relative;z-index:2;max-width:1200px;margin:0 auto;display:grid;gap:56px;align-items:center}
@media(min-width:900px){.hero-inner{grid-template-columns:1.1fr .9fr}}
.badge-pill{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid rgba(0,0,0,.06);padding:8px 16px;border-radius:999px;font-size:.85rem;font-weight:600;color:#374151;margin-bottom:20px;box-shadow:0 4px 14px rgba(0,0,0,.04);animation:fadeInUp .8s ease both}
.badge-pill span{color:#f59e0b}
.hero h1{font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.05;font-weight:900;letter-spacing:-.025em;animation:fadeInUp .8s .1s both}
.hero p.lead{font-size:1.15rem;color:#475569;margin-top:18px;animation:fadeInUp .8s .2s both}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px;animation:fadeInUp .8s .3s both}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:14px 26px;border-radius:999px;font-weight:700;font-size:1rem;transition:all .2s ease;cursor:pointer;border:none;position:relative;overflow:hidden}
.btn-primary{background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;box-shadow:0 14px 34px -10px var(--primary)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 44px -10px var(--primary)}
.btn-secondary{background:#fff;color:#0f172a;border:1px solid rgba(0,0,0,.1)}
.btn-secondary:hover{border-color:var(--primary);color:var(--primary)}
@keyframes fadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}

.hero-visual{position:relative;border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#f1f5f9,#e2e8f0);min-height:360px;display:grid;place-items:center;box-shadow:0 30px 80px -20px rgba(0,0,0,.12);animation:fadeInUp .8s .4s both}
.hero-visual::before{content:"";position:absolute;inset:0;background:url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&q=80') center/cover;opacity:.25;transition:transform 8s ease}
.hero-visual:hover::before{transform:scale(1.08)}
.hero-card{position:relative;z-index:2;background:rgba(255,255,255,.98);padding:26px 30px;border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.12);max-width:300px;text-align:center;transition:transform .4s ease}
.hero-card:hover{transform:translateY(-6px)}
.stars{color:#f59e0b;font-size:1.1rem;margin-top:8px}

/* Trust */
.trust{background:var(--surface);color:#fff;padding:40px 24px;position:relative;overflow:hidden}
.trust::before{content:"";position:absolute;inset:0;background:radial-gradient(800px 400px at 80% 50%,rgba(255,255,255,.04),transparent)}
.trust-inner{max-width:1200px;margin:0 auto;display:grid;gap:24px;grid-template-columns:repeat(2,1fr);position:relative;z-index:2}
@media(min-width:700px){.trust-inner{grid-template-columns:repeat(4,1fr)}}
.trust-item{text-align:center}
.trust-item h3{font-size:clamp(1.8rem,3vw,2.4rem);font-weight:900;background:linear-gradient(135deg,#fff,rgba(255,255,255,.7));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.counter{display:inline-block;min-width:2ch}

/* Sections */
.section{padding:100px 24px}
.section-alt{background:#f8fafc}
.container{max-width:1200px;margin:0 auto}
.section h2{font-size:clamp(1.8rem,3.2vw,2.4rem);font-weight:900;text-align:center}
.section-sub{text-align:center;color:#475569;margin-top:10px;max-width:680px;margin-inline:auto}

/* Reveal */
.reveal{opacity:0;transform:translateY(30px);transition:all .7s cubic-bezier(.16,1,.3,1)}
.reveal.in-view{opacity:1;transform:translateY(0)}

/* Services */
.services-grid{display:grid;gap:22px;margin-top:52px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.service-card{background:#fff;border:1px solid rgba(0,0,0,.06);border-radius:18px;padding:28px;transition:transform .35s ease,box-shadow .35s ease;cursor:pointer}
.service-card:hover{transform:translateY(-8px) rotateX(2deg);box-shadow:0 26px 60px rgba(0,0,0,.1)}
.service-icon{width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,var(--primary),var(--secondary));display:grid;place-items:center;color:#fff;font-size:1.5rem;margin-bottom:16px;box-shadow:0 12px 30px -10px var(--primary)}
.service-card h3{font-size:1.15rem;font-weight:800;margin-bottom:6px}

/* Why us */
.why-grid{display:grid;gap:22px;margin-top:52px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.why-box{background:#fff;border-radius:18px;padding:28px;border:1px solid rgba(0,0,0,.06);transition:transform .35s ease,box-shadow .35s ease}
.why-box:hover{transform:translateY(-6px);box-shadow:0 22px 55px rgba(0,0,0,.08)}
.why-box h4{font-size:1.1rem;font-weight:800;margin-bottom:8px;display:flex;align-items:center;gap:8px}

/* Reviews carousel */
.reviews-wrap{position:relative;margin-top:52px;overflow:hidden}
.reviews-track{display:flex;gap:20px;transition:transform .6s cubic-bezier(.16,1,.3,1)}
.review{flex:0 0 100%;max-width:100%;background:#fff;border-radius:18px;padding:26px;border:1px solid rgba(0,0,0,.06);box-shadow:0 4px 20px rgba(0,0,0,.04)}
@media(min-width:700px){.review{flex:0 0 calc(50% - 10px);max-width:calc(50% - 10px)}}
@media(min-width:1100px){.review{flex:0 0 calc(33.333% - 14px);max-width:calc(33.333% - 14px)}}
.review-header{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.review-avatar{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#e2e8f0,#cbd5e1);display:grid;place-items:center;font-weight:800;color:#475569}
.review-name{font-weight:700}
.review-stars{color:#f59e0b;font-size:1rem}
.review-nav{display:flex;justify-content:center;gap:10px;margin-top:22px}
.review-nav button{width:44px;height:44px;border-radius:50%;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;display:grid;place-items:center;transition:all .2s ease}
.review-nav button:hover{background:var(--primary);color:#fff;border-color:var(--primary)}

/* CTA */
.cta-section{position:relative;padding:110px 24px;background:linear-gradient(135deg,var(--primary),var(--secondary));color:#fff;text-align:center;overflow:hidden}
.cta-section::before{content:"";position:absolute;inset:0;background:url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 320\"><path fill=\"rgba(255,255,255,.1)\" d=\"M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,213.3C672,192,768,128,864,128C960,128,1056,192,1152,208C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>');background-size:cover;background-position:bottom}
.cta-phone{display:inline-block;margin-top:24px;background:#fff;color:var(--secondary);padding:18px 34px;border-radius:999px;font-weight:900;font-size:clamp(1.1rem,2.5vw,1.4rem);box-shadow:0 16px 50px rgba(0,0,0,.25);transition:transform .2s ease}
.cta-phone:hover{transform:scale(1.05)}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(6px);z-index:2000;display:none;align-items:center;justify-content:center;padding:24px}
.modal-overlay.open{display:flex;animation:fadeIn .25s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal{background:#fff;border-radius:20px;max-width:420px;width:100%;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,.35);transform:scale(.95);animation:popIn .25s ease forwards}
@keyframes popIn{to{transform:scale(1)}}
.modal h3{font-size:1.3rem;font-weight:800;margin-bottom:6px}
.modal p{color:#475569;margin-bottom:16px;font-size:.95rem}
.modal input{width:100%;padding:12px 14px;border:1px solid rgba(0,0,0,.12);border-radius:12px;margin-bottom:12px;font-size:1rem}
.modal .btn{width:100%}
.modal-close{position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;border:1px solid rgba(0,0,0,.1);background:#fff;cursor:pointer;display:grid;place-items:center}

/* Footer */
footer{background:#0b1220;color:#cbd5e1;padding:44px 24px;text-align:center}
footer p{opacity:.9}

/* Float CTA */
.float-cta{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:50px;padding:10px 18px;display:flex;align-items:center;gap:12px;box-shadow:0 12px 45px rgba(0,0,0,.18);z-index:900}
.float-cta a{background:var(--primary);color:#fff;padding:10px 20px;border-radius:50px;font-weight:800;font-size:.95rem}
@media(min-width:768px){.float-cta{display:none}}
</style>
</head>
<body>

<nav class="nav" id="nav">
  <div class="nav-inner">
    <a href="#" class="logo"><div class="logo-icon">${data.emoji}</div>${business.name}</a>
    <div class="nav-links">
      <a href="#services">Services</a>
      <a href="#why">Why Us</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <a class="nav-cta" href="tel:${cleanPhone}">Call Now</a>
    <button class="menu-btn" onclick="document.getElementById('mobileMenu').classList.toggle('open')" aria-label="Menu">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
  <div class="mobile-menu" id="mobileMenu">
    <a href="#services" onclick="document.getElementById('mobileMenu').classList.remove('open')">Services</a>
    <a href="#why" onclick="document.getElementById('mobileMenu').classList.remove('open')">Why Us</a>
    <a href="#reviews" onclick="document.getElementById('mobileMenu').classList.remove('open')">Reviews</a>
    <a href="#contact" onclick="document.getElementById('mobileMenu').classList.remove('open')">Contact</a>
    <a class="mobile-cta" href="tel:${cleanPhone}">Call ${business.phone}</a>
  </div>
</nav>

<section class="hero">
  <canvas id="particles"></canvas>
  <div class="hero-inner">
    <div>
      <div class="badge-pill"><span>★</span> Top-rated ${business.industry} in ${business.location}</div>
      <h1>Your Local ${business.industry} Experts in ${business.location}</h1>
      <p class="lead">Reliable, fast, and fairly priced. We help homeowners and businesses in ${business.location} get the job done right—the first time.</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="tel:${cleanPhone}">📞 Get a Free Quote</a>
        <button class="btn btn-secondary" onclick="openModal()">📅 Schedule a Call</button>
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
    <div class="trust-item"><h3><span class="counter" data-target="10">0</span>+</h3><p>Years Experience</p></div>
    <div class="trust-item"><h3><span class="counter" data-target="500">0</span>+</h3><p>Happy Customers</p></div>
    <div class="trust-item"><h3><span class="counter" data-target="24">0</span>/7</h3><p>Emergency Service</p></div>
    <div class="trust-item"><h3><span class="counter" data-target="100">0</span>%</h3><p>Satisfaction</p></div>
  </div>
</section>

<section class="section" id="services">
  <div class="container">
    <h2 class="reveal">Services We Offer</h2>
    <p class="section-sub reveal">From routine maintenance to major projects, we've got ${business.location} covered.</p>
    <div class="services-grid">
      ${services.map((s, i) => `<div class="service-card reveal" style="transition-delay:${i * 80}ms"><div class="service-icon">${data.emoji}</div><h3>${s}</h3><p>Professional ${s.toLowerCase()} delivered by experienced local experts.</p></div>`).join("")}
    </div>
  </div>
</section>

<section class="section section-alt" id="why">
  <div class="container">
    <h2 class="reveal">Why ${business.name}?</h2>
    <p class="section-sub reveal">We're not just another ${business.industry} company—we're your neighbors.</p>
    <div class="why-grid">
      ${whyUs.map((w, i) => `<div class="why-box reveal" style="transition-delay:${i * 80}ms"><h4>${w.icon} ${w.title}</h4><p>${w.text}</p></div>`).join("")}
    </div>
  </div>
</section>

<section class="section" id="reviews">
  <div class="container">
    <h2 class="reveal">What ${business.location} Customers Say</h2>
    <p class="section-sub reveal">Real reviews from real people in your community.</p>
    <div class="reviews-wrap reveal">
      <div class="reviews-track" id="reviewsTrack">
        ${reviews.map(r => `<div class="review"><div class="review-header"><div class="review-avatar">${r.initials}</div><div><div class="review-name">${r.fullName}</div><div class="review-stars">★★★★★</div></div></div><p>"${r.text}"</p></div>`).join("")}
      </div>
      <div class="review-nav">
        <button onclick="moveCarousel(-1)" aria-label="Previous">❮</button>
        <button onclick="moveCarousel(1)" aria-label="Next">❯</button>
      </div>
    </div>
  </div>
</section>

<section class="cta-section" id="contact">
  <div class="container" style="position:relative;z-index:2">
    <h2 class="reveal">Ready to get started?</h2>
    <p class="reveal" style="opacity:.9">Call now for a free, no-obligation quote. We're available 24/7.</p>
    <a class="cta-phone reveal" href="tel:${cleanPhone}">${business.phone}</a>
    <p class="reveal" style="margin-top:18px;font-size:.95rem;opacity:.85">${business.address}</p>
  </div>
</section>

<footer>
  <p>&copy; ${new Date().getFullYear()} ${business.name}. All rights reserved.</p>
  <p style="margin-top:8px;font-size:.9rem;opacity:.8">${business.phone}</p>
</footer>

<div class="float-cta">
  <span style="font-weight:600">${business.phone}</span>
  <a href="tel:${cleanPhone}">Call Now</a>
</div>

<div class="modal-overlay" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal" style="position:relative">
    <button class="modal-close" onclick="closeModal()" aria-label="Close">✕</button>
    <h3>Schedule a Call</h3>
    <p>Leave your number and we'll call you back within 15 minutes.</p>
    <input type="tel" id="callInput" placeholder="(555) 123-4567" />
    <button class="btn btn-primary" onclick="submitCall()">Request Callback</button>
  </div>
</div>

<script>
/* Particles */
(function(){
  const cvs=document.getElementById('particles'),ctx=cvs.getContext('2d');
  let w,h,particles=[];
  function resize(){w=cvs.width=cvs.offsetWidth;h=cvs.height=cvs.offsetHeight}
  window.addEventListener('resize',resize);resize();
  for(let i=0;i<36;i++)particles.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*2+1,dx:(Math.random()-.5)*.4,dy:(Math.random()-.5)*.4,alpha:Math.random()*.5+.2});
  function draw(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p=>{
      p.x+=p.dx;p.y+=p.dy;
      if(p.x<0||p.x>w)p.dx*=-1;
      if(p.y<0||p.y>h)p.dy*=-1;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle='rgba(2,132,199,'+p.alpha+')';ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

/* Nav scroll */
window.addEventListener('scroll',()=>{
  document.getElementById('nav').classList.toggle('scrolled',window.scrollY>40);
});

/* Reveal on scroll */
const reveals=document.querySelectorAll('.reveal');
const io=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in-view');io.unobserve(e.target);}});
},{threshold:.15});
reveals.forEach(el=>io.observe(el));

/* Counters */
const counters=document.querySelectorAll('.counter');
const cio=new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      const el=e.target,t=+el.dataset.target;let c=0,s=Math.max(1,Math.floor(t/40));
      const i=setInterval(()=>{c+=s;el.textContent=c>=t?t:c;},30);
      setTimeout(()=>clearInterval(i),1500);
      cio.unobserve(el);
    }
  });
},{threshold:.6});
counters.forEach(el=>cio.observe(el));

/* Carousel */
let cIndex=0;
function moveCarousel(dir){
  const track=document.getElementById('reviewsTrack');
  const items=track.children.length;
  const visible=window.innerWidth>=1100?3:window.innerWidth>=700?2:1;
  const max=Math.max(0,items-visible);
  cIndex=Math.max(0,Math.min(cIndex+dir,max));
  track.style.transform='translateX(calc(-'+cIndex+' * (100% + 20px) / '+visible+'))';
}

/* Modal */
function openModal(){document.getElementById('modal').classList.add('open');}
function closeModal(){document.getElementById('modal').classList.remove('open');}
function submitCall(){const v=document.getElementById('callInput').value;if(v){alert('Thanks! We will call you at '+v+' shortly.');closeModal();}}
</script>
</body>
</html>`;

  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    const { url } = await put(`generated-sites/${filename}`, html, {
      access: "public",
      contentType: "text/html",
      allowOverwrite: true,
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
