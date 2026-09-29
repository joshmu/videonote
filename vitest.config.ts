import react from "@vitejs/plugin-react";
import path from "path";
import { configDefaults, defineConfig } from "vitest/config";

const SERVER_TESTS = ["src/__test__/{auth,db,note,project,share}/**/*.test.ts"];

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    css: {
      modules: {
        classNameStrategy: "non-scoped",
      },
    },
    projects: [
      {
        test: {
          name: "client",
          environment: "jsdom",
          setupFiles: ["./src/__test__/setupTests.tsx"],
          exclude: [...configDefaults.exclude, ...SERVER_TESTS],
        },
      },
      {
        test: {
          name: "server",
          environment: "node",
          include: SERVER_TESTS,
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@/root": path.resolve(__dirname, "."),
      "@/layout": path.resolve(__dirname, "src/components/Layout"),
      "@/components": path.resolve(__dirname, "src/components"),
      "@/shared": path.resolve(__dirname, "src/components/shared"),
      "@/context": path.resolve(__dirname, "src/context"),
      "@/hooks": path.resolve(__dirname, "src/hooks"),
      "@/styles": path.resolve(__dirname, "src/styles"),
      "@/pages": path.resolve(__dirname, "pages"),
      "@/api": path.resolve(__dirname, "pages/api"),
      "@/services": path.resolve(__dirname, "src/services"),
      "@/utils": path.resolve(__dirname, "utils"),
    },
  },
});
