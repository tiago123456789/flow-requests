import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import FirecrawlPlugin from "../src/index";

const makeState = () => ({ steps: {}, envData: {}, request: {} });

describe("FirecrawlPlugin — getConfig()", () => {
  it("has matching name and type", () => {
    const plugin = new FirecrawlPlugin(makeState());
    const config = plugin.getConfig();
    expect(config.name).toBe("FirecrawlPlugin");
    expect(config.type).toBe("FirecrawlPlugin");
    expect(config.name).toBe(config.type);
  });

  it("has a non-empty description", () => {
    const plugin = new FirecrawlPlugin(makeState());
    const config = plugin.getConfig();
    expect(config.description.length).toBeGreaterThan(0);
  });

  it("declares required apiKey and url properties", () => {
    const plugin = new FirecrawlPlugin(makeState());
    const { properties } = plugin.getConfig();
    const names = properties.map((p) => p.name);
    expect(names).toContain("apiKey");
    expect(names).toContain("url");
    expect(names).toContain("format");
  });

  it("format property has expected options", () => {
    const plugin = new FirecrawlPlugin(makeState());
    const { properties } = plugin.getConfig();
    const formatProp = properties.find((p) => p.name === "format");
    expect(formatProp).toBeDefined();
    const values = (formatProp!.options ?? []).map((o) => o.value);
    expect(values).toContain("markdown");
    expect(values).toContain("html");
    expect(values).toContain("rawHtml");
    expect(values).toContain("links");
    expect(values).toContain("screenshot");
  });
});

describe("FirecrawlPlugin — execute() validation", () => {
  it("throws when apiKey is missing", async () => {
    const plugin = new FirecrawlPlugin(makeState());
    await expect(
      plugin.execute({ settings: { url: "https://example.com" } } as any)
    ).rejects.toThrow(/api key/i);
  });

  it("throws when url is missing", async () => {
    const plugin = new FirecrawlPlugin(makeState());
    await expect(
      plugin.execute({ settings: { apiKey: "test-key" } } as any)
    ).rejects.toThrow(/url/i);
  });

  it("throws when waitFor exceeds 60000", async () => {
    const plugin = new FirecrawlPlugin(makeState());
    await expect(
      plugin.execute({
        settings: {
          apiKey: "test-key",
          url: "https://example.com",
          waitFor: "99999",
        },
      } as any)
    ).rejects.toThrow(/60000/);
  });

  it("throws when timeout is out of range", async () => {
    const plugin = new FirecrawlPlugin(makeState());
    await expect(
      plugin.execute({
        settings: {
          apiKey: "test-key",
          url: "https://example.com",
          timeout: "500",
        },
      } as any)
    ).rejects.toThrow(/timeout/i);
  });
});

describe("FirecrawlPlugin — execute() success", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    (global as any).fetch = undefined;
  });

  it("returns ok: true with markdown result on success", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          markdown: "# Hello World",
          metadata: { title: "Example", statusCode: 200 },
          warning: null,
        },
      }),
    } as any);

    const plugin = new FirecrawlPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
        format: "markdown",
      },
    } as any);

    expect(result.ok).toBe(true);
    expect(result.data.result).toBe("# Hello World");
    expect(result.data.metadata.title).toBe("Example");
  });

  it("returns ok: true with links array when format is links", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          links: ["https://example.com/page1", "https://example.com/page2"],
          metadata: { statusCode: 200 },
          warning: null,
        },
      }),
    } as any);

    const plugin = new FirecrawlPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
        format: "links",
      },
    } as any);

    expect(result.ok).toBe(true);
    expect(Array.isArray(result.data.result)).toBe(true);
    expect(result.data.result).toHaveLength(2);
  });

  it("returns ok: false when Firecrawl responds with success: false", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 402,
      json: async () => ({
        success: false,
        error: "Payment required to access this resource.",
        code: "insufficient_credits",
      }),
    } as any);

    const plugin = new FirecrawlPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
      },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/payment required/i);
    expect(result.code).toBe("insufficient_credits");
  });

  it("returns ok: false on network error", async () => {
    (global as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network failure"));

    const plugin = new FirecrawlPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
      },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/network failure/i);
  });

  it("sends the correct format in the request body", async () => {
    let capturedBody: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, opts: any) => {
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: { html: "<h1>Hello</h1>", metadata: {} },
        }),
      });
    });

    const plugin = new FirecrawlPlugin(makeState());
    await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
        format: "html",
        onlyMainContent: "false",
        proxy: "basic",
      },
    } as any);

    expect(capturedBody.formats).toEqual(["html"]);
    expect(capturedBody.onlyMainContent).toBe(false);
    expect(capturedBody.proxy).toBe("basic");
  });

  it("parses excludeTags from comma-separated string", async () => {
    let capturedBody: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, opts: any) => {
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: { markdown: "clean", metadata: {} },
        }),
      });
    });

    const plugin = new FirecrawlPlugin(makeState());
    await plugin.execute({
      settings: {
        apiKey: "fc-test-key",
        url: "https://example.com",
        excludeTags: "script, style, img",
      },
    } as any);

    expect(capturedBody.excludeTags).toEqual(["script", "style", "img"]);
  });
});
