import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Request } from "express";
import { UserRole } from "../../../types/index.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";
import { logPermissionDenied } from "../../../services/audit.service.js";

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "super_admin",
  college: "college_admin",
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<Request>();
    if (!req.user) throw new ForbiddenException("Authentication required");

    const raw = req.user.role.toLowerCase() as UserRole;
    const effective = ROLE_ALIASES[raw] ?? raw;

    const expanded = new Set<string>(required);
    for (const r of required) {
      const alias = ROLE_ALIASES[r];
      if (alias) expanded.add(alias);
    }
    for (const [legacy, canonical] of Object.entries(ROLE_ALIASES)) {
      if (expanded.has(canonical)) expanded.add(legacy);
    }

    if (!expanded.has(effective)) {
      logPermissionDenied(req).catch(() => {});
      throw new ForbiddenException("Insufficient permissions");
    }
    return true;
  }
}
