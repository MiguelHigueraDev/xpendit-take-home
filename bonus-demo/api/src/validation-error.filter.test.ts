import { ArgumentsHost, HttpStatus } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "xpendit-rules-engine";
import { ValidationErrorFilter } from "./validation-error.filter.js";

describe("ValidationErrorFilter", () => {
  it("responds with 400 and the exception message", () => {
    const filter = new ValidationErrorFilter();
    const send = vi.fn();
    const status = vi.fn().mockReturnValue({ send });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new ValidationError("Invalid ISO date", []), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      message: "Invalid ISO date",
      error: "Bad Request",
    });
  });
});
