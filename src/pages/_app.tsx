import { Toaster } from "@/components/ui/toaster";
import { CommandPalette } from "@/components/CommandPalette";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { ThemeProvider } from "next-themes";
import "@/styles/globals.css";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
    >
      <AppErrorBoundary>
        <Component {...pageProps} />
        <CommandPalette />
      </AppErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}
