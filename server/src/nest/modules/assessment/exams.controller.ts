import {
  Controller, Get, Post, Body, Param, Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { AuthPayload } from "../../../types/index.js";
import { ExpressAdapter } from "../../utils/express-adapter.js";
import * as examController from "../../../controllers/exam.controller.js";
import * as examAttemptController from "../../../controllers/examAttempt.controller.js";

@Controller("api/exams")
export class ExamsController {
  @Get()
  list(@Query() query: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.list, { query, user });
  }

  @Get("active")
  listActive(@Query() query: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.listActive, { query, user });
  }

  @Get("languages")
  getSupportedLanguages() {
    return ExpressAdapter.invoke(examController.getSupportedLanguages, {});
  }

  @Get(":id")
  getById(@Param("id") id: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.getById, { params: { id }, user });
  }

  @Get(":id/questions")
  @Roles("super_admin", "admin", "hr", "college_admin", "engineer")
  getExamQuestions(@Param("id") id: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.getExamQuestions, { params: { id }, user });
  }

  @Post("generate")
  @Roles("super_admin", "admin", "hr", "college_admin")
  generateAssessment(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.generateAssessment, { body, user });
  }

  @Post("generate-dynamic")
  @Roles("super_admin", "admin", "hr", "college_admin")
  generateDynamic(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.generateDynamic, { body, user });
  }

  @Post("blueprint-curator")
  @Roles("super_admin", "admin", "hr", "college_admin")
  blueprintCurator(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.blueprintCurator, { body, user });
  }

  @Post("next-adaptive")
  nextAdaptive(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.nextAdaptive, { body, user });
  }

  @Post("execute-code")
  executeCode(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.executeCode, { body, user });
  }

  @Post("validate-code")
  validateCode(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.validateCode, { body, user });
  }

  @Post("run-tests")
  runTests(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.runTestCases, { body, user });
  }

  @Post("auto-save")
  @Roles("student")
  autoSave(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examAttemptController.autoSave, { body, user });
  }

  @Get(":id/attempt")
  getActiveAttempt(@Param("id") id: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examAttemptController.getActiveAttempt, { params: { id }, user });
  }

  @Post(":id/assign")
  @Roles("super_admin", "admin", "hr")
  assignExam(@Param("id") id: string, @Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.assignExam, { params: { id }, body, user });
  }

  @Get(":id/progress")
  @Roles("super_admin", "admin", "hr", "engineer", "cxo", "college_admin")
  getProgress(@Param("id") id: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.getProgress, { params: { id }, user });
  }

  @Post(":id/terminate")
  @Roles("super_admin", "admin", "hr")
  terminateExam(@Param("id") id: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(examController.terminateExam, { params: { id }, user });
  }

  @Post(":id/sessions/:sessionId/terminate")
  @Roles("super_admin", "admin", "hr", "engineer", "college_admin")
  terminateSession(
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: AuthPayload,
  ) {
    return ExpressAdapter.invoke(examController.terminateStudentSession, {
      params: { id, sessionId }, user,
    });
  }

  @Post(":id/sessions/:sessionId/reset")
  @Roles("super_admin", "admin", "hr", "engineer", "college_admin")
  resetSession(
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
    @CurrentUser() user: AuthPayload,
  ) {
    return ExpressAdapter.invoke(examController.resetStudentSession, {
      params: { id, sessionId }, user,
    });
  }
}
