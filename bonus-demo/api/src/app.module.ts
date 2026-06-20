import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ExpenseController } from "./expense.controller.js";
import { ValidationErrorFilter } from "./validation-error.filter.js";

@Module({
  controllers: [ExpenseController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
  ],
})
export class AppModule {}
