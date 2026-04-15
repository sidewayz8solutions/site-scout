import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { scrapeWebsiteForEmail, generateFallbackEmails } from "@/lib/email-extractor";
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

export async function POST(req: NextRequest) {
  const { businessId } = await req.json();
  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId));
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (business.email) {
    return NextResponse.json({ email: business.email });
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
  }

  if (email && !isValidEmail(email)) {
    email = null;
  }

  if (email) {
    await db.update(businesses).set({ email }).where(eq(businesses.id, businessId));
  }

  return NextResponse.json({ email });
}
