# AI Chatbot — Backend

Express + MongoDB + Gemini backend for the AI Chatbot project, built per the project spec (Steps 1–15).

## Setup

```bash
cd backend
npm install
cp .env.example .env
# then fill in .env with real values (see below)
npm run dev      # nodemon, auto-restart
# or
npm start        # plain node
```

## Environment variables (`.env`)

| Variable | Description |
|---|---|
| `PORT` | Port the API listens on (default `5000`) |
| `MONGODB_URI` | MongoDB connection string (Atlas or local) |
| `JWT_SECRET` | Long random string used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GEMINI_MODEL` | e.g. `gemini-2.0-flash` |
| `CLIENT_URL` | Frontend origin, for CORS (e.g. `http://localhost:5173`) |

## What's implemented

- **Auth**: signup, login, `GET /api/auth/me`, logout — bcrypt password hashing, JWT issuance/verification.
- **Chat CRUD**: create, list, get-with-messages, rename, delete — all scoped to the authenticated user.
- **Messages**: `POST /api/chats/:chatId/messages` (normal request/response) and `POST /api/chats/:chatId/messages/stream` (Server-Sent Events streaming), both loading prior conversation history as context for Gemini.
- **Ownership enforcement**: every chat/message operation re-derives the user from the verified JWT and queries `{ _id: chatId, userId }` — a chat that isn't the caller's simply 404s.
- **Validation**: signup/login/title/message payloads are checked before hitting the DB or Gemini.
- **Error handling**: a single `errorHandler` middleware returns clean JSON and never leaks stack traces, Mongo errors, or API keys.
- **Rate limiting**: stricter limits on `/api/auth/*` and message-sending; a general limiter on the whole API.

## API Reference

Base URL: `/api`

### Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/auth/signup` | – | `{ name, email, password, confirmPassword }` |
| POST | `/auth/login` | – | `{ email, password }` |
| GET | `/auth/me` | ✅ | – |
| POST | `/auth/logout` | ✅ | – |

### Chats
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/chats` | ✅ | `{ title? }` |
| GET | `/chats` | ✅ | – |
| GET | `/chats/:chatId` | ✅ | – |
| PATCH | `/chats/:chatId` | ✅ | `{ title }` |
| DELETE | `/chats/:chatId` | ✅ | – |

### Messages
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/chats/:chatId/messages` | ✅ | `{ message }` → returns full AI reply |
| POST | `/chats/:chatId/messages/stream` | ✅ | `{ message }` → Server-Sent Events (`chunk`, `done`, `error`) |

All `✅` routes require `Authorization: Bearer <token>`.

## Streaming format (SSE)

```
event: chunk
data: {"text":"Hello"}

event: chunk
data: {"text":" there"}

event: done
data: {}
```

On failure mid-stream, an `event: error` with `{"message": "..."}` is sent instead of `done`.
On the frontend, use `fetch` + a `ReadableStream` reader (not `EventSource`, since this is a POST request) to consume this.

## Folder structure

```
backend/
├── src/
│   ├── config/database.js
│   ├── controllers/{auth,chat,message}.controller.js
│   ├── middleware/{auth,error,validation,rateLimit}.middleware.js
│   ├── models/{User,Chat,Message}.js
│   ├── routes/{auth,chat,message}.routes.js
│   ├── services/{gemini,chat,auth}.service.js
│   ├── utils/{jwt,validation}.js
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
└── package.json
```

## Next steps

This completes the backend build order from the spec (Steps 1–15: server → DB → models → auth → JWT middleware → chat/message models → chat CRUD → Gemini → message API → history → streaming → validation → rate limiting/security).

Not yet done: the frontend (React + Vite), which follows the Frontend Development Order in the spec. Let me know when you're ready to move to that.
