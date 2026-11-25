import type { RequestHandler } from "express";

export const requestLogger: RequestHandler = (req, res, next) => {
  const path = req.path;
  res.on("finish", () => {
    console.log(`${req.method} ${path} ${res.statusCode}`);
  });
  next();
};
