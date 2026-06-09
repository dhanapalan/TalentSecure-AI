/**
 * Mounts an Express Router as NestJS middleware for a given path prefix.
 * Used for modules not yet fully ported to NestJS controllers — lets them
 * keep running unmodified while the new architecture takes shape around them.
 */
import { MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { Router } from "express";

export function applyLegacyRouter(
  consumer: MiddlewareConsumer,
  router: Router,
  path: string,
): void {
  consumer
    .apply(router)
    .forRoutes({ path: `${path}*`, method: RequestMethod.ALL });
}
