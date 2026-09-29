import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/test/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
    // Vitest can handle ESM natively
    testTimeout: 30000,
  },
  resolve: {
    // Allow .js extensions to resolve .ts files in ESM mode
    extensions: [".ts", ".js"],
  },
});
