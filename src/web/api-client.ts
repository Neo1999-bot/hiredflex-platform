export interface ApiClientFailure extends Error {
  code: string;
  status: number;
}

export interface ApiClientConfig {
  fetcher: typeof fetch;
  getToken: () => Promise<string | null | undefined>;
  messages: Readonly<Record<string, string>>;
}

/** Typed transport shared by tests and the generated browser script.
 * The implementation is self-contained so its compiled function can be shipped
 * by the existing same-origin script route without another frontend framework.
 */
export function createApiClient(config: ApiClientConfig) {
  return async <Result = unknown>(
    path: string,
    method: "GET" | "POST" | "DELETE" = "GET",
    body?: unknown,
  ): Promise<Result> => {
    // Never send Clerk credentials to absolute or protocol-relative URLs.
    if (
      !path.startsWith("/") ||
      path.startsWith("//") ||
      new URL(path, "https://hiredflex.invalid").origin !==
        "https://hiredflex.invalid"
    ) {
      throw Object.assign(new Error("Invalid API destination."), {
        code: "INVALID_API_DESTINATION",
        status: 0,
      });
    }
    const headers: Record<string, string> = {};
    let token: string | null | undefined;
    try {
      token = await config.getToken();
    } catch {
      throw Object.assign(new Error("Refresh your sign-in and try again."), {
        code: "SESSION_UNAVAILABLE",
        status: 0,
      });
    }
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let response: Response;
    try {
      response = await config.fetcher(path, {
        method,
        headers,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        credentials: "same-origin",
      });
    } catch {
      throw Object.assign(new Error("Check your connection and try again."), {
        code: "NETWORK_UNAVAILABLE",
        status: 0,
      });
    }
    if (response.status === 204 && response.ok) return null as Result;
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    if (!response.ok) {
      const serverCode =
        data &&
        typeof data === "object" &&
        "error" in data &&
        data.error &&
        typeof data.error === "object" &&
        "code" in data.error &&
        typeof data.error.code === "string"
          ? data.error.code
          : "REQUEST_FAILED";
      const code =
        response.status === 401
          ? "UNAUTHENTICATED"
          : response.status === 403
            ? "FORBIDDEN"
            : serverCode;
      throw Object.assign(
        new Error(
          (Object.hasOwn(config.messages, code)
            ? config.messages[code]
            : undefined) ??
            "Unable to complete this request. Please try again.",
        ),
        { code, status: response.status },
      );
    }
    if (data === null) {
      throw Object.assign(
        new Error(
          "The server returned an unreadable response. Please try again.",
        ),
        {
          code: "INVALID_RESPONSE",
          status: response.status,
        },
      );
    }
    return data as Result;
  };
}
