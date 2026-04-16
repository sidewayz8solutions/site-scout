import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, generatedSites } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateSite } from "@/lib/site-generator";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const businessId = Number(body.businessId || body.business?.id);
  const businessData = body.business || null;

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
  }

  let business = businessData;

  if (!business) {
    const [row] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
    if (!row) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }
    business = row;
  }

  const [existing] = await db
    .select()
    .from(generatedSites)
    .where(eq(generatedSites.businessId, businessId))
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
    businessId
  );

  try {
    const [site] = await db
      .insert(generatedSites)
      .values({
        businessId,
        htmlPath: url,
        previewUrl: url,
        createdAt: Date.now(),
      })
      .returning();
    return NextResponse.json({ success: true, url: site.previewUrl });
  } catch {
    return NextResponse.json({ success: true, url });
  }
}
