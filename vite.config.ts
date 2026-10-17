import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    cssMinify: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
