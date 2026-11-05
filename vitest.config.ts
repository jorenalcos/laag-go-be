import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10000,

    coverage: {
      provider: "v8",
      include: [
        "src/modules/auth/**/*.ts",
        "src/middleware/auth.middleware.ts",
      ],
      exclude: [
        "src/modules/auth/*.routes.ts",
      ],
      reporter: ["text", "html"],
    },
  },
});