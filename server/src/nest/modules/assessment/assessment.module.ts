import { Module } from "@nestjs/common";
import { QuestionBankController } from "./question-bank.controller.js";
import { AssessmentRulesController } from "./assessment-rules.controller.js";
import { ExamsController } from "./exams.controller.js";

@Module({
  controllers: [QuestionBankController, AssessmentRulesController, ExamsController],
})
export class AssessmentModule {}
