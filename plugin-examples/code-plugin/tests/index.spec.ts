import CodeNode from "../src/index";

describe("CodeNode", () => {
  it("exposes code (textarea required) and data (textarea optional)", () => {
    const config = new CodeNode({}).getConfig();
    expect(config.name).toBe("CodeNode");
    expect(config.type).toBe("CodeNode");

    const code = config.properties.find((p) => p.name === "code");
    const data = config.properties.find((p) => p.name === "data");
    expect(code).toMatchObject({ type: "textarea", required: true });
    expect(data).toMatchObject({ type: "textarea", required: false });
  });

  it("throws when code is missing", async () => {
    const node = new CodeNode({});
    await expect(node.execute({ settings: {} } as any)).rejects.toThrow("code");
  });

  it("runs code against the provided data and returns output", async () => {
    const result = await new CodeNode({}).execute({
      settings: { code: "data.values", data: '{"values":["a","b",1,2]}' },
    } as any);

    expect(result).toEqual({ ok: true, data: ["a", "b", 1, 2] });
  });

  it("supports expression code", async () => {
    const result = await new CodeNode({}).execute({
      settings: { code: "data.a + data.b", data: '{"a":2,"b":3}' },
    } as any);

    expect(result).toEqual({ ok: true, data: 5 });
  });

  it("defaults data to an empty object", async () => {
    const result = await new CodeNode({}).execute({
      settings: { code: "typeof data" },
    } as any);

    expect(result).toEqual({ ok: true, data: "object" });
  });

  it("throws when data is not valid JSON", async () => {
    await expect(
      new CodeNode({}).execute({
        settings: { code: "data", data: "nope" },
      } as any)
    ).rejects.toThrow("JSON");
  });

  it("returns ok:false when the code throws", async () => {
    const result = await new CodeNode({}).execute({
      settings: { code: "data.missing.deep", data: "{}" },
    } as any);

    expect(result.ok).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});
