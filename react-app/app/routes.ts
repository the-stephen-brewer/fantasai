import { type RouteConfig, index } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  { path: "awards", file: "routes/awards.tsx" },
  { path: "profile", file: "routes/profile.tsx" },
] satisfies RouteConfig;
