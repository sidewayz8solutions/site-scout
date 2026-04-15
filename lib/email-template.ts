export function buildDefaultEmail({
  businessName,
  siteUrl,
  services,
}: {
  businessName: string;
  siteUrl: string;
  services: string;
}) {
  return {
    subject: `We built a free demo website for ${businessName}`,
    body: `Hi there,<br><br>
We noticed that <strong>${businessName}</strong> doesn't have a website yet, so we built a quick demo to show you what's possible:<br><br>
<a href="${siteUrl}" style="font-size:18px; font-weight:bold;">View Your Free Demo Website</a><br><br>
A professional website can help you:<br>
<ul>
  <li>Show up on Google when customers search in your area</li>
  <li>Build trust with new leads before they call</li>
  <li>Showcase your services, reviews, and contact info 24/7</li>
</ul>
<br>
We specialize in:<br>
${services}<br><br>
If you like the demo, reply to this email and we can discuss making it live — no pressure, just wanted to show you what's possible.<br><br>
Best,<br>
The Site Scout Team`,
  };
}
