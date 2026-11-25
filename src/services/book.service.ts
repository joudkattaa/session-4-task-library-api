import { randomUUID } from "node:crypto";
import type { Book } from "../models/book.js";
import type { CreateBookInput, UpdateBookInput } from "../schemas/book.schema.js";
import { HttpError } from "../errors/http-error.js";

const books: Book[] = [];

export function getBooks(): Book[] {
  return books;
}

export function getBookById(id: string): Book {
  const book = books.find((book) => book.id === id);
  if (!book) throw new HttpError(404, "Book not found");
  return book;
}

export function createBook(data: CreateBookInput): Book {
  const book: Book = { id: randomUUID(), ...data };
  books.push(book);
  return book;
}

export function updateBook(id: string, data: UpdateBookInput): Book {
  const book = getBookById(id);
  Object.assign(book, data);
  return book;
}

export function deleteBook(id: string): void {
  const book = getBookById(id);
  books.splice(books.indexOf(book), 1);
}
