// Ambient types for the Deno-only remote driver (postgres.js), so
// tsc/ts-loader/ts-jest can type-check the lazy `await import(...)` without
// network access. Keep the module specifier in sync with src/index.ts.
declare module "npm:postgres" {
  export interface SqlResult<T> extends Array<T> {
    count?: number;
    command?: string;
  }

  export interface Sql {
    <T = any>(
      strings: TemplateStringsArray,
      ...values: unknown[]
    ): Promise<SqlResult<T>>;
    unsafe<T = any>(
      query: string,
      params?: unknown[],
      options?: { prepare?: boolean }
    ): Promise<SqlResult<T>>;
    end(options?: { timeout?: number }): Promise<void>;
  }

  function postgres(
    url?: string,
    options?: Record<string, unknown>
  ): Sql;

  export default postgres;
}
