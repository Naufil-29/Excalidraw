# Excalidraw Clone – Features & Changes

A concise list of all features and changes implemented in this app.

---

## 1. Project & Architecture

- **Monorepo (Turborepo)** with TypeScript, Prisma, Supabase (PostgreSQL).
- **Three apps:**
  - **excelidraw-project** – Next.js frontend (canvas + auth + rooms).
  - **http-backend** – REST API (signup, signin, rooms, chats/shapes).
  - **ws-backend** – WebSocket server for real-time canvas sync.
- **Shared packages:** `packages/common` (Zod/types), `packages/db` (Prisma client).
- **DB models:** User, Room, Chat (Chat stores shape events as JSON in `message`).

---

## 2. Authentication

- **Signup:** Create user via `POST /signup` (username, password, name). On success → navigate to Sign In.
- **Signin:** Authenticate via `POST /signin` (username, password). On success → JWT stored in `localStorage` as `token`, then redirect to home.
- **Frontend:** `lib/auth.ts` – `signup()` and `signin()` with typed responses.
- **AuthPage component:** Shared form for signin/signup; calls auth helpers; shows errors; signup → `/signin`, signin → save token and `/`.
- **Signup page:** Fixed export name (`Signup` instead of `Signin`).

---

## 3. Rooms & Navigation

- **Create Room:** Authenticated users can create a room (prompt for name); `createRoom(name, token)` → `POST /room`; navigate to `/canvas/:roomId`.
- **Join Room:** Prompt for room slug; `getRoomBySlug(slug)` → `GET /room/:slug`; navigate to `/canvas/:roomId`.
- **lib/rooms.ts:** `createRoom(name, token)` and `getRoomBySlug(slug)` with typed responses.
- **Landing (page.tsx):** Navbar shows “Sign In” / “Sign Up” when logged out; “Create Room” / “Join Room” when logged in (token in `localStorage`). Error banner for room errors.

---

## 4. WebSocket & Real-Time Canvas

- **RoomCanvas:** Connects to `ws-backend` with JWT from `localStorage` in query (`?token=...`). If no token → redirect to `/signin`. Sends `join_room` with `roomId` on open.
- **Shapes over WS:** New shapes sent as `chat` (message contains `{ shape }`). Server broadcasts to room; clients add shape only if they don’t already have that `id` (avoids duplicate/shadow on drag).
- **Delete/Update over WS:** `delete_shape` and `update_shape` messages; ws-backend persists them to DB (Chat table) then broadcasts so deletes and moves/resizes survive refresh.

---

## 5. Canvas & Drawing

- **Tools:** Rectangle, Circle, Pencil, Select, Text.
- **Rectangle:** Drag to draw; stored as `rect` (x, y, width, height).
- **Circle:** Drag to draw; stored as `circle` (centerX, centerY, radius).
- **Pencil:** Single freehand line from mousedown to mouseup; stored as `pencil` (startX, startY, endX, endY). Preview line while dragging.
- **Text:** Click on canvas → prompt for text; stored as `text` (x, y, text). Optional `fontSize` (default 16); text can be resized by dragging corner handles.
- **Select:** Click on shape border/body → select shape and open edit dialog. Hit-test for rect (border), circle (outline), pencil (line segment), text (bounding box using fontSize).

---

## 6. Shape Model & Types

- **All shapes:** `id` (string), optional `strokeColor`. IDs generated for new shapes; loaded shapes normalized with fallback id.
- **Stroke colors:** 5 options – black, red, blue, green, purple (`STROKE_COLORS` in `draw/types.ts`).
- **Shared types/helpers:** `Shape` union (rect, circle, pencil, text), `generateShapeId`, `ensureShapeId`, `scaleShape`, `getShapeCenter`, `getShapeRef`, `setShapeRef` (used for relocate).
- **Text shape:** Added optional `fontSize`; used for rendering, handles, hit-test, and resize-by-handle.

---

## 7. Edit Dialog (ShapeEditDialog)

- **When:** Select tool + click on shape → dialog opens (edit mode).
- **Resize / Relocate:** Two modes. **Resize** – blue outline + corner handles; drag handle to resize (rect corners, circle N/E/S/W, pencil ends, text corners → font size). **Relocate** – drag shape body to move.
- **Resize & Relocate for text:** Buttons shown for text as well (previously hidden); relocate = move text; resize = drag corner to change font size (10–72px).
- **Border color:** 5 solid color buttons; updates shape and syncs via `update_shape`.
- **Text editing:** For text shapes, an input field to change the text content.
- **Delete:** “Delete shape” removes shape, closes dialog, and sends `delete_shape` (persisted).
- **Event handling:** `stopPropagation` / `preventDefault` on dialog and buttons so canvas doesn’t create new shapes on button click.

