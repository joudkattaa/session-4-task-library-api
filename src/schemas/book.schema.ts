import { z } from "zod";

const bookFields = {
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  genre: z.string().trim().min(1, "Genre is required"),
  available: z.boolean(),
};

export const createBookSchema = z.object(bookFields).strict();

export const updateBookSchema = z.object(bookFields).partial().strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Provide at least one book field to update" },
);

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
