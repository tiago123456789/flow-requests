import {
  decryptFlowBlob,
  encryptFlowBlobForJsonb,
  resetKeyCache,
} from "./crypto.util.ts";
import { getFlowRequestExecutionData } from "./flow-request-data.util.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertJsonEqual(actual: unknown, expected: unknown, message: string) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${message}: expected ${JSON.stringify(expected)}, got ${
      JSON.stringify(actual)
    }`,
  );
}

Deno.test("saved flow data is encrypted for JSONB and decrypted for execution", async () => {
  const previousKey = Deno.env.get("ENCRYPT_KEY");
  Deno.env.set(
    "ENCRYPT_KEY",
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  );
  resetKeyCache();

  try {
    const flow = {
      data: {
        nodes: [],
        envData: [{ key: "TOKEN", value: "sensitive-token-value" }],
      },
    };
    const payload = { name: "example", plugins: [], flow };
    const encryptedDataForJsonb = await encryptFlowBlobForJsonb(payload);
    const encryptedFlowForJsonb = await encryptFlowBlobForJsonb(flow);

    // Emulate the JSONB string scalar returned by PostgreSQL's JSON parser.
    const encryptedData = JSON.parse(encryptedDataForJsonb);
    const encryptedFlow = JSON.parse(encryptedFlowForJsonb);
    assert(
      typeof encryptedData === "string",
      "data must be a JSON string scalar",
    );
    assert(
      typeof encryptedFlow === "string",
      "flow must be a JSON string scalar",
    );
    assert(
      !encryptedFlowForJsonb.includes("sensitive-token-value"),
      "stored flow must not contain plaintext envData",
    );

    const tamperedFlow = `${encryptedFlow.slice(0, -1)}${
      encryptedFlow.endsWith("0") ? "1" : "0"
    }`;
    let tamperingRejected = false;
    try {
      await decryptFlowBlob(tamperedFlow);
    } catch {
      tamperingRejected = true;
    }
    assert(tamperingRejected, "tampered ciphertext must be rejected");

    const executionData = await getFlowRequestExecutionData({
      data: encryptedData,
      flow: encryptedFlow,
    });
    assertJsonEqual(executionData.flow, flow, "decrypted flow mismatch");
    assertJsonEqual(executionData.plugins, [], "decrypted plugins mismatch");

    const legacyExecutionData = await getFlowRequestExecutionData({
      data: { flow, plugins: ["legacy-plugin"] },
      flow: null,
    });
    assertJsonEqual(legacyExecutionData.flow, flow, "legacy flow mismatch");
    assertJsonEqual(
      legacyExecutionData.plugins,
      ["legacy-plugin"],
      "legacy plugins mismatch",
    );
  } finally {
    if (previousKey === undefined) Deno.env.delete("ENCRYPT_KEY");
    else Deno.env.set("ENCRYPT_KEY", previousKey);
    resetKeyCache();
  }
});
