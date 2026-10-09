/* eslint-disable unicorn/no-top-level-side-effects */

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "./src/index.js",
      formats: ["es"],
      fileName: "index",
    },
  },
});
