import { Controller, Get, Post, Put, Body, Param } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { AuthPayload } from "../../../types/index.js";
import * as sessionService from "../../../services/examSession.service.js";

@Controller("api/exam-session")
@Roles("student")
export class ExamSessionController {
  @Get("my-drives")
  async getMyDrives(@CurrentUser() user: AuthPayload): Promise<any> {
    const drives = await sessionService.getStudentDrives(user.userId);
    return { success: true, data: drives };
  }

  @Post(":driveId/start")
  async startSession(@Param("driveId") driveId: string, @CurrentUser() user: AuthPayload): Promise<any> {
    const session = await sessionService.startSession(driveId, user.userId);
    return { success: true, data: session };
  }

  @Get(":driveId/session")
  async getSession(@Param("driveId") driveId: string, @CurrentUser() user: AuthPayload): Promise<any> {
    const result = await sessionService.getSession(driveId, user.userId);
    return { success: true, data: result };
  }

  @Put(":driveId/save")
  async saveAnswer(@Param("driveId") driveId: string, @Body() body: any, @CurrentUser() user: AuthPayload): Promise<any> {
    const result = await sessionService.saveAnswer(driveId, user.userId, body);
    return { success: true, data: result };
  }

  @Post(":driveId/submit")
  async submitExam(@Param("driveId") driveId: string, @CurrentUser() user: AuthPayload): Promise<any> {
    const result = await sessionService.submitExam(driveId, user.userId, { triggeredBy: "student" });
    return { success: true, data: result };
  }
}
