import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import SerpApiPlugin from "../src/index";

const makeState = () => ({ steps: {}, envData: {}, request: {} });

describe("SerpApiPlugin", () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn();
  });

  it("declares matching node and library names and required settings", () => {
    const config = new SerpApiPlugin(makeState()).getConfig();
    const propertyNames = config.properties.map((property) => property.name);

    expect(config.name).toBe("SerpApiPlugin");
    expect(config.type).toBe(config.name);
    expect(propertyNames).toEqual(
      expect.arrayContaining(["apiKey", "query", "engine", "parameters"])
    );
  });

  it("requires an API key and query", async () => {
    const plugin = new SerpApiPlugin(makeState());

    await expect(plugin.execute({ settings: { query: "coffee" } } as any)).rejects.toThrow(
      /api key/i
    );
    await expect(plugin.execute({ settings: { apiKey: "test-key" } } as any)).rejects.toThrow(
      /search query/i
    );
  });

  it("sends the engine, query, key, and additional parameters", async () => {
    const fetchMock = global.fetch as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ organic_results: [{ title: "Coffee" }] }),
    });

    const plugin = new SerpApiPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        apiKey: "test-key",
        query: "coffee shops",
        engine: "bing",
        parameters: '{"location":"Austin, Texas","count":5}',
      },
    } as any);

    expect(result.ok).toBe(true);
    expect(result.data.organic_results[0].title).toBe("Coffee");

    const requestedUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(requestedUrl.origin + requestedUrl.pathname).toBe(
      "https://serpapi.com/search.json"
    );
    expect(requestedUrl.searchParams.get("api_key")).toBe("test-key");
    expect(requestedUrl.searchParams.get("engine")).toBe("bing");
    expect(requestedUrl.searchParams.get("q")).toBe("coffee shops");
    expect(requestedUrl.searchParams.get("output")).toBe("json");
    expect(requestedUrl.searchParams.get("location")).toBe("Austin, Texas");
    expect(requestedUrl.searchParams.get("count")).toBe("5");
  });

  it("rejects invalid additional parameters and protected parameter overrides", async () => {
    const plugin = new SerpApiPlugin(makeState());

    await expect(
      plugin.execute({
        settings: {
          apiKey: "test-key",
          query: "coffee",
          parameters: "not-json",
        },
      } as any)
    ).rejects.toThrow(/valid JSON/i);

    await expect(
      plugin.execute({
        settings: {
          apiKey: "test-key",
          query: "coffee",
          parameters: '{"api_key":"other-key"}',
        },
      } as any)
    ).rejects.toThrow(/managed by the node/i);
  });

  it("returns SerpApi errors and network failures as structured errors", async () => {
    const fetchMock = global.fetch as jest.Mock;
    const plugin = new SerpApiPlugin(makeState());

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: "Invalid API key" }),
    });
    const apiError = await plugin.execute({
      settings: { apiKey: "bad-key", query: "coffee" },
    } as any);
    expect(apiError).toMatchObject({
      ok: false,
      error: "Invalid API key",
      status: 401,
    });

    fetchMock.mockRejectedValue(new Error("Network failure"));
    const networkError = await plugin.execute({
      settings: { apiKey: "test-key", query: "coffee" },
    } as any);
    expect(networkError).toMatchObject({ ok: false, error: "Network failure" });
  });
});
