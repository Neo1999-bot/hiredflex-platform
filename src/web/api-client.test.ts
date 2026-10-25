import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createApiClient } from "./api-client.js";

const messages = {
  UNAUTHENTICATED: "Please sign in.",
  FORBIDDEN: "No company access.",
  ACTIVE_APPLICATION_EXISTS: "Already applied.",
};

describe("typed browser API transport", () => {
  it("uses a fresh session token for each same-origin call and preserves typed JSON", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify({ id: "application-1" }), { status: 201 }),
      );
    const getToken = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");
    const api = createApiClient({ fetcher, getToken, messages });
    const result = await api<{ id: string }>(
      "/candidate/applications",
      "POST",
      { vacancyId: "vacancy-1" },
    );
    expectTypeOf(result).toEqualTypeOf<{ id: string }>();
    expect(result.id).toBe("application-1");
    expect(fetcher).toHaveBeenCalledWith(
      "/candidate/applications",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vacancyId: "vacancy-1" }),
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          Authorization: "Bearer first",
          "Content-Type": "application/json",
        },
      }),
    );
    fetcher.mockResolvedValue(new Response("[]"));
    await api("/candidate/applications");
    expect(fetcher.mock.calls[1]![1]!.headers).toEqual({
      Authorization: "Bearer second",
    });
  });

  it.each([401, 403])(
    "reports HTTP %s even when the body is HTML",
    async (status) => {
      const api = createApiClient({
        fetcher: vi
          .fn<typeof fetch>()
          .mockResolvedValue(
            new Response("<html>private gateway data</html>", { status }),
          ),
        getToken: async () => null,
        messages,
      });
      await expect(api("/employer/vacancies")).rejects.toMatchObject({
        status,
        code: status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
        message: status === 401 ? messages.UNAUTHENTICATED : messages.FORBIDDEN,
      });
    },
  );

  it("preserves the duplicate contract without displaying server messages", async () => {
    const api = createApiClient({
      fetcher: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              code: "ACTIVE_APPLICATION_EXISTS",
              message: "private details",
            },
          }),
          { status: 409 },
        ),
      ),
      getToken: async () => null,
      messages,
    });
    await expect(
      api("/candidate/applications", "POST", { vacancyId: "vacancy-1" }),
    ).rejects.toMatchObject({
      code: "ACTIVE_APPLICATION_EXISTS",
      status: 409,
      message: "Already applied.",
    });
  });

  it("handles empty delete responses and sends no authentication when signed out", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const api = createApiClient({
      fetcher,
      getToken: async () => null,
      messages,
    });
    expect(await api("/candidate/skills/skill-1", "DELETE")).toBeNull();
    expect(fetcher.mock.calls[0]![1]!.headers).toEqual({});
  });

  it.each([
    "https://other.example/private",
    "//other.example/private",
    "/\\other.example/private",
  ])(
    "rejects external destinations before requesting a token: %s",
    async (path) => {
      const fetcher = vi.fn<typeof fetch>();
      const getToken = vi.fn();
      const api = createApiClient({ fetcher, getToken, messages });
      await expect(api(path)).rejects.toMatchObject({
        code: "INVALID_API_DESTINATION",
      });
      expect(getToken).not.toHaveBeenCalled();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("reports unreadable successful responses and network failures without raw details", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("<html>not JSON</html>"))
      .mockRejectedValueOnce(new Error("private endpoint details"));
    const api = createApiClient({
      fetcher,
      getToken: async () => null,
      messages,
    });
    await expect(api("/vacancies")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      status: 200,
    });
    await expect(api("/vacancies")).rejects.toMatchObject({
      code: "NETWORK_UNAVAILABLE",
      status: 0,
      message: "Check your connection and try again.",
    });
  });

  it("stops before fetch when token refresh fails", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const api = createApiClient({
      fetcher,
      getToken: async () => {
        throw new Error("private provider details");
      },
      messages,
    });
    await expect(api("/auth/session")).rejects.toMatchObject({
      code: "SESSION_UNAVAILABLE",
      status: 0,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
