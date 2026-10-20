import { defineConfig } from "vite";

// A real directory/index.html lets GitHub Pages resolve /researchos directly.
// Keep the assets under the same path for both development and production.
export default defineConfig({
  base: "/researchos/",
  build: {
    outDir: "../build/researchos",
    emptyOutDir: true,
  },
});
