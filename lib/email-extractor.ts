/**
 * Quick email extraction from business websites.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const BAD_EMAILS = [
  "noreply", "no-reply", "donotreply", "mail@example", "email@example",
  "domain.com", "yourdomain.com", "sentry.io", "sentry.wixpress.com",
  "wixpress.com", "@email.com", "@example.", "@domain.", "@yourdomain.",
  "yourname@gmail.com", "name@gmail.com", "firstname@", "lastname@",
  "john@example.com", "jane@example.com", "name@domain.com", "info@",
];

export function extractEmailsFromHtml(html: string, domain?: string): string[] {
  const matches = html.match(EMAIL_RE) || [];
  const filtered = matches.filter((email) => {
    const lower = email.toLowerCase();
    if (BAD_EMAILS.some((bad) => lower.includes(bad))) return false;
    if (lower.length > 60) return false;
    if (lower.includes("example.com")) return false;
    if (lower.includes("domain.com")) return false;
    // Skip if it contains a slash (URL path)
    if (lower.includes("/")) return false;
    // Skip image filenames
    if (/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/.test(lower)) return false;
    // Skip common social/media domains
    const socialDomains = ["facebook.com", "instagram.com", "twitter.com", "linkedin.com", "pinterest.com", "youtube.com", "tiktok.com", "linktr.ee"];
    if (socialDomains.some((d) => lower.endsWith(`@${d}`))) return false;
    // Skip hex/hash emails
    const local = email.split("@")[0];
    if (local.length >= 20 && /^[a-f0-9]+$/.test(local)) return false;
    // Validate TLD is at least 2 chars
    const tld = email.split(".").pop();
    if (!tld || tld.length < 2) return false;
    return true;
  });

  const unique = Array.from(new Set(filtered));

  if (domain) {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "");
    // Prioritize emails matching the domain
    const domainEmails = unique.filter((e) => e.toLowerCase().includes(cleanDomain.toLowerCase()));
    return domainEmails.length > 0 ? domainEmails : unique;
  }

  return unique;
}

function extractHostname(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    // Fallback regex
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/);
    return match ? match[1] : null;
  }
}

export function generateFallbackEmails(domain: string, businessName: string): string[] {
  const cleanDomain = extractHostname(domain);
  if (!cleanDomain) return [];

  const emails = [
    `info@${cleanDomain}`,
    `contact@${cleanDomain}`,
    `hello@${cleanDomain}`,
    `support@${cleanDomain}`,
    `sales@${cleanDomain}`,
  ];

  // Try to extract first name from business name
  const words = businessName.replace(/[^\w\s]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const first = words[0].toLowerCase();
    emails.push(`${first}@${cleanDomain}`);
    if (words.length > 1) {
      const last = words[words.length - 1].toLowerCase();
      emails.push(`${first}.${last}@${cleanDomain}`);
      emails.push(`${first[0]}${last}@${cleanDomain}`);
    }
  }

  return Array.from(new Set(emails));
}

export async function scrapeWebsiteForEmail(domain: string, timeout = 8000): Promise<string[]> {
  if (!domain || !domain.includes(".")) return [];

  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const paths = ["/", "/contact", "/about", "/contact-us", "/about-us"];
  const found = new Set<string>();

  for (const path of paths) {
    try {
      const url = `${baseUrl.replace(/\/$/, "")}${path}`;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; SiteScout/1.0)",
        },
      });
      clearTimeout(id);
      if (res.ok) {
        const text = await res.text();
        const emails = extractEmailsFromHtml(text, domain);
        emails.forEach((e) => found.add(e));
        if (found.size >= 3) break;
      }
    } catch {
      // Continue to next path
    }
  }

  return Array.from(found);
}
