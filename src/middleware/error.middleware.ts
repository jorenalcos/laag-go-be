import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  console.error(err);

  const statusCode =
    typeof err.statusCode === "number" ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};