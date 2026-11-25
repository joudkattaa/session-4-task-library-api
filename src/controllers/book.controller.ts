import type { Request, Response } from "express";
import * as bookService from "../services/book.service.js";
import { createBookSchema, updateBookSchema } from "../schemas/book.schema.js";

type BookRequest = Request<{ id: string }>;

export function getBooks(_req: Request, res: Response): void {
  res.status(200).json({ data: bookService.getBooks() });
}

export function getBookById(req: BookRequest, res: Response): void {
  res.status(200).json({ data: bookService.getBookById(req.params.id) });
}

export function createBook(req: Request, res: Response): void {
  const data = createBookSchema.parse(req.body);
  res.status(201).json({ data: bookService.createBook(data) });
}

export function updateBook(req: BookRequest, res: Response): void {
  const data = updateBookSchema.parse(req.body);
  res.status(200).json({ data: bookService.updateBook(req.params.id, data) });
}

export function deleteBook(req: BookRequest, res: Response): void {
  bookService.deleteBook(req.params.id);
  res.status(204).send();
}
