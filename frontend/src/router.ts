import { useEffect, useState } from "react";

export type Route =
  | { name: "home" }
  | { name: "playground" }
  | { name: "problems" }
  | { name: "problem"; id: string };

export function parseRoute(pathname: string): Route {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/playground") return { name: "playground" };
  if (p === "/problems") return { name: "problems" };
  const m = p.match(/^\/problems\/([^/]+)$/);
  if (m) return { name: "problem", id: decodeURIComponent(m[1]) };
  return { name: "home" };
}

export function navigate(path: string) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.pathname));
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return route;
}
