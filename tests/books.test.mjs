import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { spawnSync } from "node:child_process";
import { app } from "../dist/app.js";
import express from "express";
import { errorHandler } from "../dist/middleware/error-handler.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  });
});

async function request(path, method = "GET", body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

const validBook = {
  title: "  The Hobbit  ", author: "J. R. R. Tolkien", genre: "Fantasy", available: true,
};

test("health remains available", async () => {
  assert.deepEqual(await request("/health"), { status: 200, body: { status: "ok" } });
});

test("all five CRUD endpoints use validated data and preserve partial updates", async () => {
  assert.deepEqual(await request("/api/books"), { status: 200, body: { data: [] } });
  const created = await request("/api/books", "POST", validBook);
  assert.equal(created.status, 201);
  const book = created.body.data;
  assert.equal(typeof book.id, "string");
  assert.equal(book.title, "The Hobbit");
  assert.equal(book.available, true);
  assert.deepEqual((await request(`/api/books/${book.id}`)).body.data, book);
  assert.deepEqual((await request("/api/books")).body.data, [book]);

  const patched = await request(`/api/books/${book.id}`, "PATCH", {
    title: "  Updated title  ", available: false,
  });
  assert.equal(patched.status, 200);
  assert.deepEqual(patched.body.data, { ...book, title: "Updated title", available: false });
  assert.deepEqual((await request(`/api/books/${book.id}`)).body, patched.body);

  assert.deepEqual(await request(`/api/books/${book.id}`, "DELETE"), { status: 204, body: null });
  assert.equal((await request(`/api/books/${book.id}`)).status, 404);
  assert.deepEqual((await request("/api/books")).body.data, []);
});

test("POST rejects missing, blank, wrongly typed, and unknown fields", async () => {
  for (const body of [
    {}, { ...validBook, title: "   " }, { ...validBook, author: "" },
    { ...validBook, genre: " " }, { ...validBook, available: "true" },
    { ...validBook, id: "client-id" }, null, [],
  ]) {
    const response = await request("/api/books", "POST", body);
    assert.equal(response.status, 400);
    assert.equal(typeof response.body.error.message, "string");
  }
  assert.deepEqual((await request("/api/books")).body.data, []);
});

test("PATCH rejects empty, unknown, blank, and wrongly typed fields without changing storage", async () => {
  const { body: { data: book } } = await request("/api/books", "POST", validBook);
  for (const body of [{}, { unknown: true }, { title: " " }, { available: 0 }, { author: null }, []]) {
    const response = await request(`/api/books/${book.id}`, "PATCH", body);
    assert.equal(response.status, 400);
    assert.equal(typeof response.body.error.message, "string");
  }
  assert.deepEqual((await request(`/api/books/${book.id}`)).body.data, book);
  await request(`/api/books/${book.id}`, "DELETE");
});

test("GET, PATCH, and DELETE return consistent 404 errors for missing books", async () => {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const response = await request("/api/books/missing", method,
      method === "PATCH" ? { available: false } : undefined);
    assert.deepEqual(response, { status: 404, body: { error: { message: "Book not found" } } });
  }
});

test("malformed JSON, absent bodies, and unknown routes return JSON errors", async () => {
  const response = await fetch(`${baseUrl}/api/books`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: '{"title":',
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: { message: "Invalid JSON body" } });
  assert.equal((await request("/api/books", "POST")).status, 400);
  assert.equal((await request("/api/books/missing", "PATCH")).status, 400);
  assert.deepEqual(await request("/unknown"), {
    status: 404, body: { error: { message: "Route not found" } },
  });
});

test("PORT accepts valid values and rejects invalid values before startup", () => {
  for (const port of ["1", "3000", "65535", "0", "65536", "-1", "3.5", "abc", ""]) {
    const result = spawnSync(process.execPath, ["--input-type=module", "-e",
      'const { PORT } = await import("./dist/config/env.js"); console.log("PORT=" + PORT);',
    ], { env: { ...process.env, PORT: port }, encoding: "utf8" });
    if (["1", "3000", "65535"].includes(port)) {
      assert.equal(result.status, 0, result.stderr);
      assert.ok(result.stdout.includes(`PORT=${port}`));
    } else {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /PORT must be an integer between 1 and 65535/);
    }
  }
});

test("oversized JSON returns a consistent 413 error", async () => {
  const response = await request("/api/books", "POST", {
    ...validBook, title: "a".repeat(110_000),
  });
  assert.deepEqual(response, {
    status: 413, body: { error: { message: "Invalid request body" } },
  });
});

test("unexpected errors return 500 without exposing internal details", async () => {
  const failingApp = express();
  failingApp.get("/", () => { throw new Error("Internal test failure"); });
  failingApp.use(errorHandler);
  const failingServer = failingApp.listen(0, "127.0.0.1");
  await once(failingServer, "listening");
  try {
    const response = await fetch(`http://127.0.0.1:${failingServer.address().port}`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: { message: "Internal server error" } });
  } finally {
    await new Promise((resolve, reject) => {
      failingServer.close((error) => error ? reject(error) : resolve());
      failingServer.closeAllConnections();
    });
  }
});
