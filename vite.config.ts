import { resolve } from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  build: {
    lib: {
      name: "server",
      entry: resolve(__dirname, "src/server.ts"),
    },
    ssr: true,
  },
  plugins: [tsconfigPaths()],
});
