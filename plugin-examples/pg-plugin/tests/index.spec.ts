import PostgresNode from "../src/index";

// Must match the lazy import() literal in src/index.ts.
// Virtual mock: the npm: specifier is resolved by Deno at runtime,
// so tests substitute a fake postgres.js here.
jest.mock(
  "npm:postgres",
  () => ({
    __esModule: true,
    default: jest.fn(),
  }),
  { virtual: true }
);

const postgres = jest.requireMock("npm:postgres").default as jest.Mock;

function mockClient(impl: {
  unsafe?: (...args: any[]) => Promise<any>;
  end?: () => Promise<void>;
}) {
  const unsafe = jest.fn(
    impl.unsafe ??
      (async () => [{ count: 0, command: "SELECT" }])
  );
  const end = jest.fn(impl.end ?? (async () => {}));
  postgres.mockReturnValue({ unsafe, end });
  return { unsafe, end };
}

describe("PostgresNode", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes dbUrl (text), query (textarea) and params (textarea, optional)", () => {
    const node = new PostgresNode({});
    const config = node.getConfig();
    expect(config.name).toBe("postgres");
    expect(config.type).toBe("postgres");

    const dbUrl = config.properties.find((p) => p.name === "dbUrl");
    const query = config.properties.find((p) => p.name === "query");
    const params = config.properties.find((p) => p.name === "params");
    expect(dbUrl).toMatchObject({ type: "text", required: true });
    expect(query).toMatchObject({ type: "textarea", required: true });
    expect(params).toMatchObject({ type: "textarea", required: false });
  });

  it("throws when dbUrl or query are missing", async () => {
    const node = new PostgresNode({});
    await expect(node.execute({ settings: {} } as any)).rejects.toThrow(
      "dbUrl"
    );
    await expect(
      node.execute({ settings: { dbUrl: "postgresql://x" } } as any)
    ).rejects.toThrow("query");
  });

  it("throws when params is not a JSON array", async () => {
    const node = new PostgresNode({});
    mockClient({});
    await expect(
      node.execute({
        settings: { dbUrl: "postgresql://x", query: "SELECT 1", params: "nope" },
      } as any)
    ).rejects.toThrow("JSON array");
    await expect(
      node.execute({
        settings: {
          dbUrl: "postgresql://x",
          query: "SELECT 1",
          params: '{"a":1}',
        },
      } as any)
    ).rejects.toThrow("JSON array");
  });

  it("runs parameterized unsafe() and ends the client", async () => {
    const rows = [{ id: 1, name: "Alice Smith" }] as any[];
    rows.count = 1;
    rows.command = "SELECT";
    const { unsafe, end } = mockClient({
      unsafe: async () => rows,
    });

    const node = new PostgresNode({});
    const result = await node.execute({
      settings: {
        dbUrl: "postgresql://user:pass@localhost:5432/mydb",
        query: "SELECT id, name FROM users WHERE email = $1 AND name = $2",
        params: '["alice@example.com", "Alice Smith"]',
      },
    } as any);

    expect(postgres).toHaveBeenCalledWith(
      "postgresql://user:pass@localhost:5432/mydb"
    );
    expect(unsafe).toHaveBeenCalledWith(
      "SELECT id, name FROM users WHERE email = $1 AND name = $2",
      ["alice@example.com", "Alice Smith"]
    );
    expect(result).toEqual({
      ok: true,
      data: {
        rows: [{ id: 1, name: "Alice Smith" }],
        rowCount: 1,
        command: "SELECT",
      },
    });
    expect(end).toHaveBeenCalled();
  });

  it("defaults params to [] and still ends on query error", async () => {
    const { unsafe, end } = mockClient({
      unsafe: async () => {
        throw new Error('relation "users" does not exist');
      },
    });

    const node = new PostgresNode({});
    const result = await node.execute({
      settings: {
        dbUrl: "postgresql://user:pass@localhost:5432/mydb",
        query: "SELECT * FROM users",
      },
    } as any);

    expect(unsafe).toHaveBeenCalledWith("SELECT * FROM users", []);
    expect(result).toEqual({
      ok: false,
      error: 'relation "users" does not exist',
    });
    expect(end).toHaveBeenCalled();
  });

  it("returns { ok: false } when the client construction/query fails", async () => {
    const end = jest.fn(async () => {});
    postgres.mockReturnValue({
      unsafe: async () => {
        throw new Error("connection refused");
      },
      end,
    });

    const node = new PostgresNode({});
    const result = await node.execute({
      settings: { dbUrl: "postgresql://bad", query: "SELECT 1" },
    } as any);

    expect(result).toEqual({ ok: false, error: "connection refused" });
    expect(end).toHaveBeenCalled();
  });
});
