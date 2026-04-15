import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { searchRealBusinesses } from "@/lib/real-search";
// Email scraping removed to keep search fast; emails can be added on-demand
import { eq, and } from "drizzle-orm";

function cleanWebsiteUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes(".")) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    // Only keep origin (protocol + hostname), strip paths
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return trimmed;
  }
}

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry") || "";
  const location = searchParams.get("location") || "";

  if (!industry || !location) {
    return NextResponse.json({ error: "Missing industry or location" }, { status: 400 });
  }

  // Check cache first
  const existing = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.industry, industry), eq(businesses.location, location)));

  if (existing.length > 0) {
    return NextResponse.json({ businesses: existing });
  }

  try {
    console.log(`[Yelp] Searching: ${industry} in ${location}`);
    const results = await searchRealBusinesses(industry, location, 50);
    console.log(`[Yelp] Found ${results.length} businesses`);

    if (results.length === 0) {
      return NextResponse.json({ businesses: [] });
    }

    const inserted: (typeof businesses.$inferSelect)[] = [];

    for (const r of results) {
      const website = cleanWebsiteUrl(r.website);
      const hasWebsite = !!website;

      const email = r.email;

      const [row] = await db
        .insert(businesses)
        .values({
          name: r.name,
          industry: r.industry,
          location: r.location,
          phone: r.phone,
          email,
          address: r.address,
          website,
          hasWebsite,
          createdAt: Date.now(),
        })
        .returning();
      inserted.push(row);
    }

    return NextResponse.json({ businesses: inserted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Yelp] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
