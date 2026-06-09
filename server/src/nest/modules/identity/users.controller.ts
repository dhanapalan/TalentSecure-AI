import {
  Controller, Get, Post, Put, Body, Param, Query,
} from "@nestjs/common";
import * as userController from "../../../controllers/user.controller.js";
import { Roles } from "../../common/decorators/roles.decorator.js";
import { ExpressAdapter } from "../../utils/express-adapter.js";

@Controller("api/users")
@Roles("super_admin", "admin")
export class UsersController {
  @Get()
  list(@Query() query: any, ...args: any[]) {
    return ExpressAdapter.invoke(userController.listUsers, { query });
  }

  @Post()
  create(@Body() body: any) {
    return ExpressAdapter.invoke(userController.createUser, { body });
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() body: any) {
    return ExpressAdapter.invoke(userController.updateUser, { params: { id }, body });
  }

  @Put(":id/role")
  updateRole(@Param("id") id: string, @Body() body: any) {
    return ExpressAdapter.invoke(userController.updateUserRole, { params: { id }, body });
  }

  @Put(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: any) {
    return ExpressAdapter.invoke(userController.updateUserStatus, { params: { id }, body });
  }

  @Post(":id/reset-password")
  resetPassword(@Param("id") id: string, @Body() body: any) {
    return ExpressAdapter.invoke(userController.resetPassword, { params: { id }, body });
  }

  @Put(":id/password")
  updatePassword(@Param("id") id: string, @Body() body: any) {
    return ExpressAdapter.invoke(userController.updatePassword as any, { params: { id }, body });
  }
}
