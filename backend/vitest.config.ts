import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // Co-located test files
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/db/migrations/**",
        "src/db/seed.ts",
        "src/db/create-admin.ts",
        "src/server.ts",        // entry point — tested via integration
      ],
      // Minimum thresholds — raise as coverage grows
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
      },
    },
  },
});
