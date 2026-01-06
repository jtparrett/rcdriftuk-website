import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
// import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   strategies: "generateSW",
    //   workbox: {
    //     cleanupOutdatedCaches: true,
    //     runtimeCaching: [
    //       {
    //         urlPattern: ({ request }) => {
    //           return request.mode === "navigate";
    //         },
    //         handler: "StaleWhileRevalidate",
    //         options: {
    //           cacheName: "pages",
    //         },
    //       },

    //       {
    //         urlPattern: ({ request }) => {
    //           return (
    //             request.destination === "" &&
    //             request.headers.get("accept")?.includes("application/json")
    //           );
    //         },
    //         handler: "StaleWhileRevalidate",
    //         options: {
    //           cacheName: "loader-data",
    //         },
    //       },
    //     ],
    //   },
    // }),
  ],
});
