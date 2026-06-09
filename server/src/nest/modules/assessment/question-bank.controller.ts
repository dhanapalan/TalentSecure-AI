import {
  Controller, Get, Post, Put, Delete, Body, Param, Query,
} from "@nestjs/common";
import { Roles } from "../../common/decorators/roles.decorator.js";
import * as qbService from "../../../services/questionBank.service.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { AuthPayload } from "../../../types/index.js";

@Controller("api/questions")
export class QuestionBankController {
  @Get()
  async list(@Query() q: any) {
    const result = await qbService.filterQuestions({
      category: q.category,
      type: q.type,
      difficulty_level: q.difficulty_level,
      tags: q.tags ? (Array.isArray(q.tags) ? q.tags : [q.tags]) : undefined,
      search: q.search,
      is_active: q.is_active !== undefined ? q.is_active === "true" : undefined,
      limit: q.limit ? parseInt(q.limit) : undefined,
      offset: q.offset ? parseInt(q.offset) : undefined,
    });
    return { success: true, ...result };
  }

  @Get("categories")
  async categoryCounts() {
    const counts = await qbService.getCategoryCounts();
    return { success: true, data: counts };
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const q = await qbService.getQuestionById(id);
    return { success: true, data: q };
  }

  @Post()
  @Roles("super_admin", "admin", "hr", "engineer")
  async create(@Body() body: any, @CurrentUser() user: AuthPayload) {
    const question = await qbService.createQuestion({ ...body, created_by: user.userId });
    return { success: true, data: question };
  }

  @Post("bulk")
  @Roles("super_admin", "admin", "hr")
  async bulkCreate(@Body() body: { questions: any[] }, @CurrentUser() user: AuthPayload) {
    const questions = await qbService.bulkInsert(
      body.questions.map((q) => ({ ...q, created_by: user.userId })),
    );
    return { success: true, data: questions };
  }

  @Put(":id")
  @Roles("super_admin", "admin", "hr", "engineer")
  async update(@Param("id") id: string, @Body() body: any) {
    const question = await qbService.updateQuestion(id, body);
    return { success: true, data: question };
  }

  @Delete(":id")
  @Roles("super_admin", "admin", "hr", "college_admin")
  async deactivate(@Param("id") id: string) {
    await qbService.deactivateQuestion(id);
    return { success: true, message: "Question deactivated" };
  }

  @Delete(":id/permanent")
  @Roles("super_admin", "admin")
  async hardDelete(@Param("id") id: string) {
    await qbService.deleteQuestion(id);
    return { success: true, message: "Question permanently deleted" };
  }
}
