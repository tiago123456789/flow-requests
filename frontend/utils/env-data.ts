import type EnvData from "@/types/env-data";

export function createEnvDataId(usedIds: Iterable<string> = []): string {
  const used = new Set(usedIds);
  let id: string;

  do {
    const uniquePart =
      typeof globalThis.crypto?.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    id = `data-${uniquePart}`;
  } while (used.has(id));

  return id;
}

export function normalizeEnvData(envData: EnvData[] = []): EnvData[] {
  const usedIds = new Set<string>();

  return envData.map((item) => {
    const existingId = item.id?.trim();
    const id =
      existingId && !usedIds.has(existingId)
        ? existingId
        : createEnvDataId(usedIds);

    usedIds.add(id);
    return { ...item, id };
  });
}
