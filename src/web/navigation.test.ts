import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../app.js";
import type { Database } from "../db/client.js";
import { clientScript } from "./client.js";
import { publicPages, siteFooter } from "./public-pages.js";

function workspaceHarness(role = "Employer", records = true, denied = 0) {
  const events: Record<string, () => Promise<void>> = {};
  const actions: Record<string, (event: object) => Promise<void>> = {};
  const content = {
    innerHTML: "",
    addEventListener: (name: string, cb: (e: object) => Promise<void>) => {
      actions[name] = cb;
    },
  };
  const location = { hash: "#employer" };
  const values: Record<string, string> = {};
  const vacancies = records
    ? [
        {
          id: "vacancy-a",
          title: "Support <role>",
          companyId: "company-a",
          status: "OPEN",
        },
        {
          id: "vacancy-b",
          title: "Draft vacancy",
          companyId: "company-a",
          status: "DRAFT",
        },
        {
          id: "vacancy-c",
          title: "Closed vacancy",
          companyId: "company-a",
          status: "CLOSED",
        },
      ]
    : [];
  const fetch = vi.fn(async (url: string) => {
    if (denied && url === "/employer/vacancies")
      return {
        status: denied,
        ok: false,
        json: async () => ({
          error: { code: denied === 401 ? "UNAUTHENTICATED" : "FORBIDDEN" },
        }),
      };
    let data: unknown;
    if (url === "/site-config") data = { authenticationEnabled: true };
    else if (url === "/auth/session")
      data = {
        displayName: "Employer <name>",
        roleAssignments: [{ role, companyId: "company-a" }],
      };
    else if (url === "/employer/vacancies") data = vacancies;
    else if (url === "/employer/companies")
      data = [{ id: "company-a", name: "Test <company>" }];
    else if (url === "/employer/vacancies/vacancy-a/applications")
      data = [
        {
          id: "application-a",
          candidateId: "candidate-one",
          currentStatus: "Applied",
          submittedAt: "2026-10-25",
        },
        {
          id: "application-b",
          candidateId: "candidate-two",
          currentStatus: "Shortlisted",
          submittedAt: "2026-10-25",
        },
      ];
    else throw new Error(`Unexpected API request: ${url}`);
    return { status: 200, ok: true, json: async () => data };
  });
  runInNewContext(clientScript, {
    document: {
      getElementById: (id: string) =>
        id === "content"
          ? content
          : { focus: () => undefined, addEventListener: () => undefined },
    },
    window: {
      Clerk: {
        session: { id: "test-session", getToken: async () => "test-only" },
        load: async () => undefined,
        addListener: () => undefined,
      },
      addEventListener: (name: string, cb: () => Promise<void>) => {
        events[name] = cb;
      },
    },
    location,
    fetch,
    URL,
    URLSearchParams,
    FormData: class {
      [Symbol.iterator]() {
        return Object.entries(values)[Symbol.iterator]();
      }
    },
    setTimeout: () => 1,
    clearTimeout: () => undefined,
  });
  return { content, location, fetch, events, actions, values };
}

describe("employer workspace navigation", () => {
  it("shows real loaded vacancy counts and preserves the draft form", async () => {
    const h = workspaceHarness();
    await h.events.load!();
    expect(h.content.innerHTML).toContain("Employer &lt;name&gt;");
    expect(h.content.innerHTML).toContain("latest 3 vacancies");
    expect(h.content.innerHTML.match(/class="score">1</g)).toHaveLength(3);
    expect(h.content.innerHTML).toContain("Support &lt;role&gt;");
    expect(h.content.innerHTML).not.toContain("Interviews scheduled");
    h.location.hash = "#employer?tab=vacancies";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain('data-form="vacancy"');
    expect(h.content.innerHTML).toContain('name="companyId"');
    expect(h.content.innerHTML).toContain("Test &lt;company&gt;");
  });

  it("shows a vacancy-scoped, read-only pipeline using approved statuses", async () => {
    const h = workspaceHarness();
    h.location.hash = "#employer?tab=pipeline&vacancy=vacancy-a";
    await h.events.load!();
    expect(h.content.innerHTML).toContain("Read-only application stages");
    for (const stage of [
      "Applied",
      "Reviewing",
      "Shortlisted",
      "Rejected",
      "Withdrawn",
    ])
      expect(h.content.innerHTML).toContain(stage);
    expect(h.content.innerHTML).not.toContain('data-action="shortlist"');
    expect(h.content.innerHTML).not.toContain('data-action="reject"');
    expect(
      h.fetch.mock.calls.some(([url]) =>
        url.includes("/recruiter/applications"),
      ),
    ).toBe(false);
    h.location.hash = "#employer?tab=applicants&vacancy=foreign-id";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("Choose an authorised vacancy");
    expect(h.fetch.mock.calls.some(([url]) => url.includes("foreign-id"))).toBe(
      false,
    );
  });

  it("supports vacancy selection, company/access views and truthful empty states", async () => {
    const h = workspaceHarness();
    await h.events.load!();
    Object.assign(h.values, { tab: "applicants", vacancy: "vacancy-a" });
    await h.actions.submit!({
      target: { closest: () => ({ dataset: { form: "employer-filter" } }) },
      preventDefault: () => undefined,
    });
    expect(h.location.hash).toBe("employer?tab=applicants&vacancy=vacancy-a");
    h.location.hash = "#" + h.location.hash;
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("candidate-one".slice(0, 8));
    h.location.hash = "#employer?tab=company";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("Test &lt;company&gt;");
    h.location.hash = "#employer?tab=settings";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain(
      "Public signup and workspace navigation cannot grant additional roles",
    );
    const empty = workspaceHarness("Employer", false);
    empty.location.hash = "#employer?tab=pipeline";
    await empty.events.load!();
    expect(empty.content.innerHTML).toContain("No vacancies yet");
  });

  it.each([401, 403])(
    "renders the API access error for HTTP %s without data",
    async (status) => {
      const h = workspaceHarness("Employer", true, status);
      await h.events.load!();
      expect(h.content.innerHTML).toContain(
        status === 401
          ? "Please sign in to continue."
          : "Your account does not have access to this workspace.",
      );
      expect(h.content.innerHTML).not.toContain("Support &lt;role&gt;");
    },
  );

  it("does not grant employer access to candidates", async () => {
    const h = workspaceHarness("Candidate");
    await h.events.load!();
    expect(h.content.innerHTML).toContain("Company access required");
    expect(
      h.fetch.mock.calls.some(([url]) => url.startsWith("/employer/")),
    ).toBe(false);
  });
});

describe("public welcome and footer links", () => {
  it("renders every new public destination without authentication or a company API", async () => {
    const h = workspaceHarness();
    for (const page of Object.keys(publicPages)) {
      h.location.hash = "#" + page;
      await h.events.hashchange!();
      expect(h.content.innerHTML).toBe(publicPages[page]);
    }
    expect(h.fetch).not.toHaveBeenCalled();
    expect(siteFooter).toContain('href="#recruiter"');
    expect(siteFooter).toContain('href="#employer-access"');
    expect(siteFooter).toContain('href="#support"');
  });

  it("serves the grouped footer and keyboard-operable menu in the real shell", async () => {
    const app = buildApp({
      db: {} as Database,
      logger: false,
      checkDatabase: async () => undefined,
    });
    try {
      const response = await app.inject({ method: "GET", url: "/" });
      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(siteFooter);
      expect(response.body).toContain("<summary>Menu</summary>");
      expect(response.body).toContain('aria-label="Trust footer links"');
      expect(response.body).not.toContain("sample data");
    } finally {
      await app.close();
    }
  });
});
