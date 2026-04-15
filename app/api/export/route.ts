import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const industry = searchParams.get("industry") || "";
  const location = searchParams.get("location") || "";
  const filter = searchParams.get("filter") || "all"; // all, no-website, has-website

  if (!industry || !location) {
    return NextResponse.json({ error: "Missing industry or location" }, { status: 400 });
  }

  const conditions: ReturnType<typeof and>[] = [
    eq(businesses.industry, industry),
    eq(businesses.location, location),
  ];

  if (filter === "no-website") {
    conditions.push(eq(businesses.hasWebsite, false));
  } else if (filter === "has-website") {
    conditions.push(eq(businesses.hasWebsite, true));
  }

  const rows = await db
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
    .where(and(...conditions));

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

  const filename = `site-scout-${industry.toLowerCase().replace(/\s+/g, "-")}-${location.toLowerCase().replace(/[,\s]+/g, "-")}-${filter}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
