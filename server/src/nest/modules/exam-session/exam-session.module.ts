import { Module } from "@nestjs/common";
import { ExamSessionController } from "./exam-session.controller.js";
import { ProctoringController } from "./proctoring.controller.js";

@Module({
  controllers: [ExamSessionController, ProctoringController],
})
export class ExamSessionModule {}
