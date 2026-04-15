import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { scrapeWebsiteForEmail, generateFallbackEmails, extractEmailsFromHtml } from "@/lib/email-extractor";
import { findBusinessWebPresences } from "@/lib/brave-search";
import { eq } from "drizzle-orm";

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  if (!lower || lower.length > 60) return false;
  if (lower.includes("/")) return false;
  if (/\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/.test(lower)) return false;
  const socialDomains = ["facebook.com", "instagram.com", "twitter.com", "linkedin.com", "pinterest.com", "youtube.com", "tiktok.com", "linktr.ee"];
  if (socialDomains.some((d) => lower.endsWith(`@${d}`))) return false;
  if (lower.includes("example.com") || lower.includes("domain.com")) return false;
  if (lower.includes("noreply") || lower.includes("no-reply") || lower.includes("donotreply")) return false;
  const tld = lower.split(".").pop();
  if (!tld || tld.length < 2) return false;
  return true;
}

async function scrapeUrlForEmail(url: string, timeout = 5000): Promise<string[]> {
  try {
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
      return extractEmailsFromHtml(text);
    }
  } catch {
    // ignore
  }
  return [];
}

export async function POST(req: NextRequest) {
  const { businessId, business } = await req.json();
  if (!businessId || !business) {
    return NextResponse.json({ error: "Missing business data" }, { status: 400 });
  }

  // Try to update DB if it exists
  try {
    const [dbBusiness] = await db.select().from(businesses).where(eq(businesses.id, businessId));
    if (dbBusiness?.email) {
      return NextResponse.json({ email: dbBusiness.email });
    }
  } catch {
    // DB might be ephemeral, ignore
  }

  let email: string | null = null;

  if (business.website) {
    const scraped = await scrapeWebsiteForEmail(business.website, 6000);
    if (scraped.length > 0) {
      email = scraped[0];
    } else {
      const fallbacks = generateFallbackEmails(business.website, business.name);
      email = fallbacks[0] || null;
    }
  } else {
    const urls = await findBusinessWebPresences(business.name, business.location);
    const found = new Set<string>();
    for (const url of urls.slice(0, 3)) {
      const scraped = await scrapeUrlForEmail(url, 5000);
      scraped.forEach((e) => found.add(e));
      if (found.size > 0) break;
    }
    if (found.size > 0) {
      email = Array.from(found)[0];
    }
  }

  if (email && !isValidEmail(email)) {
    email = null;
  }

  if (email) {
    try {
      await db.update(businesses).set({ email }).where(eq(businesses.id, businessId));
    } catch {
      // ignore DB write failures on ephemeral storage
    }
  }

  return NextResponse.json({ email });
}