---

## 8. Resize by Handles (Game.ts)

- **Handles:** Rect 4 corners (nw, ne, se, sw); circle 4 points (n, e, s, w); pencil 2 ends (start, end); text 4 corners (font size resize).
- **Logic:** `getHandlePositions`, `drawHandles`, `getHandleAt`, `applyHandleResize`; on mousedown on handle → resize drag; on mouseup → `update_shape` and persist.
- **Interaction mode:** `resize` vs `relocate` stored in Game; MainCanvas syncs from dialog and passes to Game.

---

## 9. Relocate by Drag (Game.ts)

- **When:** Select tool, shape selected, mode = Relocate. Mousedown on shape body starts move; mousemove moves shape with cursor; mouseup sends `update_shape` and persists.
- **Implementation:** `moveDrag` with shapeId and offset from ref point; `getShapeRef` / `setShapeRef` for position (rect/circle/pencil/text).

---

## 10. Persistence & Event Replay

- **Chat table:** Stores shape events as JSON in `message`: add (`{ shape }`), delete (`{ type: "delete", shapeId }`), update (`{ type: "update", shape }`).
- **Loading shapes:** `getExistingShapes(roomId)` – GET `/chats/:roomId` with `Authorization: token`. Messages reversed (backend returns newest first); replayed in order: add → push, delete → filter by shapeId, update → replace by id.
- **Result:** Created, moved, resized, and deleted shapes persist across refresh and for users joining later.

---

## 11. HTTP Backend

- **Auth:** POST `/signup`, POST `/signin` (JWT).
- **Rooms:** POST `/room` (create, auth), GET `/room/:slug` (get by slug).
- **Shapes:** GET `/chats/:roomId` (auth) – returns messages (event log) for replay.

---

## 12. WS Backend

- **Auth:** JWT via query param; validates and associates user with connection.
- **Rooms:** `join_room` (roomId); broadcast to room.
- **Messages:** `chat` (broadcast only), `delete_shape` (persist to Chat then broadcast), `update_shape` (persist to Chat then broadcast).

---

## 13. Bug Fixes & Small Changes

- **Game destroy():** Cleanup uses `removeEventListener` (not `addEventListener`).
- **Signup page:** Export name fixed to `Signup`.
- **RoomCanvas:** No hardcoded JWT; token from `localStorage`.
- **getExistingShapes:** Sends JWT in `Authorization` header.
- **Dialog buttons:** Resize/Relocate (and other buttons) don’t create a new shape on canvas (dialog + `dialogOpen` flag; `mouseUp` skips shape creation when dialog open).
- **Update shape:** Dialog uses `getShapeById` so it updates the current shape in Game state (no duplicate shape from stale ref).
- **Deleted shapes:** Persist delete in ws-backend and replay deletes in `getExistingShapes` so deleted shapes don’t reappear on refresh.
- **Duplicate/shadow on drag:** On incoming `chat`, only add shape if `existingShapes` doesn’t already have that `id` (avoids echo creating a duplicate).
- **Text in dialog:** Resize and Relocate buttons shown for text; text supports relocate and resize (font size via handles).

---

## 14. Landing Page UI

- **Redesign:** Modern layout with indigo accent, subtle grid background, refined typography.
- **Navbar:** Logo, auth/room actions, error strip below when needed.
- **Hero:** Headline, short description, canvas preview (e.g. with window chrome).
- **Metadata:** `layout.tsx` title/description updated for “DrawApp”.

---

## File-Level Summary

| Area            | Files |
|-----------------|--------|
| Auth            | `lib/auth.ts`, `components/AuthPage.tsx`, signup/signin pages |
| Rooms           | `lib/rooms.ts`, `app/page.tsx` (navbar + create/join) |
| Canvas/WS       | `components/RoomCanvas.tsx`, `components/MainCanvas.tsx`, `draw/Game.ts` |
| Shapes/HTTP     | `draw/http.ts`, `draw/types.ts` |
| Edit UI         | `components/ShapeEditDialog.tsx` |
| Backends        | `apps/http-backend/src/index.ts`, `apps/ws-backend/src/index.ts` |
