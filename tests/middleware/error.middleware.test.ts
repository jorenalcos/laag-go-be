
import { describe, expect, it, vi, afterEach } from "vitest";
import { errorMiddleware } from "../../src/middleware/error.middleware";

describe("Error Middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return a custom error status and message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = Object.assign(new Error("Resource not found"), {
      statusCode: 404,
    });

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Resource not found",
    });
  });

  it("should hide internal server error messages", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Database connection failed");

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error",
    });
  });

  it("should log the original error", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const err = new Error("Unexpected failure");

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith(err);
  });

  it("should return a fallback message when a custom error has no message", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const err = { statusCode: 400, message: "" };

    const req = {} as any;
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as any;
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Request failed",
    });
  });
});
