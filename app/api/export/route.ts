import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { searchRealBusinesses } from "@/lib/real-search";

function toCsv(rows: Record<string, string | number | null | boolean>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const str = String(val ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

function cleanWebsiteUrl(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes(".")) return null;
  try {
    const u = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    return `${u.protocol}//${u.hostname}`;
  } catch {
    return trimmed;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry") || "";
  const location = searchParams.get("location") || "";
  const filter = searchParams.get("filter") || "all";

  if (!industry || !location) {
    return NextResponse.json({ error: "Missing industry or location" }, { status: 400 });
  }

  let rows = await db
    .select({
      name: businesses.name,
      industry: businesses.industry,
      location: businesses.location,
      phone: businesses.phone,
      email: businesses.email,
      address: businesses.address,
      website: businesses.website,
      hasWebsite: businesses.hasWebsite,
    })
    .from(businesses)
    .where(and(eq(businesses.industry, industry), eq(businesses.location, location)));

  if (rows.length === 0) {
    try {
      const results = await searchRealBusinesses(industry, location, 50);
      const inserted = [];
      for (const r of results) {
        const website = cleanWebsiteUrl(r.website);
        const hasWebsite = !!website;
        const [row] = await db
          .insert(businesses)
          .values({
            name: r.name,
            industry: r.industry,
            location: r.location,
            phone: r.phone,
            email: r.email,
            address: r.address,
            website,
            hasWebsite,
            createdAt: Date.now(),
          })
          .returning();
        inserted.push(row);
      }
      rows = inserted;
    } catch {
      // fall through to empty csv
    }
  }

  if (filter === "no-website") {
    rows = rows.filter((r) => !r.hasWebsite);
  } else if (filter === "has-website") {
    rows = rows.filter((r) => r.hasWebsite);
  }

  const csv = toCsv(
    rows.map((r) => ({
      Name: r.name,
      Industry: r.industry,
      Location: r.location,
      Phone: r.phone,
      Email: r.email,
      Address: r.address,
      Website: r.website,
      "Has Website": r.hasWebsite ? "Yes" : "No",
    }))
  );

  const safeIndustry = industry.toLowerCase().replace(/\s+/g, "-");
  const safeLocation = location.toLowerCase().replace(/[,\s]+/g, "-");
  const filename = `site-scout-${safeIndustry}-${safeLocation}-${filter}.csv`;

  return new NextResponse(csv || "Name,Industry,Location,Phone,Email,Address,Website,Has Website\n", {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
