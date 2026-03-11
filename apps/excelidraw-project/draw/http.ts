import { HTTP_BACKEND } from "@/config";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function getExistingShapes(roomId: string) {
  const token = getToken();
  const res = await fetch(`${HTTP_BACKEND}/chats/${roomId}`, {
    headers: token ? { Authorization: token } : {},
  });
  const data = await res.json();
  const messages = (data.messages ?? []).slice().reverse();
  let shapes: { id?: string }[] = [];
  for (const x of messages) {
    const parsed = JSON.parse((x as { message: string }).message);
    if (parsed.shape && !parsed.type) shapes.push(parsed.shape);
    if (parsed.type === "delete" && parsed.shapeId)
      shapes = shapes.filter((s) => s.id !== parsed.shapeId);
    if (parsed.type === "update" && parsed.shape && parsed.shape.id) {
      const idx = shapes.findIndex((s) => s.id === parsed.shape.id);
      if (idx >= 0) shapes[idx] = parsed.shape;
    }
  }
  return shapes;
}

/*
 * CHANGELOG (auth for shapes):
 * - getExistingShapes now sends Authorization header with JWT from localStorage.
 * - GET /chats/:roomId is protected by backend middleware; token is required so existing shapes load for signed-in users.
 * - Switched from axios to fetch to avoid extra dependency for this single call.
 * CHANGELOG (permanent delete):
 * - Load replays event log: messages with .shape are added, messages with .type === "delete" remove that shapeId from the list. After refresh, deleted shapes stay gone.
 * CHANGELOG (replay update):
 * - Messages with .type === "update" and .shape replace the existing shape with that id in the list so moved/resized positions persist after refresh.
 */