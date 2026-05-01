// POST /api/auth/forgot-password
// Body: { email: string }
// Always returns 200 (don't leak whether the email is the real admin) —
// only actually sends an email if the submitted email matches ADMIN_EMAIL.
// Reset link points to /reset-password?token=<...> on the same origin.

import type { NextApiRequest, NextApiResponse } from "next";
import nodemailer from "nodemailer";
import { generateResetToken, getAdminEmail } from "@/lib/auth-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function buildBaseUrl(req: NextApiRequest): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  // Fall back to the request host so this works in preview / local dev too.
  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host =
    (req.headers["x-forwarded-host"] as string) ||
    (req.headers.host as string) ||
    "admin.troutlakeresort.ca";
  return `${proto}://${host}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limit forgot-password aggressively — it sends real email and an
  // attacker would otherwise be able to spam the admin inbox or generate
  // unbounded reset tokens. 5 per IP per 30 min.
  const ip = clientIp(req);
  const rl = rateLimit(`forgot:${ip}`, { max: 5, windowMs: 30 * 60 * 1000 });
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfterSeconds));
    // Still return 200 to avoid signaling to an attacker that they're being
    // rate-limited (which would tell them they're hitting the right endpoint
    // for the right account).
    return res.status(200).json({ ok: true });
  }

  const { email } = (req.body || {}) as { email?: string };
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }

  const adminEmail = getAdminEmail();
  // Constant-ish behavior whether or not the email matches.
  if (!adminEmail || email.trim().toLowerCase() !== adminEmail) {
    // Pretend we sent it. Returning 200 prevents email-enumeration probes.
    return res
      .status(200)
      .json({ ok: true, message: "If that email is on file, a reset link is on its way." });
  }

  try {
    const { token, expiresAt } = await generateResetToken();
    const link = `${buildBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
    const SMTP_USER = process.env.SMTP_AUTH_USER;
    const SMTP_PASS = process.env.SMTP_AUTH_PASS;
    const FROM_EMAIL =
      process.env.INFO_FROM_EMAIL || "info@troutlakeresort.ca";

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error("forgot-password: SMTP not configured");
      // Still return ok=true to prevent enumeration, but log the failure.
      return res.status(200).json({ ok: true });
    }

    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    const expiresLabel = expiresAt.toLocaleString("en-US", {
      timeZone: "America/Toronto",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
        <h1 style="margin: 0 0 8px; font-size: 22px;">Reset your password</h1>
        <p style="margin: 16px 0; line-height: 1.5; color: #334155;">
          We received a request to reset the password for the
          Trout Lake Resort admin account. Click the button below to choose a
          new password. This link expires at <strong>${expiresLabel}</strong>.
        </p>
        <p style="margin: 24px 0;">
          <a href="${link}"
             style="display: inline-block; background: #0f766e; color: white; padding: 12px 22px; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="margin: 16px 0; line-height: 1.5; color: #64748b; font-size: 13px;">
          If the button doesn't work, copy this URL into your browser:<br/>
          <span style="word-break: break-all;">${link}</span>
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
        <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email — your
          password won't change.
        </p>
      </div>
    `;

    await transport.sendMail({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: "Reset your Trout Lake Resort admin password",
      html,
      text: `Reset your password using this link (expires ${expiresLabel}):\n\n${link}\n\nIf you didn't request this, ignore this email.`,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("forgot-password error:", err);
    // Still don't leak.
    return res.status(200).json({ ok: true });
  }
}
