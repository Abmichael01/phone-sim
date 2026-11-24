import { defineConfig } from "vite";

// The `phone-sim` command-line tool: one Node ESM file in dist-cli/. Everything
// is bundled except Playwright, which stays a normal dependency (it ships the
// browser launcher and its own browser download). The extension build
// (vite.config.ts) is separate and unchanged.
export default defineConfig({
  resolve: { alias: { "@": "/src" } },
  // public/ holds the extension's manifest and icons; the CLI needs none of it.
  publicDir: false,
  ssr: { noExternal: true },
  build: {
    ssr: "src/cli/index.ts",
    outDir: "dist-cli",
    emptyOutDir: true,
    target: "node20",
    minify: false,
    sourcemap: false,
    rolldownOptions: {
      external: [/^playwright(\/.*)?$/, /^node:/],
      output: {
        format: "esm",
        entryFileNames: "phone-sim.js",
        banner: "#!/usr/bin/env node",
      },
    },
  },
});
