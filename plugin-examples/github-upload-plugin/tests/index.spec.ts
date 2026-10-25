import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import GitHubUploadPlugin from "../src/index";

const makeState = (attachment?: string) => ({
  steps: {},
  envData: {},
  request: attachment ? { body: { attachment } } : {},
});

function response(status: number, data: any) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  };
}

describe("GitHubUploadPlugin", () => {
  beforeEach(() => {
    (global as any).fetch = undefined;
  });

  it("declares matching plugin name and type", () => {
    const config = new GitHubUploadPlugin(makeState()).getConfig();
    expect(config.name).toBe("GitHubUploadPlugin");
    expect(config.type).toBe(config.name);
  });

  it("creates a public repository and uploads an incoming request attachment", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-10-24T12:30:45.123Z"));
    const calls: Array<{ url: string; options: any }> = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, options: any) => {
      calls.push({ url, options });
      if (url.endsWith("/user")) {
        return Promise.resolve(response(200, { login: "ana" }));
      }
      if (url.endsWith("/repos/ana/customer-files")) {
        return Promise.resolve(response(404, { message: "Not Found" }));
      }
      if (url.endsWith("/user/repos")) {
        return Promise.resolve(
          response(201, {
            private: false,
            default_branch: "main",
            html_url: "https://github.com/ana/customer-files",
          })
        );
      }
      if (url.includes("/contents/")) {
        return Promise.resolve(
          response(201, {
            content: {
              download_url:
                "https://raw.githubusercontent.com/ana/customer-files/main/2026-10-24T12-30-45-123Z.txt",
              html_url:
                "https://github.com/ana/customer-files/blob/main/2026-10-24T12-30-45-123Z.txt",
            },
          })
        );
      }
      throw new Error(`Unexpected GitHub API request: ${url}`);
    });

    const plugin = new GitHubUploadPlugin(
      makeState("data:text/plain;base64,SGVsbG8gV29ybGQh")
    );
    const result = await plugin.execute({
      settings: { token: "test-token", repositoryName: "customer-files" },
    } as any);

    expect(result.ok).toBe(true);
    expect(result.data.fileName).toBe("2026-10-24T12-30-45-123Z.txt");
    expect(result.data.downloadUrl).toMatch(/^https:\/\/raw\.githubusercontent\.com\//);
    expect(result.data.repositoryCreated).toBe(true);

    const createCall = calls.find((call) => call.url.endsWith("/user/repos"));
    expect(JSON.parse(createCall!.options.body)).toEqual(
      expect.objectContaining({ name: "customer-files", private: false, auto_init: true })
    );
    const uploadCall = calls.find((call) => call.url.includes("/contents/"));
    expect(JSON.parse(uploadCall!.options.body)).toEqual(
      expect.objectContaining({ content: "SGVsbG8gV29ybGQh", branch: "main" })
    );
    jest.useRealTimers();
  });

  it("normalizes URL-safe Base64 and makes an existing private repository public", async () => {
    let uploadBody: any;
    const calls: Array<{ url: string; options: any }> = [];
    (global as any).fetch = jest.fn().mockImplementation((url: string, options: any) => {
      calls.push({ url, options });
      if (url.endsWith("/user")) {
        return Promise.resolve(response(200, { login: "ana" }));
      }
      if (url.endsWith("/repos/ana/archive")) {
        if (options.method === "PATCH") {
          return Promise.resolve(
            response(200, {
              private: false,
              default_branch: "main",
              html_url: "https://github.com/ana/archive",
            })
          );
        }
        return Promise.resolve(
          response(200, { private: true, default_branch: "main" })
        );
      }
      if (url.includes("/contents/")) {
        uploadBody = JSON.parse(options.body);
        return Promise.resolve(response(201, { content: { download_url: "https://example.test/file" } }));
      }
      throw new Error(`Unexpected GitHub API request: ${url}`);
    });

    const plugin = new GitHubUploadPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        token: "test-token",
        repositoryName: "archive",
        attachment: "data:application/octet-stream;base64,-_8",
      },
    } as any);

    expect(result.ok).toBe(true);
    expect(result.data.repositoryMadePublic).toBe(true);
    expect(uploadBody.content).toBe("+/8=");
    expect(calls.some((call) => call.options.method === "PATCH" && call.url.endsWith("/repos/ana/archive"))).toBe(true);
  });

  it("returns an error for an attachment that is not a Base64 data URL", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue(response(200, { login: "ana" }));
    const plugin = new GitHubUploadPlugin(makeState());
    const result = await plugin.execute({
      settings: {
        token: "test-token",
        repositoryName: "customer-files",
        attachment: "not-a-data-url",
      },
    } as any);

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Base64 data URL/i);
  });
});
