import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import LinearIssuesNode from "../src/index";

const makeState = () => ({ steps: {}, envData: {}, request: {} });

const successResponse = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => ({ data }),
});

describe("LinearIssuesNode", () => {
  beforeEach(() => {
    (global as any).fetch = undefined;
  });

  it("declares a stable node identity and the expected settings", () => {
    const config = new LinearIssuesNode(makeState()).getConfig();
    const settingNames = config.properties.map((property) => property.name);

    expect(config.name).toBe("LinearIssuesNode");
    expect(config.type).toBe(config.name);
    expect(settingNames).toEqual([
      "operation",
      "apiKey",
      "query",
      "teamKey",
      "statusName",
      "assigneeEmail",
      "limit",
      "after",
    ]);
  });

  it("requires a Linear API key", async () => {
    const node = new LinearIssuesNode(makeState());
    await expect(node.execute({ settings: {} } as any)).rejects.toThrow(
      /linear api key/i
    );
  });

  it("validates the requested result limit", async () => {
    const node = new LinearIssuesNode(makeState());
    await expect(
      node.execute({ settings: { apiKey: "test-key", limit: "251" } } as any)
    ).rejects.toThrow(/between 1 and 250/i);
  });

  it("lists issues with optional filters and returns pagination info", async () => {
    const issues = [{ identifier: "ENG-42", title: "Fix pagination" }];
    let capturedRequest: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, options: any) => {
      capturedRequest = options;
      return Promise.resolve(
        successResponse({
          issues: {
            nodes: issues,
            pageInfo: { hasNextPage: true, endCursor: "cursor-next" },
          },
        })
      );
    });

    const result = await new LinearIssuesNode(makeState()).execute({
      settings: {
        apiKey: "lin_api_test",
        teamKey: "ENG",
        statusName: "In Progress",
        assigneeEmail: "dev@example.com",
        limit: "20",
        after: "cursor-prev",
      },
    } as any);

    const body = JSON.parse(capturedRequest.body);
    expect(capturedRequest.headers.Authorization).toBe("lin_api_test");
    expect(body.query).toContain("issues(filter:");
    expect(body.variables).toEqual({
      filter: {
        team: { key: { eq: "ENG" } },
        state: { name: { eq: "In Progress" } },
        assignee: { email: { eq: "dev@example.com" } },
      },
      first: 20,
      after: "cursor-prev",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        issues,
        pageInfo: { hasNextPage: true, endCursor: "cursor-next" },
      },
    });
  });

  it("lists projects and returns pagination info", async () => {
    const projects = [{ id: "project-1", name: "Launch" }];
    let capturedBody: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, options: any) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve(
        successResponse({
          projects: {
            nodes: projects,
            pageInfo: { hasNextPage: true, endCursor: "project-cursor" },
          },
        })
      );
    });

    const result = await new LinearIssuesNode(makeState()).execute({
      settings: {
        apiKey: "lin_api_test",
        operation: "projects",
        limit: "15",
        after: "previous-project-cursor",
      },
    } as any);

    expect(capturedBody.query).toContain("projects(first:");
    expect(capturedBody.variables).toEqual({
      first: 15,
      after: "previous-project-cursor",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        projects,
        pageInfo: { hasNextPage: true, endCursor: "project-cursor" },
      },
    });
  });

  it("lists labels and returns pagination info", async () => {
    const labels = [{ id: "label-1", name: "Urgent", color: "#ff0000" }];
    let capturedBody: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, options: any) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve(
        successResponse({
          issueLabels: {
            nodes: labels,
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        })
      );
    });

    const result = await new LinearIssuesNode(makeState()).execute({
      settings: { apiKey: "lin_api_test", operation: "labels" },
    } as any);

    expect(capturedBody.query).toContain("issueLabels(first:");
    expect(capturedBody.variables).toEqual({ first: 50, after: null });
    expect(result).toEqual({
      ok: true,
      data: {
        labels,
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    });
  });

  it("uses issueSearch when search text is provided and resolves expressions", async () => {
    let capturedBody: any;
    (global as any).fetch = jest.fn().mockImplementation((_url: any, options: any) => {
      capturedBody = JSON.parse(options.body);
      return Promise.resolve(
        successResponse({
          issueSearch: {
            nodes: [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        })
      );
    });

    const node = new LinearIssuesNode({
      ...makeState(),
      envData: { ISSUE_QUERY: "login", TEAM: "WEB" },
    });
    const result = await node.execute({
      settings: {
        apiKey: "lin_api_test",
        query: "{{ this.state.envData.ISSUE_QUERY }}",
        teamKey: "{{ this.state.envData.TEAM }}",
      },
    } as any);

    expect(capturedBody.query).toContain("issueSearch(");
    expect(capturedBody.variables.query).toBe("login");
    expect(capturedBody.variables.filter.team.key.eq).toBe("WEB");
    expect(capturedBody.variables.first).toBe(50);
    expect(result.ok).toBe(true);
  });

  it("returns GraphQL and network errors as structured failures", async () => {
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: "Invalid API key" }] }),
    });

    const node = new LinearIssuesNode(makeState());
    const graphQLError = await node.execute({
      settings: { apiKey: "invalid" },
    } as any);
    expect(graphQLError.ok).toBe(false);
    expect(graphQLError.error).toMatch(/invalid api key/i);

    (global as any).fetch = jest
      .fn()
      .mockRejectedValue(new Error("Network unavailable"));
    const networkError = await node.execute({
      settings: { apiKey: "lin_api_test" },
    } as any);
    expect(networkError.ok).toBe(false);
    expect(networkError.error).toMatch(/network unavailable/i);
  });
});
