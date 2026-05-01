import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { readSessionFromReq } from "@/lib/auth-server";

/**
 * Scheduler runner — sends `client_emails` rows where:
 *   status = "scheduled" AND scheduled_date <= NOW()
 *
 * Auth requirements (one of):
 *   - Authorization: Bearer <CRON_SECRET>   — for Vercel Cron / GitHub Actions
 *   - Valid admin session cookie            — for the manual "Send now" button
 *
 * If CRON_SECRET isn't configured, only session-authenticated callers get
 * through — fail-closed. (Previously a missing CRON_SECRET silently let the
 * world hit this endpoint and burn through SMTP quota.)
 */

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth: cron-secret bearer OR admin session. Always require ONE of them.
  const cronSecret = process.env.CRON_SECRET || "";
  const auth = req.headers.authorization || "";
  const cronOk = !!cronSecret && auth === `Bearer ${cronSecret}`;
  const sessionOk = !!readSessionFromReq(req.cookies);
  if (!cronOk && !sessionOk) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: "Server configuration error: Missing Supabase credentials" });
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return res.status(500).json({ error: "Email service not configured" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const nowIso = new Date().toISOString();

  // Fetch due scheduled emails
  const { data: due, error: fetchErr } = await admin
    .from("client_emails")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_date", nowIso)
    .limit(50);

  if (fetchErr) {
    return res.status(500).json({ error: fetchErr.message });
  }

  if (!due || due.length === 0) {
    return res.status(200).json({ sent: 0, failed: 0, skipped: 0, message: "No due scheduled emails" });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const row of due) {
    try {
      const attachmentsList: { filename: string; path: string }[] = [];
      if (row.attachment_url && row.attachment_name) {
        attachmentsList.push({ filename: row.attachment_name, path: row.attachment_url });
      }

      await transporter.sendMail({
        from: `"Trout Lake Resort" <info@troutlakeresort.ca>`,
        to: row.client_email,
        subject: row.subject,
        html: row.body,
        attachments: attachmentsList,
      });

      const { error: updErr } = await admin
        .from("client_emails")
        .update({ status: "sent", sent_date: new Date().toISOString() })
        .eq("id", row.id);

      if (updErr) {
        // Email was sent; logging the new status failed. Record but continue.
        console.warn("Failed to mark scheduled email sent:", row.id, updErr.message);
      }
      sent++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      errors.push({ id: row.id, error: message });
      // Mark as failed so we don't retry the same row forever
      await admin
        .from("client_emails")
        .update({ status: "failed" })
        .eq("id", row.id);
    }
  }

  return res.status(200).json({ sent, failed, skipped: 0, total: due.length, errors });
}
