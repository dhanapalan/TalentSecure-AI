import { Module } from "@nestjs/common";
import { DriveController } from "./drive.controller.js";

@Module({
  controllers: [DriveController],
})
export class DriveModule {}
