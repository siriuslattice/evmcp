import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "node20",
  outDir: "dist",
  removeNodeProtocol: false,
  async onSuccess() {
    // Strip shebang — Node ESM import() chokes on it in MCP Inspector
    const fs = await import("fs");
    const file = "dist/index.js";
    const content = fs.readFileSync(file, "utf8");
    fs.writeFileSync(file, content.replace(/^#!.*\n/, ""));
  },
});
