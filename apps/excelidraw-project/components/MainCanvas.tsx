import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";
import { Circle, Pencil, RectangleHorizontalIcon, MousePointer2, Type } from "lucide-react";
import { Game } from "@/draw/Game";
import type { Shape } from "@/draw/types";
import { ShapeEditDialog } from "./ShapeEditDialog";

export type Tool = "circle" | "rect" | "pencil" | "select" | "text";
export type InteractionMode = "resize" | "relocate";

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("resize");

  useEffect(() => {
    gameRef.current?.setTool(selectedTool);
  }, [selectedTool]);

  useEffect(() => {
    gameRef.current?.setSelectedShapeId(selectedShape?.id ?? null);
    gameRef.current?.setDialogOpen(!!selectedShape);
  }, [selectedShape?.id, selectedShape]);

  useEffect(() => {
    gameRef.current?.setInteractionMode(interactionMode);
  }, [interactionMode]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const g = new Game(canvasRef.current, roomId, socket, (shape) => setSelectedShape(shape));
    gameRef.current = g;
    setGame(g);
    return () => {
      g.destroy();
      gameRef.current = null;
    };
  }, [roomId, socket]);

  const handleDelete = () => {
    if (selectedShape) gameRef.current?.deleteShape(selectedShape.id);
    setSelectedShape(null);
  };

  const handleUpdate = (s: Shape) => {
    const current = gameRef.current?.getShapeById(s.id);
    if (!current) return;
    const merged = { ...current, ...s } as Shape;
    gameRef.current?.updateShape(merged);
    setSelectedShape(merged);
  };

  return (
    <div style={{ height: "100vh", overflow: "hidden", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={typeof window !== "undefined" ? window.innerWidth : 800}
        height={typeof window !== "undefined" ? window.innerHeight : 600}
      />
      <Topbar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
      {selectedShape && (
        <ShapeEditDialog
          shape={selectedShape}
          interactionMode={interactionMode}
          onModeChange={setInteractionMode}
          onClose={() => setSelectedShape(null)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}

function Topbar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 40,
      }}
    >
      <div className="flex gap-1 bg-white/90 border border-gray-200 rounded-lg p-1 shadow-sm">
        <IconButton
          onClick={() => setSelectedTool("select")}
          activated={selectedTool === "select"}
          icon={<MousePointer2 size={18} />}
        />
        <IconButton
          onClick={() => setSelectedTool("pencil")}
          activated={selectedTool === "pencil"}
          icon={<Pencil size={18} />}
        />
        <IconButton
          onClick={() => setSelectedTool("rect")}
          activated={selectedTool === "rect"}
          icon={<RectangleHorizontalIcon size={18} />}
        />
        <IconButton
          onClick={() => setSelectedTool("circle")}
          activated={selectedTool === "circle"}
          icon={<Circle size={18} />}
        />
        <IconButton
          onClick={() => setSelectedTool("text")}
          activated={selectedTool === "text"}
          icon={<Type size={18} />}
        />
      </div>
    </div>
  );
}

/*
 * CHANGELOG (select, text, dialog):
 * - Tool type extended with "select" and "text".
 * - Select tool: click on shape opens ShapeEditDialog; gameRef used to call deleteShape/updateShape from dialog.
 * - Text tool: click on canvas opens prompt, then adds text shape via game.addTextShape.
 * - ShapeEditDialog shown when selectedShape is set; Resize (Smaller/Larger), Border color (5), Delete shape.
 * CHANGELOG (Smaller/Larger creating duplicate shape fix):
 * - handleUpdate: gets current shape from game by id (getShapeById), merges dialog update into it, then updateShape(merged) so we always update the shape in the canvas state, not a stale copy.
 * - When selectedShape is set, setDialogOpen(true) so Game does not create new shapes on mouseup while the dialog is open.
 * - interactionMode state ("resize" | "relocate") passed to Game and dialog; Resize = drag corner handles, Relocate = drag shape to move.
 */
