import { Module, MiddlewareConsumer, NestModule, RequestMethod } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { RolesGuard } from "./common/guards/roles.guard.js";

// ── Fully-ported NestJS modules ───────────────────────────────────────────────
import { IdentityModule } from "./modules/identity/identity.module.js";
import { AssessmentModule } from "./modules/assessment/assessment.module.js";
import { DriveModule } from "./modules/drive/drive.module.js";
import { ExamSessionModule } from "./modules/exam-session/exam-session.module.js";

// ── Legacy Express router modules (middleware passthrough) ───────────────────
import { CampusLegacyModule } from "./modules/campus/campus-legacy.module.js";
import { LearningLegacyModule } from "./modules/learning/learning-legacy.module.js";
import { HiringLegacyModule } from "./modules/hiring/hiring-legacy.module.js";
import { SharedLegacyModule } from "./modules/shared/shared-legacy.module.js";

@Module({
  imports: [
    // Global rate limiting — 100 req / 15 min per IP
    ThrottlerModule.forRoot([{ ttl: 15 * 60 * 1000, limit: 100 }]),

    // Fully-ported modules
    IdentityModule,
    AssessmentModule,
    DriveModule,
    ExamSessionModule,

    // Legacy passthrough modules (Express routers mounted as middleware)
    CampusLegacyModule,
    LearningLegacyModule,
    HiringLegacyModule,
    SharedLegacyModule,
  ],
  providers: [
    // Global exception filter — replaces Express errorHandler
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // Global JWT auth guard — all routes protected unless @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },

    // Global roles guard — enforces @Roles() after JWT succeeds
    { provide: APP_GUARD, useClass: RolesGuard },

    // Global throttle guard
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(_consumer: MiddlewareConsumer): void {
    // Middleware configuration done per-module where needed
  }
}
