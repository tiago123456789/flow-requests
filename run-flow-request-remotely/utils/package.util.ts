import { NodeBase } from "core-package-mini-n8n";

class PackageUtil {
  async load(
    customPackages: Array<{ url: string; libraryName: string }>,
    state: any = {},
  ): Promise<Array<NodeBase>> {
    const customNode: Array<NodeBase> = [];
    for (let plugin of customPackages) {
      const urlToImport = plugin.url
        .replace("https://unpkg.com/", "npm:")
        .replace("/dist/bundle.js", "/dist/deno-bundle.js");

      console.log(urlToImport);
      const instance = await import(urlToImport);
      if (instance.default) {
        customNode.push(new instance.default(state));
      } else {
        customNode.push(new instance(state));
      }
    }
    return customNode;
  }

  async install(
    customPackages: Array<{ url: string; libraryName: string }>,
  ): Promise<void> {}
}

export default PackageUtil;
