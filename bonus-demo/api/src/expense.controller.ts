import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import type { ValidateRequestDto } from "./dto.js";
import { EngineService } from "./engine.service.js";

@Controller("api")
export class ExpenseController {
  private readonly engineService = new EngineService();

  @Get("policy")
  getPolicy(): Record<string, unknown> {
    return this.engineService.getPolicy();
  }

  @Post("validate")
  @HttpCode(HttpStatus.OK)
  validate(@Body() body: ValidateRequestDto) {
    return this.engineService.validate(body);
  }

  @Post("analyze")
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() csvContent: string) {
    return this.engineService.analyzeCsv(csvContent);
  }
}
