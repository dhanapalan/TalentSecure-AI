/**
 * SUPERADMIN legacy module — mounts the existing Express superadmin router
 * unchanged. Covers the entire SuperAdmin portal API surface: colleges,
 * students (global), approvals, modules, users, roles, audit-trail,
 * workflows, question-bank management, categories, review-queue,
 * announcements, email-templates, analytics, ai-config, billing, settings.
 *
 * This was never mounted in the NestJS bootstrap (main.ts) — only in the
 * legacy Express bootstrap (app.ts/index.ts) — so every /api/superadmin/*
 * call 404'd when running via main.ts. Mounted here the same way the other
 * legacy routers already are (see campus/learning/hiring/shared).
 * TODO: Port each sub-router to a full NestJS controller in a follow-up.
 */
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import superadminRoutes from "../../../routes/superadmin.routes.js";
import { applyLegacyRouter } from "../../utils/legacy-router.middleware.js";

@Module({})
export class SuperAdminLegacyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    applyLegacyRouter(consumer, superadminRoutes, "/api/superadmin");
  }
}
