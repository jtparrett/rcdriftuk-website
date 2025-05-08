import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import pandacss from "@pandacss/dev/postcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
  css: {
    postcss: {
      plugins: [pandacss as any, autoprefixer],
    },
  },
  plugins: [reactRouter(), tsconfigPaths()],
});
