import { Router } from "express";
import * as bookController from "../controllers/book.controller.js";

export const bookRouter = Router();

bookRouter.get("/", bookController.getBooks);
bookRouter.get("/:id", bookController.getBookById);
bookRouter.post("/", bookController.createBook);
bookRouter.patch("/:id", bookController.updateBook);
bookRouter.delete("/:id", bookController.deleteBook);
