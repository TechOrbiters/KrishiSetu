/**
 * Sarvam AI Client Module
 * SERVER ONLY — Must never be imported or executed in browser client components.
 */

if (typeof window !== "undefined") {
  throw new Error("SECURITY VIOLATION: Sarvam AI client must never run in browser JavaScript.");
}

export interface SarvamError {
  error: {
    code: string;
    message: string;
    provider: "sarvam";
    retryable: boolean;
  };
}

export interface SarvamRequestOptions {
  method?: "GET" | "POST" | "DELETE";
  body?: any;
  isFormData?: boolean;
  timeoutMs?: number;
}

const SARVAM_BASE_URL = "https://api.sarvam.ai";

export async function sarvamFetch<T = any>(
  endpoint: string,
  options: SarvamRequestOptions = {}
): Promise<T> {
  const apiKey = process.env.SARVAM_API_KEY;

  if (!apiKey) {
    throw new Error("[Sarvam] SARVAM_API_KEY environment variable is not configured.");
  }

  const { method = "POST", body, isFormData = false, timeoutMs = 12000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "api-subscription-key": apiKey,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${SARVAM_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[Sarvam] API Error (${response.status}) on ${endpoint}:`, errBody);
      throw {
        error: {
          code: `SARVAM_HTTP_${response.status}`,
          message: `Sarvam API request failed with status ${response.status}`,
          provider: "sarvam",
          retryable: response.status >= 500 || response.status === 429,
        },
      } as SarvamError;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw {
        error: {
          code: "SARVAM_TIMEOUT",
          message: `Sarvam request to ${endpoint} timed out after ${timeoutMs}ms`,
          provider: "sarvam",
          retryable: true,
        },
      } as SarvamError;
    }

    if (err.error?.provider === "sarvam") {
      throw err;
    }

    throw {
      error: {
        code: "SARVAM_NETWORK_ERROR",
        message: err.message || "Failed to reach Sarvam AI service.",
        provider: "sarvam",
        retryable: true,
      },
    } as SarvamError;
  }
}
