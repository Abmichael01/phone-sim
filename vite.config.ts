import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The extension is built, not served: `pnpm dev` rebuilds dist/ on every save,
// then reload the extension in the browser. Each entry keeps a fixed file name
// because manifest.json points at them.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Paths are relative to the project root, so the config needs no Node APIs.
  resolve: { alias: { "@": "/src" } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    rolldownOptions: {
      input: {
        simulator: "simulator.html",
        background: "src/background/index.ts",
        "mobile-env": "src/inject/mobile-env.ts",
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
}));
