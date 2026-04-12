interface OpenRouterModel {
  id: string;
  name: string;
  provider: string;
}

interface OpenRouterModelsResponse {
  data: Array<{
    id: string;
    name?: string;
    created?: number;
    description?: string;
  }>;
}

const MODEL_CACHE_DURATION = 60 * 60 * 1000;

class OpenRouterService {
  private static instance: OpenRouterService;
  private cachedModels: OpenRouterModel[] | null = null;
  private cacheTimestamp: number = 0;

  private constructor() {}

  static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  async getModels(): Promise<OpenRouterModel[]> {
    if (
      this.cachedModels &&
      Date.now() - this.cacheTimestamp < MODEL_CACHE_DURATION
    ) {
      return this.cachedModels;
    }

    const openRouterToken = localStorage.getItem("openRouterToken");
    if (!openRouterToken) {
      return [];
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${openRouterToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: OpenRouterModelsResponse = await response.json();

      const models = data.data.map((model) => {
        const parts = model.id.split("/");
        const provider = parts.length > 1 ? parts[0] : "unknown";
        return {
          id: model.id,
          name: model.name || model.id,
          provider,
        };
      });

      this.cachedModels = models;
      this.cacheTimestamp = Date.now();

      return models;
    } catch (error) {
      console.error("Error fetching OpenRouter models:", error);
      return this.cachedModels || [];
    }
  }

  getPopularModels(models: OpenRouterModel[]): OpenRouterModel[] {
    const popularIds = [
      "openai/gpt-4.1-mini",
      "openai/gpt-4o",
      "openai/gpt-4o-mini",
      "anthropic/claude-3.5-sonnet",
      "anthropic/claude-3.5-haiku",
      "google/gemini-2.0-flash",
      "google/gemini-2.0-flash-thinking",
      "google/gemini-1.5-flash",
      "google/gemini-1.5-pro",
      "meta-llama/llama-3.3-70b-instruct",
      "deepseek/deepseek-chat-v3-0324",
      "mistralai/mistral-small-3.1-24b-instruct",
      "qwen/qwen3-8b",
      "x-ai/grok-3",
    ];

    const popular = models.filter((m) => popularIds.includes(m.id));
    const others = models.filter((m) => !popularIds.includes(m.id));

    return [...popular, ...others];
  }

  clearCache(): void {
    this.cachedModels = null;
    this.cacheTimestamp = 0;
  }
}

export const openRouterService = OpenRouterService.getInstance();
export type { OpenRouterModel };
