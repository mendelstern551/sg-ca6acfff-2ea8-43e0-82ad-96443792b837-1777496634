// Public page. POSTs the email to /api/auth/forgot-password which always
// returns 200 — we just show a generic confirmation regardless so we don't
// leak whether the address is the real admin email.

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // We always treat 200 the same way to avoid enumeration; non-200 is
      // unexpected (likely a 4xx for missing email).
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Couldn't send reset email");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mb-3">
            {sent ? (
              <MailCheck className="h-6 w-6 text-teal-700 dark:text-teal-300" />
            ) : (
              <KeyRound className="h-6 w-6 text-teal-700 dark:text-teal-300" />
            )}
          </div>
          <CardTitle>{sent ? "Check your inbox" : "Reset your password"}</CardTitle>
          <CardDescription>
            {sent
              ? "If that email is on file, a reset link is on its way. The link expires in 30 minutes."
              : "Enter your admin email and we'll send a reset link from info@troutlakeresort.ca."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Didn't get it? Check spam, then{" "}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setError(null);
                  }}
                  className="text-teal-700 dark:text-teal-300 hover:underline"
                >
                  try again
                </button>
                .
              </p>
              <Link
                href="/login"
                className="block text-sm text-teal-700 dark:text-teal-300 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <div className="text-center text-sm">
                <Link
                  href="/login"
                  className="text-teal-700 dark:text-teal-300 hover:underline"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
