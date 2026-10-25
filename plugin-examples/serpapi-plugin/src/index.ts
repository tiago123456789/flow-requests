import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

const RESERVED_PARAMETERS = new Set(["api_key", "engine", "output", "q"]);

class SerpApiPlugin extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "SerpApiPlugin",
      type: "SerpApiPlugin",
      description:
        "Search the web using SerpApi and return its structured search results.",
      ai_description:
        "Run a search through SerpApi. Provide an API key, search query, and any supported SerpApi engine identifier (google by default). Use Parameters JSON for engine-specific options such as location, language, or pagination. The full JSON response is returned in data.",
      properties: [
        {
          label: "API Key",
          name: "apiKey",
          type: "text",
          required: true,
          default: null,
          ai_description:
            "SerpApi private API key. Store it in an environment variable and reference it with {{ state.envData.SERPAPI_API_KEY }}.",
        },
        {
          label: "Search Query",
          name: "query",
          type: "text",
          required: true,
          default: null,
          ai_description:
            "Search query passed as the q parameter. Supports Flow Requests expressions.",
        },
        {
          label: "Engine",
          name: "engine",
          type: "text",
          required: false,
          default: "google",
          ai_description:
            "SerpApi engine identifier, such as google, bing, youtube, or google_news. Defaults to google.",
        },
        {
          label: "Additional Parameters (JSON)",
          name: "parameters",
          type: "textarea",
          required: false,
          default: null,
          ai_description:
            "Optional JSON object of additional SerpApi parameters. For example: {\"location\":\"Austin, Texas\",\"hl\":\"en\",\"gl\":\"us\"}. Parameter availability depends on the selected engine.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const setting = node.settings;

    if (!setting.apiKey) {
      throw new Error(
        "SerpApiPlugin: You must provide an API key. Use {{ state.envData.SERPAPI_API_KEY }} to reference an environment variable."
      );
    }
    if (!setting.query) {
      throw new Error("SerpApiPlugin: You must provide a search query.");
    }

    const apiKey = this.parseExpression(String(setting.apiKey)).trim();
    const query = this.parseExpression(String(setting.query)).trim();
    const engine = this.parseExpression(
      String(setting.engine ?? "google")
    ).trim();

    if (!apiKey) {
      throw new Error("SerpApiPlugin: The API key must not be empty.");
    }
    if (!query) {
      throw new Error("SerpApiPlugin: The search query must not be empty.");
    }
    if (!engine) {
      throw new Error("SerpApiPlugin: The engine must not be empty.");
    }

    const parameters = this.parseAdditionalParameters(setting.parameters);
    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("engine", engine);
    url.searchParams.set("q", query);
    url.searchParams.set("output", "json");

    for (const [key, value] of Object.entries(parameters)) {
      if (RESERVED_PARAMETERS.has(key.toLowerCase())) {
        throw new Error(
          `SerpApiPlugin: The additional parameter "${key}" is managed by the node.`
        );
      }
      if (value === null) {
        continue;
      }
      if (!["string", "number", "boolean"].includes(typeof value)) {
        throw new Error(
          `SerpApiPlugin: Additional parameter "${key}" must have a string, number, or boolean value.`
        );
      }

      const resolvedValue =
        typeof value === "string" ? this.parseExpression(value) : String(value);
      url.searchParams.set(key, resolvedValue);
    }

    try {
      const response = await fetch(url.toString());
      let data: any;

      try {
        data = await response.json();
      } catch {
        return {
          ok: false,
          error: `SerpApi returned a non-JSON response (HTTP ${response.status}).`,
          status: response.status,
        };
      }

      if (!response.ok || data?.error) {
        const error =
          typeof data?.error === "string"
            ? data.error
            : data?.error
              ? JSON.stringify(data.error)
              : `SerpApi request failed (HTTP ${response.status}).`;
        return { ok: false, error, status: response.status };
      }

      return { ok: true, data };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private parseAdditionalParameters(
    rawParameters: unknown
  ): Record<string, string | number | boolean | null> {
    if (rawParameters === undefined || rawParameters === null || rawParameters === "") {
      return {};
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(
        this.parseExpression(String(rawParameters))
      ) as unknown;
    } catch {
      throw new Error(
        "SerpApiPlugin: Additional Parameters must be a valid JSON object."
      );
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(
        "SerpApiPlugin: Additional Parameters must be a JSON object."
      );
    }

    return parsed as Record<string, string | number | boolean | null>;
  }
}

export default SerpApiPlugin;
