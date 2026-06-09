import { Controller, Get, Post, Body, Param, Query } from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { AuthPayload } from "../../../types/index.js";
import { ExpressAdapter } from "../../utils/express-adapter.js";
import { proctoringController } from "../../../controllers/proctoring.controller.js";

const MONITOR_ROLES = ["super_admin", "admin", "hr", "engineer", "cxo", "college_admin"] as const;

@Controller("api/proctoring")
export class ProctoringController {
  @Get("events")
  @Roles(...MONITOR_ROLES)
  getEvents(@Query() query: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.getEvents, { query, user });
  }

  @Post("events")
  @Roles("student")
  logEvent(@Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.logEvent, { body, user });
  }

  @Get("live")
  @Roles(...MONITOR_ROLES)
  getLive(@Query() query: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.getLiveMonitoring, { query, user });
  }

  @Get("session/:sessionId/timeline")
  @Roles(...MONITOR_ROLES)
  getTimeline(@Param("sessionId") sessionId: string, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.getSessionTimeline, { params: { sessionId }, user });
  }

  @Post("session/:sessionId/clear")
  @Roles("super_admin", "admin", "hr", "college_admin")
  clearIncident(@Param("sessionId") sessionId: string, @Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.clearIncident, { params: { sessionId }, body, user });
  }

  @Post("session/:sessionId/terminate")
  @Roles("super_admin", "admin", "hr", "college_admin")
  terminateSession(@Param("sessionId") sessionId: string, @Body() body: any, @CurrentUser() user: AuthPayload) {
    return ExpressAdapter.invoke(proctoringController.terminateSession, { params: { sessionId }, body, user });
  }
}
