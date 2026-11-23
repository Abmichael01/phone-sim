import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// The extension is built, not served: `pnpm dev` rebuilds dist/ on every save,
// then reload the extension in the browser. Each entry keeps a fixed file name
// because manifest.json points at them.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: mode === "development",
    rollupOptions: {
      input: {
        simulator: resolve(import.meta.dirname, "simulator.html"),
        background: resolve(import.meta.dirname, "src/background/index.ts"),
        "mobile-env": resolve(import.meta.dirname, "src/inject/mobile-env.ts"),
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
