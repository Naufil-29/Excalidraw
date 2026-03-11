# Excelidraw

A real-time collaborative whiteboard with hand-drawn style diagrams. Create rooms, draw shapes, and sync with others instantly.

---

## Features

- **Free drawing** — Shapes, lines, and text with a natural hand-drawn look. Resize and move elements with corner handles.
- **Real-time collaboration** — Create or join rooms; everyone sees the same canvas and updates as they happen.
- **Cloud sync** — Shapes and positions are persisted. Reload or return later and pick up where you left off.
- **Rooms** — Create a room by name (slug) or join an existing one by slug; each room has its own canvas and chat.
- **Room chat** — Real-time chat per room; messages are persisted and broadcast via WebSocket.
- **Authentication** — Sign up and sign in; JWT-based auth required to create/join rooms and use the canvas.
- **Two frontends** — **excelidraw-project**: full whiteboard app (landing, auth, canvas). **web**: lightweight join-by-slug and chat experience.

---

## Auth & Backend Practices

- **Auth:** Custom JWT (no NextAuth). The HTTP backend issues a JWT on sign-in; the frontend stores it in `localStorage` and sends it as `Authorization: Bearer <token>` for protected HTTP calls and as `?token=<token>` when connecting to the WebSocket.
- **HTTP backend (Express 5):** Request bodies validated with Zod (`@repo/common/zodTypes`) for signup, signin, and create-room. JWT middleware protects `POST /room` and `GET /chats/:roomId`. CORS and JSON body parsing; errors returned as JSON.
- **WebSocket backend (ws):** Connection requires a valid JWT in the query string; invalid or missing token closes the connection. All actions (join_room, chat, delete_shape, update_shape) run after auth; shape updates and chat messages are persisted to the database and broadcast to the room.
- **Database:** PostgreSQL via Prisma; shared client in `@repo/db` used by both http-backend and ws-backend. There are no Next.js API routes; all HTTP API lives on the Express server.

---

## Tech Stack & Implementation

### Tech stack

| Layer        | Technologies |
|-------------|--------------|
| Monorepo    | Turborepo, pnpm workspaces, Node ≥18 |
| Frontend    | Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide, Axios; shared UI in `@repo/ui` |
| Backend     | Express 5 (REST), `ws` (WebSocket server) |
| Database    | PostgreSQL, Prisma |
| Shared      | TypeScript, Zod (`@repo/common`), JWT config (`@repo/backend-common`), shared tsconfig and ESLint |

### Key implementation

- **Turborepo:** Apps in `apps/*` (excelidraw-project, web, http-backend, ws-backend) and shared packages in `packages/*` (db, ui, common, backend-common, typescript-config, eslint-config). Build order via `^build`; `dev` is persistent and uncached.
- **Frontend:** Token kept in `localStorage`; no server-side session. Excelidraw app uses indigo accent, grid background, and backdrop-blur nav; canvas is at `/canvas/[roomId]`.
- **Backend:** Single Express app (port 3005) and single WebSocket server (port 8080). Prisma client and Zod schemas are shared across backends.

---

## Folder structure

```
my-turborepo/
├── apps/
│   ├── excelidraw-project/   # Main whiteboard Next.js app (landing, auth, canvas)
│   ├── web/                  # Lightweight Next.js app (join by slug, chat)
│   ├── http-backend/         # Express REST API (port 3005)
│   └── ws-backend/           # WebSocket server (port 8080)
├── packages/
│   ├── db/                   # Prisma client + PostgreSQL schema
│   ├── ui/                   # Shared React UI components
│   ├── common/               # Zod schemas (auth, room)
│   ├── backend-common/       # JWT secret config
│   ├── typescript-config/    # Shared TypeScript configs
│   └── eslint-config/       # Shared ESLint config
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

## Example environment variables

Create a `.env` in the relevant app/package roots (e.g. `packages/db`, `apps/http-backend`, `apps/ws-backend`) or use a root `.env` if your setup loads it for all.

```env
# Database (packages/db, http-backend, ws-backend)
DATABASE_URL="postgresql://user:password@localhost:5432/excelidraw"
DIRECT_URL="postgresql://user:password@localhost:5432/excelidraw"

