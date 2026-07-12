/**
 * Mounts an Express Router as NestJS middleware for a given path prefix.
 * Used for modules not yet fully ported to NestJS controllers — lets them
 * keep running unmodified while the new architecture takes shape around them.
 *
 * `consumer.apply(router).forRoutes(...)` invokes the Router as a plain
 * middleware FUNCTION — it does NOT get Express's usual `app.use(prefix, router)`
 * automatic prefix-stripping. Since every mounted router's own routes are
 * defined relative to its prefix (e.g. `router.get("/colleges", ...)` expects
 * to see "/colleges", not "/api/superadmin/colleges"), every single sub-route
 * on every legacy module 404'd until the prefix is stripped from `req.url`
 * before delegating to the router, exactly like Express's own mounting does.
 */
import { MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { Router, Request, Response, NextFunction } from "express";

export function applyLegacyRouter(
  consumer: MiddlewareConsumer,
  router: Router,
  path: string,
): void {
  const stripPrefix = (req: Request, res: Response, next: NextFunction) => {
    const original = req.url;
    if (req.url === path || req.url.startsWith(`${path}/`) || req.url.startsWith(`${path}?`)) {
      const rest = req.url.slice(path.length);
      // A bare-prefix request with a query string (e.g. "?limit=20") must keep
      // its leading "/" — Express matches the pathname before "?", and an
      // empty pathname never matches a router's own "/" route.
      req.url = rest === "" ? "/" : rest.startsWith("/") ? rest : `/${rest}`;
    }
    router(req, res, (err?: unknown) => {
      req.url = original;
      next(err);
    });
  };

  // Two RouteInfo entries: the bare prefix itself (e.g. GET /api/notifications)
  // AND anything nested under it (e.g. /api/notifications/read-all). A single
  // "${path}*splat" pattern requires non-empty content after the prefix, so it
  // silently misses the bare-prefix case — that's exactly the shape of the
  // most common route on most of these legacy routers (the top-level list/get).
  consumer.apply(stripPrefix).forRoutes(
    { path, method: RequestMethod.ALL },
    { path: `${path}/*splat`, method: RequestMethod.ALL },
  );
}
