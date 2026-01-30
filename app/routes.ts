import { type RouteConfig, index } from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
import "dotenv/config";

const theme = process.env.VITE_THEME || "rcdio";

export default [
  // Index route based on theme
  index(
    theme === "sdc" ? "./routes/sdc._index.tsx" : "./routes/rcdio._index.tsx",
  ),
  // All other file-based routes (excluding the theme-specific index routes)
  ...(await flatRoutes()).filter(
    (route) =>
      route.file !== "routes/rcdio._index.tsx" &&
      route.file !== "routes/sdc._index.tsx",
  ),
] satisfies RouteConfig;
