import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";
import { clientScript } from "./client.js";
import { externalOpportunities } from "./external-opportunities.js";

function clientHarness(hash: string) {
  const events: Record<string, () => Promise<void>> = {};
  const contentEvents: Record<string, (event: object) => Promise<void>> = {};
  const content = {
    innerHTML: "",
    addEventListener: (
      name: string,
      callback: (event: object) => Promise<void>,
    ) => {
      contentEvents[name] = callback;
    },
  };
  const location = { hash };
  const values: Record<string, string> = {};
  const fetch = vi.fn(async (url: string) => {
    if (url !== "/external-opportunities")
      throw new Error(`Unexpected API: ${url}`);
    return {
      status: 200,
      ok: true,
      json: async () => ({ items: externalOpportunities }),
    };
  });
  runInNewContext(clientScript, {
    document: {
      getElementById: (id: string) =>
        id === "content"
          ? content
          : {
              focus: () => undefined,
              addEventListener: () => undefined,
            },
    },
    window: {
      addEventListener: (name: string, callback: () => Promise<void>) => {
        events[name] = callback;
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
  });
  return { events, contentEvents, content, location, values, fetch };
}

describe("external opportunity client flow", () => {
  it("combines real filter values and keeps them selected after navigation", async () => {
    const h = clientHarness(
      "#external-jobs?experience=2%E2%80%933+years&location=Johannesburg&category=IT+support+%26+systems",
    );
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("Associate Systems Administrator");
    expect(h.content.innerHTML).not.toContain("Senior Commission Analyst</h3>");
    expect(h.content.innerHTML).toContain('value="2–3 years" selected');
    expect(h.content.innerHTML).toContain(
      'value="IT support &amp; systems" selected',
    );
    expect(h.content.innerHTML).toContain("1 source-linked role");
    Object.assign(h.values, {
      q: "commission",
      location: "",
      category: "",
      experience: "",
    });
    await h.contentEvents.submit!({
      target: { closest: () => ({ dataset: { form: "external-search" } }) },
      preventDefault: () => undefined,
    });
    expect(h.location.hash).toBe("external-jobs?q=commission");
    h.location.hash = "#" + h.location.hash;
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("Senior Commission Analyst");
    expect(h.content.innerHTML).not.toContain(
      "Associate Systems Administrator</h3>",
    );
    h.location.hash = "#external-jobs?q=no-such-role";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("No current roles match");
  });

  it("opens sourced details without creating a native application or match", async () => {
    const h = clientHarness("#external-job/mimecast-r6649");
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain(externalOpportunities[0]!.sourceUrl);
    expect(h.content.innerHTML).toContain('rel="noopener noreferrer"');
    expect(h.content.innerHTML).toContain("Checked");
    expect(h.content.innerHTML).not.toContain('data-action="apply"');
    expect(h.fetch).toHaveBeenCalledTimes(1);
    h.location.hash = "#external-job/unknown";
    await h.events.hashchange!();
    expect(h.content.innerHTML).toContain("This listing needs a fresh check");
  });
});
