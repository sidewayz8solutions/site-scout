import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generatedSites } from "@/db/schema";
import { generateSite } from "@/lib/site-generator";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const business = body.business;

  if (!business || !business.id) {
    return NextResponse.json({ error: "Missing business data" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(generatedSites)
    .where(eq(generatedSites.businessId, business.id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ success: true, url: existing.previewUrl });
  }

  const { url } = await generateSite(
    {
      name: business.name,
      industry: business.industry,
      location: business.location,
      phone: business.phone || "",
      email: business.email || null,
      address: business.address || "",
    },
    business.id
  );

  const [site] = await db
    .insert(generatedSites)
    .values({
      businessId: business.id,
      htmlPath: url,
      previewUrl: url,
      createdAt: Date.now(),
    })
    .returning();

  return NextResponse.json({ success: true, url: site.previewUrl });
}
