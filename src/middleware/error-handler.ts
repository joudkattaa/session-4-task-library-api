import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../errors/http-error.js";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: {
      message: "Validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    } });
    return;
  }

  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ error: { message: error.message } });
    return;
  }

  // express.json() reports malformed JSON and other body parsing errors here.
  if (error instanceof Error && "status" in error &&
      typeof error.status === "number" && error.status >= 400 && error.status < 500) {
    const message = "type" in error && error.type === "entity.parse.failed"
      ? "Invalid JSON body"
      : "Invalid request body";
    res.status(error.status).json({ error: { message } });
    return;
  }

  console.error(error);
  res.status(500).json({ error: { message: "Internal server error" } });
};
