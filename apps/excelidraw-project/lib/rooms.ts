import { HTTP_BACKEND } from "@/config";

export type CreateRoomResponse =
  | { ok: true; roomId: number }
  | { ok: false; message: string };

export type GetRoomResponse =
  | { ok: true; roomId: number }
  | { ok: false; message: string };

export async function createRoom(
  name: string,
  token: string
): Promise<CreateRoomResponse> {
  try {
    const res = await fetch(`${HTTP_BACKEND}/room`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok || !data.roomID) {
      return {
        ok: false,
        message: data.Msg ?? data.message ?? "Failed to create room",
      };
    }
    return { ok: true, roomId: data.roomID };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

export async function getRoomBySlug(slug: string): Promise<GetRoomResponse> {
  try {
    const res = await fetch(`${HTTP_BACKEND}/room/${encodeURIComponent(slug)}`);
    const data = await res.json();
    if (!res.ok || !data.room || !data.room.id) {
      return {
        ok: false,
        message: data.Msg ?? data.message ?? "Room not found",
      };
    }
    return { ok: true, roomId: data.room.id };
  } catch {
    return { ok: false, message: "Network error" };
  }
}

/*
 * CHANGELOG (room helpers):
 * - Added createRoom(name, token) to call POST /room with Authorization header.
 * - Added getRoomBySlug(slug) to resolve a room id via GET /room/:slug.
 * - Both helpers return { ok, roomId } or { ok: false, message } for UI use.
 */

