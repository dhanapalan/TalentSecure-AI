import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthPayload } from "../../../types/index.js";

/** Extracts the authenticated user from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPayload => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.user as AuthPayload;
  },
);
