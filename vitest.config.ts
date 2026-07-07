import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@/generated": path.resolve(__dirname, "prisma/generated"),
      "@": path.resolve(__dirname, "src"),
    },
  },
});
