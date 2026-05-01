// Re-export from each protected page to force Next.js into server-side
// rendering instead of static prerendering. On Vercel, statically
// prerendered Pages Router pages are served from CDN as static files and
// middleware does NOT fire on those hits — that lets anonymous users
// pull the dashboard HTML shell. Marking pages dynamic puts them on the
// function path, which middleware always covers.
//
// Usage:
//   import { getServerSideProps } from "@/lib/force-dynamic";
//   export { getServerSideProps };
//
// The component itself is unchanged — props are empty and the page
// continues to fetch its real data client-side.

import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};
