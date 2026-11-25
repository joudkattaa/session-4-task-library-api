import express from "express";
import { bookRouter } from "./routes/book.routes.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { HttpError } from "./errors/http-error.js";

export const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/books", bookRouter);

app.use((_req, _res, next) => {
  next(new HttpError(404, "Route not found"));
});
app.use(errorHandler);
