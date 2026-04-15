import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outreach } from "@/db/schema";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const businessId = Number(body.businessId);
  const toEmail = String(body.toEmail || "").trim();
  const subject = String(body.subject || "");
  const html = String(body.body || "");

  if (!businessId || !toEmail || !subject || !html) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const result = await sendEmail({ to: toEmail, subject, html });

  const status = result.success ? "sent" : "failed";

  let record;
  try {
    [record] = await db
      .insert(outreach)
      .values({
        businessId,
        toEmail,
        subject,
        body: html,
        status,
        sentAt: result.success ? Date.now() : undefined,
        createdAt: Date.now(),
      })
      .returning();
  } catch {
    // ephemeral DB might fail, but email still sends
  }

  return NextResponse.json({ success: result.success, record, error: result.error });
}
