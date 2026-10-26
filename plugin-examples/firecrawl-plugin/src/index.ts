import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

/**
 * FirecrawlPlugin — Scrapes a URL using the Firecrawl v2 API
 * (https://docs.firecrawl.dev/api-reference/endpoint/scrape)
 *
 * Endpoint: POST https://api.firecrawl.dev/v2/scrape
 * Auth: Bearer token
 */
class FirecrawlPlugin extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "FirecrawlPlugin",
      type: "FirecrawlPlugin",
      description:
        "Scrape any URL using Firecrawl and return the content as markdown, HTML, raw HTML, links, or a screenshot.",
      ai_description:
        "Use this node to scrape the content of a web page via the Firecrawl v2 API. Provide a URL and choose the desired output format (markdown, html, rawHtml, links, screenshot). The scraped content is returned in data.result and page metadata in data.metadata.",
      properties: [
        // ── Authentication ─────────────────────────────────────────────────
        {
          label: "API Key",
          name: "apiKey",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Your Firecrawl API key. Store it in an environment variable and reference it with a Flow Requests expression.",
          ai_description:
            "Your Firecrawl API key. Store it as an environment variable and reference with {{ state.envData.FIRECRAWL_API_KEY }}.",
        },

        // ── Target URL ─────────────────────────────────────────────────────
        {
          label: "URL",
          name: "url",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "The full URL of the web page to scrape. Supports Flow Requests expressions.",
          ai_description:
            "The URL to scrape. Supports {{ }} expressions, e.g. {{ steps.prevNode.output.data.url }}.",
        },

        // ── Output format ──────────────────────────────────────────────────
        {
          label: "Format",
          name: "format",
          type: "select",
          required: true,
          default: "markdown",
          // @ts-ignore
          info: "Choose the format returned for the scraped page content.",
          options: [
            { label: "Markdown", value: "markdown" },
            { label: "HTML", value: "html" },
            { label: "Raw HTML", value: "rawHtml" },
            { label: "Links", value: "links" },
            { label: "Screenshot", value: "screenshot" },
          ],
          ai_description:
            "Output format to request from Firecrawl. 'markdown' is the most useful for text extraction. 'links' returns an array of URLs found on the page.",
        },

        // ── Only main content ──────────────────────────────────────────────
        {
          label: "Only Main Content",
          name: "onlyMainContent",
          type: "select",
          required: false,
          default: "true",
          // @ts-ignore
          info: "Choose whether Firecrawl removes navigation, headers, and footers to focus on the main page content.",
          options: [
            { label: "Yes (strip headers/footers/navs)", value: "true" },
            { label: "No (return full page)", value: "false" },
          ],
          ai_description:
            "When true, Firecrawl removes headers, navigation bars, and footers from the output. Defaults to true.",
        },

        // ── Wait for (ms) ──────────────────────────────────────────────────
        {
          label: "Wait For (ms)",
          name: "waitFor",
          type: "text",
          required: false,
          default: "0",
          // @ts-ignore
          info: "Additional wait time in milliseconds before fetching the page. Useful for single-page applications; maximum 60000.",
          ai_description:
            "Milliseconds to wait before fetching content, in addition to Firecrawl's smart wait. Useful for SPAs. Maximum 60000.",
        },

        // ── Timeout (ms) ──────────────────────────────────────────────────
        {
          label: "Timeout (ms)",
          name: "timeout",
          type: "text",
          required: false,
          default: "60000",
          // @ts-ignore
          info: "Maximum time in milliseconds to wait for the scrape request, between 1000 and 300000.",
          ai_description:
            "Request timeout in milliseconds (1000–300000). Defaults to 60000.",
        },

        // ── Proxy ──────────────────────────────────────────────────────────
        {
          label: "Proxy",
          name: "proxy",
          type: "select",
          required: false,
          default: "auto",
          // @ts-ignore
          info: "Select the proxy strategy. Auto is recommended and can retry with enhanced proxies when needed.",
          options: [
            {
              label: "Auto (retry with enhanced if basic fails)",
              value: "auto",
            },
            { label: "Basic (fast, standard sites)", value: "basic" },
            {
              label: "Enhanced (advanced anti-bot sites)",
              value: "enhanced",
            },
          ],
          ai_description:
            "Proxy strategy. 'auto' is recommended — Firecrawl retries with enhanced proxies at no extra cost if basic fails.",
        },

        // ── Mobile emulation ───────────────────────────────────────────────
        {
          label: "Mobile Emulation",
          name: "mobile",
          type: "select",
          required: false,
          default: "false",
          // @ts-ignore
          info: "Choose whether Firecrawl should render the page using a mobile device profile.",
          options: [
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ],
          ai_description:
            "Emulate a mobile device. Useful for testing responsive pages.",
        },

        // ── Exclude tags ───────────────────────────────────────────────────
        {
          label: "Exclude HTML Tags (comma-separated)",
          name: "excludeTags",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Comma-separated HTML tag names to exclude from scraped content, for example script,style,img.",
          ai_description:
            "Comma-separated list of HTML tags to exclude from the output, e.g. 'script,style,img'.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    // ── Validate required fields ──────────────────────────────────────────
    if (!setting.apiKey) {
      throw new Error(
        "FirecrawlPlugin: You must provide an API key. " +
          "Use {{ state.envData.FIRECRAWL_API_KEY }} to reference an environment variable."
      );
    }

    if (!setting.url) {
      throw new Error("FirecrawlPlugin: You must provide a URL to scrape.");
    }

    // ── Resolve expressions ───────────────────────────────────────────────
    const apiKey = this.parseExpression(setting.apiKey);
    const url = this.parseExpression(setting.url);
    const format: string = setting.format
      ? this.parseExpression(setting.format)
      : "markdown";
    const onlyMainContent =
      setting.onlyMainContent !== undefined
        ? this.parseExpression(String(setting.onlyMainContent)) !== "false"
        : true; // defaults true
    const mobile =
      this.parseExpression(String(setting.mobile ?? "false")) === "true";
    const proxy: string = setting.proxy
      ? this.parseExpression(setting.proxy)
      : "auto";

    // ── Parse numeric fields ───────────────────────────────────────────────
    let waitFor = 0;
    if (setting.waitFor) {
      waitFor = parseInt(this.parseExpression(String(setting.waitFor)), 10);
      if (isNaN(waitFor) || waitFor < 0) {
        throw new Error("FirecrawlPlugin: waitFor must be a non-negative integer.");
      }
      if (waitFor > 60000) {
        throw new Error("FirecrawlPlugin: waitFor must not exceed 60000 ms.");
      }
    }

    let timeout = 60000;
    if (setting.timeout) {
      timeout = parseInt(this.parseExpression(String(setting.timeout)), 10);
      if (isNaN(timeout) || timeout < 1000 || timeout > 300000) {
        throw new Error(
          "FirecrawlPlugin: timeout must be between 1000 and 300000 ms."
        );
      }
    }

    // ── Build exclude tags ─────────────────────────────────────────────────
    let excludeTags: string[] | undefined;
    if (setting.excludeTags) {
      const raw = this.parseExpression(setting.excludeTags);
      excludeTags = raw
        .split(",")
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    }

    // ── Build request body ─────────────────────────────────────────────────
    const body: Record<string, unknown> = {
      url,
      formats: [format],
      onlyMainContent,
      mobile,
      proxy,
      waitFor,
      timeout,
    };

    if (excludeTags && excludeTags.length > 0) {
      body.excludeTags = excludeTags;
    }

    // ── Call Firecrawl v2 /scrape ──────────────────────────────────────────
    try {
      const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const json: any = await response.json();

      if (!response.ok || !json.success) {
        return {
          ok: false,
          error: json.error ?? `HTTP ${response.status}`,
          code: json.code ?? null,
        };
      }

      // Extract the requested format from data
      const scrapeData = json.data ?? {};
      const result =
        format === "links"
          ? scrapeData.links
          : scrapeData[format] ?? null;

      return {
        ok: true,
        data: {
          result,
          metadata: scrapeData.metadata ?? null,
          warning: scrapeData.warning ?? null,
        },
      };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }
}


export default FirecrawlPlugin;
