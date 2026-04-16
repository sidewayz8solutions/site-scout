import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.FROM_EMAIL || "hello@example.com";
const SIGNATURE = process.env.GMAIL_SIGNATURE_HTML || "";

const DEFAULT_SIGNATURE = `<br><br>
<div style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;font-size:14px;color:#374151;line-height:1.5;">
  <p style="margin:0;"><strong>Benjamin</strong><br>
  Sidewayz 8 Solutions<br>
  📧 <a href="mailto:benjamin@sidewayz8solutions.com" style="color:#2563eb;text-decoration:none;">benjamin@sidewayz8solutions.com</a><br>
  🌐 <a href="https://sidewayz8solutions.com" style="color:#2563eb;text-decoration:none;">sidewayz8solutions.com</a></p>
</div>`;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!RESEND_API_KEY) {
    return { success: false, error: "Resend API key not configured" };
  }

  const signature = SIGNATURE || DEFAULT_SIGNATURE;
  const fullHtml = html + "\n" + signature;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `"Site Scout" <${FROM_EMAIL}>`,
        to,
        subject,
        html: fullHtml,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { success: false, error: data.message || `Resend error: ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}
