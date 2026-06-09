import { SetMetadata } from "@nestjs/common";
import { UserRole } from "../../../types/index.js";

export const ROLES_KEY = "roles";
/** Restrict handler to one or more roles. Applied after JwtAuthGuard. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
