/**
 * LEARNING legacy module — mounts existing Express routers unchanged.
 * Covers: /api/lms, /api/learning-modules, /api/skill-programs,
 *         /api/skill-partners, /api/student-learning, /api/practice
 * TODO: Port each to a full NestJS controller in a follow-up.
 */
import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import lmsRoutes from "../../../routes/lms.routes.js";
import learningModulesRoutes from "../../../routes/learningModules.routes.js";
import skillProgramsRoutes from "../../../routes/skillPrograms.routes.js";
import skillPartnersRoutes from "../../../routes/skillPartners.routes.js";
import studentLearningRoutes from "../../../routes/studentLearning.routes.js";
import practiceRoutes from "../../../routes/practice.routes.js";
import { applyLegacyRouter } from "../../utils/legacy-router.middleware.js";

@Module({})
export class LearningLegacyModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    applyLegacyRouter(consumer, lmsRoutes, "/api/lms");
    applyLegacyRouter(consumer, learningModulesRoutes, "/api/learning-modules");
    applyLegacyRouter(consumer, skillProgramsRoutes, "/api/skill-programs");
    applyLegacyRouter(consumer, skillPartnersRoutes, "/api/skill-partners");
    applyLegacyRouter(consumer, studentLearningRoutes, "/api/student-learning");
    applyLegacyRouter(consumer, practiceRoutes, "/api/practice");
  }
}
