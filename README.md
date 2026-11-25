# Session 4 Library API

A beginner-friendly Express 5 and TypeScript REST API. Books live in an in-memory
array and are lost when the server restarts. No database is required.

## Run locally

Verification was performed using Node.js `v24.13.0`.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `PORT` (default: `3000`).
3. Run `npm run dev`, or run `npm run build` followed by `npm start`.

PORT must contain an integer from 1 to 65535. Invalid values prevent startup.
On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Endpoints

| Method | Path | Result |
| --- | --- | --- |
| GET | `/health` | 200, `{ "status": "ok" }` |
| GET | `/api/books` | 200, all books |
| GET | `/api/books/:id` | 200, one book |
| POST | `/api/books` | 201, created book |
| PATCH | `/api/books/:id` | 200, updated book |
| DELETE | `/api/books/:id` | 204, no response body |

POST requires all four fields:

```json
{
  "title": "The Hobbit",
  "author": "J. R. R. Tolkien",
  "genre": "Fantasy",
  "available": true
}
```

The server generates a UUID `id`. PATCH accepts one or more of the same four
fields. Text is trimmed and must not be blank. `available` must be a boolean.
Unknown fields, invalid bodies, and empty PATCH requests return 400. Missing books
and unknown routes return 404. JSON request bodies exceeding the default 100 KB
limit return 413 with `{ "error": { "message": "Invalid request body" } }`.
Unexpected errors return 500 without internal details.

Book responses use `{ "data": ... }`; errors use
`{ "error": { "message": "..." } }`, with `details` for schema validation errors.

## Structure and checks

Routes connect URLs to controllers; controllers validate input and send responses;
services manage the in-memory array. `app.ts` configures middleware and routes;
`server.ts` reads the validated port and starts listening. Request logging runs
before routes, and centralized error handling runs last.

Run `npm run typecheck`, `npm run build`, and `npm test`. Tests start the app on
an automatically assigned local port and make real HTTP requests with Node's
built-in test runner and fetch.

## Manual Postman verification

The project author successfully completed all eight manual Postman checks,
covering all five CRUD endpoints, the health endpoint, invalid requests (400),
and missing books (404). Adding multiple books was also tested successfully.
Storage remains in memory only; books are lost when the server restarts.

## AI Assistance

AI assisted with implementing the API, writing and running automated HTTP tests,
and reviewing the code and documentation. Verification consisted of automated
typecheck, build, tests, and Git diff checks. The project author separately
performed the successful manual Postman verification described above.
