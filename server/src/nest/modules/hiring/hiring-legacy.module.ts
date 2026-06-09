/**
 * HIRING legacy module — mounts existing Express routers unchanged.
 * Covers: /api/hr, /api/placement, /api/company, /api/segmentation
 * TODO: Port each to a full NestJS controller in a follow-up.
 */
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import hrRoutes from "../../../routes/hr.routes.js";
import placementRoutes from "../../../routes/placement.routes.js";
import companyRoutes from "../../../routes/company.routes.js";
import segmentationRoutes from "../../../routes/segmentation.routes.js";
import studentRoutes from "../../../routes/student.routes.js";
import { applyLegacyRouter } from "../../utils/legacy-router.middleware.js";

@Module({})
export class HiringLegacyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    applyLegacyRouter(consumer, hrRoutes, "/api/hr");
    applyLegacyRouter(consumer, placementRoutes, "/api/placement");
    applyLegacyRouter(consumer, companyRoutes, "/api/company");
    applyLegacyRouter(consumer, segmentationRoutes, "/api/segmentation");
    applyLegacyRouter(consumer, studentRoutes, "/api/students");
  }
}
