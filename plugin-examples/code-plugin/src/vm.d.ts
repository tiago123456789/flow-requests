// Ambient types for the Deno/Node-only node:vm module, so tsc/ts-loader/ts-jest
// can type-check the lazy `await import(...)` without @types/node.
// Keep the module specifier in sync with src/index.ts.
declare module "node:vm" {
  export function createContext(context: any): any;

  export function runInContext(
    code: string,
    context: any,
    options?: { filename?: string; timeout?: number }
  ): any;

  const vm: {
    createContext: typeof createContext;
    runInContext: typeof runInContext;
  };

  export default vm;
}
