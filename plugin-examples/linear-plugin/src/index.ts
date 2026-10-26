import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

const LINEAR_API_URL = "https://api.linear.app/graphql";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 250;

const ISSUE_FIELDS = `
  nodes {
    id
    identifier
    title
    description
    url
    priority
    estimate
    createdAt
    updatedAt
    dueDate
    state { id name type }
    assignee { id name email }
    team { id key name }
    project { id name }
    labels { nodes { id name color } }
  }
  pageInfo { hasNextPage endCursor }
`;

const LIST_ISSUES_QUERY = `
  query ListLinearIssues($filter: IssueFilter, $first: Int!, $after: String) {
    issues(filter: $filter, first: $first, after: $after) {
      ${ISSUE_FIELDS}
    }
  }
`;

const SEARCH_ISSUES_QUERY = `
  query SearchLinearIssues(
    $query: String!
    $filter: IssueFilter
    $first: Int!
    $after: String
  ) {
    issueSearch(query: $query, filter: $filter, first: $first, after: $after) {
      ${ISSUE_FIELDS}
    }
  }
`;

const LIST_PROJECTS_QUERY = `
  query ListLinearProjects($first: Int!, $after: String) {
    projects(first: $first, after: $after) {
      nodes {
        id
        name
        description
        url
        state
        progress
        startDate
        targetDate
        createdAt
        updatedAt
        teams { nodes { id key name } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const LIST_LABELS_QUERY = `
  query ListLinearLabels($first: Int!, $after: String) {
    issueLabels(first: $first, after: $after) {
      nodes {
        id
        name
        color
        description
        team { id key name }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  url: string;
  priority: number;
  estimate: number | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  state: { id: string; name: string; type: string } | null;
  assignee: { id: string; name: string; email: string | null } | null;
  team: { id: string; key: string; name: string };
  project: { id: string; name: string } | null;
  labels: { nodes: Array<{ id: string; name: string; color: string }> };
};

type LinearResponse<T> = {
  data?: T;
  errors?: Array<{ message?: string }>;
};

type LinearConnection<T> = {
  nodes?: T[];
  pageInfo?: { hasNextPage: boolean; endCursor: string | null };
};

class LinearIssuesNode extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "LinearIssuesNode",
      type: "LinearIssuesNode",
      description: "List and search Linear issues, projects, and labels.",
      ai_description:
        "Use this node to list Linear issues, projects, or labels. Issue listing supports text search and optional filters for team key, workflow status name, and assignee email. Every operation supports pagination.",
      properties: [
        {
          label: "Operation",
          name: "operation",
          type: "select",
          required: true,
          default: "issues",
          // @ts-ignore
          info: "Choose whether to list issues, projects, or issue labels. Issue search and filters apply only when listing issues.",
          options: [
            { label: "List issues", value: "issues" },
            { label: "List projects", value: "projects" },
            { label: "List labels", value: "labels" },
          ],
          ai_description:
            "Choose whether to list issues, projects, or issue labels. Text search and issue filters apply only to issue listing.",
        },
        {
          label: "Linear API Key",
          name: "apiKey",
          type: "text",
          required: true,
          default: null,
          // @ts-ignore
          info: "Your Linear personal API key. Store it as an environment variable and reference it here.",
          ai_description:
            "Personal API key from Linear. Store it as an environment variable and reference it with {{ this.state.envData.LINEAR_API_KEY }}.",
        },
        {
          label: "Search text",
          name: "query",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional text to search across Linear issues. Leave blank to list issues using the selected filters.",
          ai_description:
            "Optional text to search for across Linear issues. When empty, issues are listed using the supplied filters.",
        },
        {
          label: "Team key",
          name: "teamKey",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional Linear team key, such as ENG, to restrict issue results to one team.",
          ai_description:
            "Optional Linear team key, such as ENG, to restrict the results to one team.",
        },
        {
          label: "Status name",
          name: "statusName",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional workflow state name, such as In Progress or Done, to filter issues.",
          ai_description:
            "Optional workflow state name, such as In Progress or Done.",
        },
        {
          label: "Assignee email",
          name: "assigneeEmail",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional email address used to filter issues by their assigned Linear user.",
          ai_description:
            "Optional email address of the assigned Linear user.",
        },
        {
          label: "Result limit",
          name: "limit",
          type: "text",
          required: false,
          default: String(DEFAULT_LIMIT),
          // @ts-ignore
          info: `Maximum number of records to return per page (1–${MAX_LIMIT}); defaults to ${DEFAULT_LIMIT}.`,
          ai_description: `Number of records to request (1–${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}. Use the returned endCursor with the optional cursor setting to fetch the next page.`,
        },
        {
          label: "Cursor (next page)",
          name: "after",
          type: "text",
          required: false,
          default: null,
          // @ts-ignore
          info: "Optional pagination cursor from data.pageInfo.endCursor to fetch the next page.",
          ai_description:
            "Optional cursor from data.pageInfo.endCursor to continue listing from the next page.",
        },
      ],
    };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const settings = node.settings ?? {};

    if (!settings.apiKey) {
      throw new Error(
        "LinearIssuesNode: You must provide a Linear API key. Use {{ this.state.envData.LINEAR_API_KEY }} to reference an environment variable."
      );
    }

    const apiKey = this.parseExpression(String(settings.apiKey)).trim();
    if (!apiKey) {
      throw new Error("LinearIssuesNode: The Linear API key cannot be empty.");
    }

    const operation = this.resolveOptional(settings.operation) ?? "issues";
    if (!["issues", "projects", "labels"].includes(operation)) {
      throw new Error(
        'LinearIssuesNode: Operation must be "issues", "projects", or "labels".'
      );
    }

    const after = this.resolveOptional(settings.after);
    const searchQuery =
      operation === "issues" ? this.resolveOptional(settings.query) : undefined;

    const limitValue = settings.limit
      ? this.parseExpression(String(settings.limit)).trim()
      : String(DEFAULT_LIMIT);
    const limit = Number(limitValue);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      throw new Error(
        `LinearIssuesNode: Result limit must be an integer between 1 and ${MAX_LIMIT}.`
      );
    }

    const variables: Record<string, unknown> = {
      first: limit,
      after: after ?? null,
    };

    let graphQLQuery: string;
    if (operation === "projects") {
      graphQLQuery = LIST_PROJECTS_QUERY;
    } else if (operation === "labels") {
      graphQLQuery = LIST_LABELS_QUERY;
    } else {
      const teamKey = this.resolveOptional(settings.teamKey);
      const statusName = this.resolveOptional(settings.statusName);
      const assigneeEmail = this.resolveOptional(settings.assigneeEmail);
      const filter: Record<string, unknown> = {};
      if (teamKey) filter.team = { key: { eq: teamKey } };
      if (statusName) filter.state = { name: { eq: statusName } };
      if (assigneeEmail) filter.assignee = { email: { eq: assigneeEmail } };
      variables.filter = Object.keys(filter).length > 0 ? filter : undefined;

      graphQLQuery = LIST_ISSUES_QUERY;
      if (searchQuery) {
        graphQLQuery = SEARCH_ISSUES_QUERY;
        variables.query = searchQuery;
      }
    }

    try {
      const response = await fetch(LINEAR_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Linear personal API keys are sent directly, without a Bearer prefix.
          Authorization: apiKey,
        },
        body: JSON.stringify({ query: graphQLQuery, variables }),
      });

      let payload: LinearResponse<{
        issues?: LinearConnection<LinearIssue>;
        issueSearch?: LinearConnection<LinearIssue>;
        projects?: LinearConnection<Record<string, unknown>>;
        issueLabels?: LinearConnection<Record<string, unknown>>;
      }>;

      try {
        payload = await response.json();
      } catch {
        return {
          ok: false,
          error: `Linear API returned an unreadable response (HTTP ${response.status}).`,
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          error: this.formatApiError(payload.errors, response.status),
        };
      }

      if (payload.errors?.length) {
        return { ok: false, error: this.formatApiError(payload.errors) };
      }

      const result =
        operation === "projects"
          ? payload.data?.projects
          : operation === "labels"
            ? payload.data?.issueLabels
            : searchQuery
              ? payload.data?.issueSearch
              : payload.data?.issues;
      if (!result) {
        return {
          ok: false,
          error: `Linear API response did not contain a ${operation} connection.`,
        };
      }

      return {
        ok: true,
        data: {
          [operation]: result.nodes ?? [],
          pageInfo: result.pageInfo ?? { hasNextPage: false, endCursor: null },
        },
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown Linear API error.",
      };
    }
  }

  private resolveOptional(value: unknown): string | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const resolved = this.parseExpression(String(value)).trim();
    return resolved.length > 0 ? resolved : undefined;
  }

  private formatApiError(
    errors?: Array<{ message?: string }>,
    status?: number
  ): string {
    const messages = errors
      ?.map((error) => error.message)
      .filter((message): message is string => Boolean(message));
    const detail = messages?.length
      ? messages.join("; ")
      : "Request failed";
    return `Linear API error${status ? ` (HTTP ${status})` : ""}: ${detail}`;
  }
}

export default LinearIssuesNode;
