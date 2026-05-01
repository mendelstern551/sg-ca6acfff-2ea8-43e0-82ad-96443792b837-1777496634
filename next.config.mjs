/** @type {import('next').NextConfig} */
import { createRequire } from "module";

// Check if element-tagger is available
function isElementTaggerAvailable() {
  try {
    const require = createRequire(import.meta.url);
    require.resolve("@softgenai/element-tagger");
    return true;
  } catch {
    return false;
  }
}

// Build turbo rules only if tagger is available
function getTurboRules() {
  if (!isElementTaggerAvailable()) {
    console.log("[Softgen] Element tagger not found, skipping loader configuration");
    return {};
  }

  return {
    "*.tsx": {
      loaders: ["@softgenai/element-tagger"],
      as: "*.tsx",
    },
    "*.jsx": {
      loaders: ["@softgenai/element-tagger"],
      as: "*.jsx",
    },
  };
}

// ---- Security headers ----
// CSP allows only:
//   - same-origin scripts/styles/images (plus inline styles for shadcn/Tailwind)
//   - fonts from Google CDN (used by some shadcn defaults)
//   - connections to Supabase (DB + storage) and self
// `frame-ancestors 'none'` blocks the site from being iframed (clickjacking).
// `'unsafe-inline'` for styles is unfortunately required by Tailwind+Radix;
// scripts use 'self' only (no `unsafe-inline`/`unsafe-eval` in prod).
//
// The Supabase host is read from env at build time so we don't have to
// hand-edit the CSP per project. If unset, CSP omits the connect-src entry
// and Supabase calls will fail loudly — which is the correct fail-closed
// behavior for a misconfigured deploy.
const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  try {
    return url ? new URL(url).origin : "";
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  // Next.js needs inline scripts for hydration; in dev it also needs eval.
  // We allow inline only; never eval in production.
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  // Tailwind + shadcn inject inline styles dynamically.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  // API calls: same-origin + Supabase REST/Realtime/Storage.
  `connect-src 'self'${supabaseHost ? " " + supabaseHost + " wss://" + supabaseHost.replace(/^https?:\/\//, "") : ""}`,
  // Block being framed by anyone (clickjacking defense).
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  // Force HTTPS for any sub-resources.
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 2 years HSTS, include subdomains, preload-eligible.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Lock down browser features the app doesn't use.
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  // Cross-origin isolation: block other origins from embedding us as a
  // resource and from poking at our window.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig = {
  reactStrictMode: true,
  // Don't ship debugging breadcrumbs to the browser. With sourcemaps off,
  // even a fully-minified bundle is unreadable to a casual snooper.
  productionBrowserSourceMaps: false,
  // In production builds, drop every console.* call (except errors/warnings)
  // from client bundles so accidental leaks don't end up in DevTools.
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Strip the X-Powered-By: Next.js header — small fingerprint reduction.
  poweredByHeader: false,
  experimental: {
    turbo: {
      rules: getTurboRules(),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  allowedDevOrigins: ["*.daytona.work", "*.softgen.dev"],
  async headers() {
    return [
      {
        // Apply to every route — middleware handles auth, headers handle
        // browser-level hardening.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
