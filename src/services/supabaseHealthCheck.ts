
import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  isHealthy: boolean;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export const supabaseHealthCheck = {
  async checkConnection(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    
    try {
      // Test 1: Simple SELECT query to verify connection
      const { data, error: selectError, status } = await supabase
        .from("buildings")
        .select("id")
        .limit(1);

      if (selectError) {
        console.error("Supabase connection error:", {
          message: selectError.message,
          status: selectError.status,
          code: selectError.code,
          timestamp
        });

        // Check if it's an auth error
        if (selectError.message?.includes("401") || selectError.message?.includes("Unauthorized")) {
          return {
            isHealthy: false,
            message: "Supabase authentication failed. API key may be invalid or expired.",
            timestamp,
            details: {
              error: "AUTH_FAILED",
              httpStatus: selectError.status
            }
          };
        }

        // Check if it's a permission/RLS error
        if (selectError.message?.includes("403") || selectError.message?.includes("Forbidden")) {
          return {
            isHealthy: false,
            message: "Permission denied. Row-level security may be misconfigured.",
            timestamp,
            details: {
              error: "PERMISSION_DENIED",
              httpStatus: selectError.status
            }
          };
        }

        // Generic network error
        return {
          isHealthy: false,
          message: `Supabase connection failed: ${selectError.message}`,
          timestamp,
          details: {
            error: "NETWORK_ERROR",
            errorMessage: selectError.message,
            status
          }
        };
      }

      return {
        isHealthy: true,
        message: "Supabase connection healthy",
        timestamp,
        details: { httpStatus: status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Unexpected error in health check:", { error: errorMessage, timestamp });

      return {
        isHealthy: false,
        message: `Connection check failed: ${errorMessage}`,
        timestamp,
        details: {
          error: "UNEXPECTED_ERROR",
          errorMessage
        }
      };
    }
  },

  async validateApiKey(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return {
        isHealthy: false,
        message: "Supabase URL or API key not configured",
        timestamp,
        details: { error: "CONFIG_MISSING" }
      };
    }

    try {
      const response = await fetch(`${url}/rest/v1/`, {
        method: "GET",
        headers: {
          "apikey": key,
          "Authorization": `Bearer ${key}`
        }
      });

      if (response.status === 401) {
        return {
          isHealthy: false,
          message: "API key is invalid or expired",
          timestamp,
          details: { error: "INVALID_API_KEY", httpStatus: 401 }
        };
      }

      if (response.status === 200) {
        return {
          isHealthy: true,
          message: "API key is valid",
          timestamp,
          details: { httpStatus: 200 }
        };
      }

      return {
        isHealthy: false,
        message: `API validation returned status ${response.status}`,
        timestamp,
        details: { httpStatus: response.status }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        isHealthy: false,
        message: `API key validation failed: ${errorMessage}`,
        timestamp,
        details: { error: "VALIDATION_FAILED", errorMessage }
      };
    }
  }
};