# Auth (http-backend, ws-backend via @repo/backend-common)
JWT_SECRET="your-secret-key"
```

- **Frontend:** Backend URLs are currently in code: `apps/excelidraw-project/config.ts` (`HTTP_BACKEND`, `WS_BACKEND`) and `apps/web/app/config.ts` (`BACKEND_URL`, `WS_URL`). Defaults are `http://localhost:3005` and `ws://localhost:8080`. You can later move these to env vars if needed.

---

## Routes

### HTTP API (Express — e.g. `http://localhost:3005`)

| Method | Path            | Auth   | Description |
|--------|-----------------|--------|-------------|
| POST   | `/signup`       | No     | Register (body: `username`, `password`, `name`). Returns `userId`. |
| POST   | `/signin`       | No     | Sign in (body: `username`, `password`). Returns JWT `token`. |
| POST   | `/room`         | Bearer | Create room (body: `name`). Returns `roomID`. |
| GET    | `/chats/:roomId`| Bearer | List chats for room (e.g. last 1000); used for shape history. |
| GET    | `/room/:slug`   | No     | Get room by slug. Returns `room`. |

### WebSocket (e.g. `ws://localhost:8080`)

- **Connect:** `ws://...?token=<JWT>`. Invalid or missing token → connection closed.

**Message types (JSON):**

| Type           | Payload                          | Description |
|----------------|----------------------------------|-------------|
| `join_room`    | `{ type: "join_room", roomId }`  | Subscribe to room. |
| `leave_room`   | `{ type: "leave_room", room }`   | Unsubscribe from room. |
| `chat`         | `{ type: "chat", roomId, message }` | Send message; persisted and broadcast to room. |
| `delete_shape`| `{ type: "delete_shape", roomId, shapeId }` | Delete shape; persisted and broadcast. |
| `update_shape`| `{ type: "update_shape", roomId, shape }`   | Update shape; persisted and broadcast. |

### Page routes

**excelidraw-project (Next.js):**

| Route               | Purpose                    |
|---------------------|----------------------------|
| `/`                 | Landing (create/join room, sign in/up) |
| `/signin`           | Sign-in page               |
| `/signup`           | Sign-up page               |
| `/canvas/[roomId]`  | Whiteboard canvas for room |

**web (Next.js):**

| Route          | Purpose                |
|----------------|------------------------|
| `/`            | Home; enter room slug, then join |
| `/room/[slug]` | Room page (chat)       |

---

## Getting started

**Prerequisites:** Node.js ≥18, pnpm, PostgreSQL.

1. Clone the repo and go to the monorepo root:
   ```bash
   cd my-turborepo
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables (see [Example environment variables](#example-environment-variables)) in `packages/db`, `apps/http-backend`, and `apps/ws-backend` (or a shared `.env` if configured).

4. Generate Prisma client and run migrations (from repo root or `packages/db`):
   ```bash
   pnpm --filter @repo/db exec prisma generate
   pnpm --filter @repo/db exec prisma migrate dev
   ```

5. Run all apps in development:
   ```bash
   pnpm dev
   ```
   Or run specific apps, e.g.:
   ```bash
   pnpm --filter excelidraw-project dev
   pnpm --filter http-backend dev
   pnpm --filter ws-backend dev
   ```

**Ports:** Next.js apps (e.g. excelidraw-project, web) use their default ports (e.g. 3000, 3001). HTTP API: **3005**. WebSocket: **8080**.

**Scripts (root):**

- `pnpm build` — build all apps and packages  
- `pnpm dev` — run all apps in dev mode  
- `pnpm lint` — lint  
- `pnpm format` — format with Prettier  
- `pnpm check-types` — type check  

---

## Author

**Naufil** — full-stack developer.

- **Repository:** [github.com/Naufil-29/Excalidraw](https://github.com/Naufil-29/Excalidraw)
