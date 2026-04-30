import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

function FallbackUI({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="max-w-md w-full rounded-lg border bg-white dark:bg-slate-900 p-6 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="rounded-full bg-rose-100 dark:bg-rose-900/40 p-2 shrink-0">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h2 className="font-semibold text-lg">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mt-1">
              An unexpected error broke this view. Your data is safe — try resetting or reloading.
            </p>
          </div>
        </div>
        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40 mb-4">
          {String(error?.message || error)}
        </pre>
        <div className="flex gap-2">
          <Button onClick={resetErrorBoundary}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try again
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Wraps the app so an unhandled component error shows a recovery screen
 *  instead of a blank white page. Logs the error to the console. */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={FallbackUI}
      onError={(err, info) => {
        console.error("[AppErrorBoundary]", err, info);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
