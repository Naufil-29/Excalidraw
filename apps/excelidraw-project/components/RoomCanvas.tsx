"use client";

import { WS_BACKEND } from "@/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Canvas } from "./MainCanvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please sign in to use the canvas.");
      router.replace("/signin");
      return;
    }

    setError(null);
    const ws = new WebSocket(`${WS_BACKEND}?token=${encodeURIComponent(token)}`);

    ws.onopen = () => {
      setSocket(ws);
      ws.send(
        JSON.stringify({
          type: "join_room",
          roomId,
        })
      );
    };

    ws.onerror = () => {
      setError("Connection failed. Please try again.");
    };

    ws.onclose = () => {
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [roomId, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p>Connecting to server...</p>
      </div>
    );
  }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}

/*
 * CHANGELOG (WebSocket auth wiring):
 * - WebSocket URL now uses JWT from localStorage: ?token=<token> (no hardcoded token).
 * - If no token, user is redirected to /signin and error state is set.
 * - join_room is sent with roomId when socket opens so server associates this connection with the room.
 * - Cleanup: socket is closed on unmount; error/close handlers added.
 * - Enables multi-user rooms: shapes are stored in DB as chats and broadcast to all users in the same room.
 */
