import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { flatRoutes } from "@react-router/fs-routes";
import "dotenv/config";

const theme = process.env.VITE_THEME || "rcdio";

const IGNORE_FILE_ROUTES = [
  "routes/_index.tsx",
  "routes/sdc.layout.tsx",
  "routes/sdc._index.tsx",
  "routes/sdc.standings.tsx",
];

const RCDIO_ROUTES = [index("./routes/_index.tsx")];

const SDC_ROUTES = [
  index("./routes/sdc._index.tsx"),
  layout("./routes/sdc.layout.tsx", [
    route("/standings", "./routes/sdc.standings.tsx"),
  ]),
];

export default [
  ...(theme === "rcdio" ? RCDIO_ROUTES : []),
  ...(theme === "sdc" ? SDC_ROUTES : []),

  ...(await flatRoutes()).filter(
    (route) => !IGNORE_FILE_ROUTES.includes(route.file),
  ),
] satisfies RouteConfig;
