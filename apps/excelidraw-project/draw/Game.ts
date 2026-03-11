import { Tool, type InteractionMode } from "@/components/MainCanvas";
import { getExistingShapes } from "./http";
import type { Shape } from "./types";
import { generateShapeId, getShapeRef, setShapeRef } from "./types";

const HIT_THRESHOLD = 8;
const HANDLE_SIZE = 8;
const HANDLE_HIT = 12;
const DEFAULT_STROKE = "#000000";
const HANDLE_COLOR = "#1971c2";

type MoveDrag = { shapeId: string; offsetX: number; offsetY: number };
type ResizeHandleDrag = { shapeId: string; handleId: string };
type HandlePos = { id: string; x: number; y: number };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];
  private roomId: string;
  socket: WebSocket;
  private clicked = false;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private onShapeSelect?: (shape: Shape) => void;
  private selectedShapeId: string | null = null;
  private interactionMode: InteractionMode = "resize";
  private moveDrag: MoveDrag | null = null;
  private resizeHandleDrag: ResizeHandleDrag | null = null;
  private dialogOpen = false;

  constructor(
    canvas: HTMLCanvasElement,
    roomId: string,
    socket: WebSocket,
    onShapeSelect?: (shape: Shape) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
    this.socket = socket;
    this.onShapeSelect = onShapeSelect;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  setSelectedShapeId(id: string | null) {
    this.selectedShapeId = id;
    this.moveDrag = null;
    this.resizeHandleDrag = null;
  }

  setInteractionMode(mode: InteractionMode) {
    this.interactionMode = mode;
  }

  setDialogOpen(open: boolean) {
    this.dialogOpen = open;
  }

  getShapeById(id: string): Shape | null {
    return this.existingShapes.find((x) => x.id === id) ?? null;
  }

  async init() {
    const loaded = await getExistingShapes(this.roomId);
    this.existingShapes = (loaded || []).map((s: Partial<Shape>, i: number) =>
      this.normalizeShape(s, `loaded-${i}`)
    );
    this.clearCanvas();
  }

  private normalizeShape(s: Partial<Shape> & { id?: string }, fallbackId: string): Shape {
    const id = s.id || fallbackId;
    const strokeColor = s.strokeColor || DEFAULT_STROKE;
    if (s.type === "rect")
      return { id, type: "rect", x: s.x!, y: s.y!, width: s.width!, height: s.height!, strokeColor };
    if (s.type === "circle")
      return {
        id,
        type: "circle",
        centerX: s.centerX!,
        centerY: s.centerY!,
        radius: s.radius!,
        strokeColor,
      };
    if (s.type === "pencil")
      return {
        id,
        type: "pencil",
        startX: s.startX!,
        startY: s.startY!,
        endX: s.endX!,
        endY: s.endY!,
        strokeColor,
      };
    if (s.type === "text")
      return { id, type: "text", x: s.x!, y: s.y!, text: s.text ?? "", strokeColor, fontSize: s.fontSize ?? 16 };
    return { id, type: "rect", x: 0, y: 0, width: 0, height: 0, strokeColor } as Shape;
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsed = JSON.parse(message.message);
        const shape = this.normalizeShape(parsed.shape, generateShapeId());
        const alreadyHave = this.existingShapes.some((s) => s.id === shape.id);
        if (!alreadyHave) {
          this.existingShapes.push(shape);
          this.clearCanvas();
        }
      }
      if (message.type === "delete_shape") {
        this.existingShapes = this.existingShapes.filter((s) => s.id !== message.shapeId);
        this.clearCanvas();
      }
      if (message.type === "update_shape") {
        const idx = this.existingShapes.findIndex((s) => s.id === message.shape.id);
        if (idx >= 0)
          this.existingShapes[idx] = this.normalizeShape(message.shape, message.shape.id);
        this.clearCanvas();
      }
    };
  }

  private getStrokeColor(shape: Shape): string {
    return shape.strokeColor ?? DEFAULT_STROKE;
  }

  clearCanvas() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.fillStyle = "#ffffff";
    this.ctx.fillRect(0, 0, width, height);
    this.existingShapes.forEach((shape) => {
      this.ctx.strokeStyle = this.getStrokeColor(shape);
      this.ctx.fillStyle = this.getStrokeColor(shape);
      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
        this.ctx.stroke();
      } else if (shape.type === "pencil") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
      } else if (shape.type === "text") {
        const fontSize = shape.fontSize ?? 16;
        this.ctx.font = `${fontSize}px sans-serif`;
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
    });
    if (this.selectedShapeId && this.interactionMode === "resize") {
      const sel = this.existingShapes.find((s) => s.id === this.selectedShapeId);
      if (sel) {
        this.ctx.strokeStyle = HANDLE_COLOR;
        this.ctx.lineWidth = 2;
        if (sel.type === "rect") {
          this.ctx.strokeRect(sel.x, sel.y, sel.width, sel.height);
        } else if (sel.type === "circle") {
          this.ctx.beginPath();
          this.ctx.arc(sel.centerX, sel.centerY, Math.abs(sel.radius), 0, Math.PI * 2);
          this.ctx.stroke();
        } else if (sel.type === "pencil") {
          this.ctx.beginPath();
          this.ctx.moveTo(sel.startX, sel.startY);
          this.ctx.lineTo(sel.endX, sel.endY);
          this.ctx.stroke();
        } else if (sel.type === "text") {
          const fontSize = sel.fontSize ?? 16;
          const lineH = Math.ceil(fontSize * 1.2);
          this.ctx.font = `${fontSize}px sans-serif`;
          const w = this.ctx.measureText(sel.text).width;
          this.ctx.strokeRect(sel.x, sel.y - fontSize, w, lineH);
        }
        this.drawHandles(sel);
      }
    }
  }

  private getHandlePositions(shape: Shape): HandlePos[] {
    const h = HANDLE_SIZE / 2;
    if (shape.type === "rect") {
      const { x, y, width, height } = shape;
      return [
        { id: "nw", x: x, y: y },
        { id: "ne", x: x + width, y: y },
        { id: "se", x: x + width, y: y + height },
        { id: "sw", x: x, y: y + height },
      ];
    }
    if (shape.type === "circle") {
      const { centerX, centerY, radius } = shape;
      const r = Math.abs(radius);
      return [
        { id: "n", x: centerX, y: centerY - r },
        { id: "e", x: centerX + r, y: centerY },
        { id: "s", x: centerX, y: centerY + r },
        { id: "w", x: centerX - r, y: centerY },
      ];
    }
    if (shape.type === "pencil") {
      return [
        { id: "start", x: shape.startX, y: shape.startY },
        { id: "end", x: shape.endX, y: shape.endY },
      ];
    }
    if (shape.type === "text") {
      const fontSize = shape.fontSize ?? 16;
      const lineH = Math.ceil(fontSize * 1.2);
      this.ctx.save();
      this.ctx.font = `${fontSize}px sans-serif`;
      const w = this.ctx.measureText(shape.text).width;
      this.ctx.restore();
      const x = shape.x;
      const y = shape.y;
      return [
        { id: "nw", x, y: y - fontSize },
        { id: "ne", x: x + w, y: y - fontSize },
        { id: "se", x: x + w, y: y + lineH - fontSize },
        { id: "sw", x, y: y + lineH - fontSize },
      ];
    }
    return [];
  }

  private drawHandles(shape: Shape) {
    const positions = this.getHandlePositions(shape);
    this.ctx.fillStyle = HANDLE_COLOR;
    this.ctx.strokeStyle = HANDLE_COLOR;
    this.ctx.lineWidth = 2;
    const h = HANDLE_SIZE / 2;
    positions.forEach(({ x, y }) => {
      this.ctx.fillRect(x - h, y - h, HANDLE_SIZE, HANDLE_SIZE);
      this.ctx.strokeRect(x - h, y - h, HANDLE_SIZE, HANDLE_SIZE);
    });
  }

  private getHandleAt(canvasX: number, canvasY: number): { shapeId: string; handleId: string } | null {
    if (!this.selectedShapeId || this.interactionMode !== "resize") return null;
    const shape = this.existingShapes.find((s) => s.id === this.selectedShapeId);
    if (!shape) return null;
    const positions = this.getHandlePositions(shape);
    for (const { id, x, y } of positions) {
      if (Math.abs(canvasX - x) <= HANDLE_HIT && Math.abs(canvasY - y) <= HANDLE_HIT)
        return { shapeId: shape.id, handleId: id };
    }
    return null;
  }

  private applyHandleResize(shape: Shape, handleId: string, mouseX: number, mouseY: number): Shape {
    if (shape.type === "rect") {
      let { x, y, width, height } = shape;
      const strokeColor = shape.strokeColor ?? DEFAULT_STROKE;
      if (handleId === "nw") {
        width = (x + width) - mouseX;
        height = (y + height) - mouseY;
        x = mouseX;
        y = mouseY;
      } else if (handleId === "ne") {
        width = mouseX - x;
        height = (y + height) - mouseY;
        y = mouseY;
      } else if (handleId === "se") {
        width = mouseX - x;
        height = mouseY - y;
      } else if (handleId === "sw") {
        width = (x + width) - mouseX;
        height = mouseY - y;
        x = mouseX;
      }
      if (width < 0) {
        x += width;
        width = -width;
      }
      if (height < 0) {
        y += height;
        height = -height;
      }
      return { ...shape, x, y, width, height, strokeColor };
    }
    if (shape.type === "circle") {
      const dx = mouseX - shape.centerX;
      const dy = mouseY - shape.centerY;
      const radius = Math.max(4, Math.hypot(dx, dy));
      return { ...shape, radius };
    }
    if (shape.type === "pencil") {
      if (handleId === "start") return { ...shape, startX: mouseX, startY: mouseY };
      return { ...shape, endX: mouseX, endY: mouseY };
    }
    if (shape.type === "text") {
      const lineH = Math.ceil((shape.fontSize ?? 16) * 1.2);
      const baseY = shape.y - (shape.fontSize ?? 16);
      let newFontSize = 16;
      if (handleId === "se" || handleId === "ne") {
        newFontSize = Math.max(10, Math.min(72, (mouseY - baseY) * 0.85));
      } else if (handleId === "sw" || handleId === "nw") {
        newFontSize = Math.max(10, Math.min(72, (baseY + lineH - mouseY) * 0.85));
      }
      return { ...shape, fontSize: Math.round(newFontSize) };
    }
    return shape;
  }

  private distPointToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (len * len)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  private getCanvasPoint(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  getShapeAt(clientX: number, clientY: number): Shape | null {
    const { x, y } = this.getCanvasPoint(clientX, clientY);
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      const s = this.existingShapes[i];
      if (s.type === "rect") {
        const t = HIT_THRESHOLD;
        const onBorder =
          (x >= s.x - t && x <= s.x + s.width + t && y >= s.y - t && y <= s.y + s.height + t) &&
          (s.width <= 2 * t || s.height <= 2 * t ||
            x < s.x + t || x > s.x + s.width - t || y < s.y + t || y > s.y + s.height - t);
        if (onBorder) return s;
      } else if (s.type === "circle") {
        const d = Math.hypot(x - s.centerX, y - s.centerY);
        if (Math.abs(d - Math.abs(s.radius)) <= HIT_THRESHOLD) return s;
      } else if (s.type === "pencil") {
        if (this.distPointToSegment(x, y, s.startX, s.startY, s.endX, s.endY) <= HIT_THRESHOLD)
          return s;
      } else if (s.type === "text") {
        const fontSize = s.fontSize ?? 16;
        const lineH = Math.ceil(fontSize * 1.2);
        this.ctx.save();
        this.ctx.font = `${fontSize}px sans-serif`;
        const w = this.ctx.measureText(s.text).width;
        this.ctx.restore();
        if (x >= s.x && x <= s.x + w && y >= s.y - fontSize && y <= s.y + lineH - fontSize) return s;
      }
    }
    return null;
  }

  private sendChat(shape: Shape) {
    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      })
    );
  }

  deleteShape(shapeId: string) {
    this.existingShapes = this.existingShapes.filter((s) => s.id !== shapeId);
    this.clearCanvas();
    this.socket.send(
      JSON.stringify({ type: "delete_shape", roomId: this.roomId, shapeId })
    );
  }

  updateShape(updated: Shape) {
    const id = updated.id;
    if (!id) return;
    const idx = this.existingShapes.findIndex((s) => s.id === id);
    if (idx < 0) return;
    this.existingShapes[idx] = this.normalizeShape(updated, id);
    this.clearCanvas();
    this.socket.send(
      JSON.stringify({ type: "update_shape", roomId: this.roomId, shape: this.existingShapes[idx] })
    );
  }

  addTextShape(x: number, y: number, text: string) {
    const shape: Shape = {
      id: generateShapeId(),
      type: "text",
      x,
      y,
      text,
      strokeColor: DEFAULT_STROKE,
      fontSize: 16,
    };
    this.existingShapes.push(shape);
    this.clearCanvas();
    this.sendChat(shape);
  }

  mouseDownHandler = (e: MouseEvent) => {
    const { x, y } = this.getCanvasPoint(e.clientX, e.clientY);
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "select" && this.selectedShapeId) {
      const handleHit = this.getHandleAt(x, y);
      if (handleHit && this.interactionMode === "resize") {
        this.resizeHandleDrag = { shapeId: handleHit.shapeId, handleId: handleHit.handleId };
        this.clicked = true;
        return;
      }
      const hit = this.getShapeAt(e.clientX, e.clientY);
      if (hit && hit.id === this.selectedShapeId && this.interactionMode === "relocate") {
        const ref = getShapeRef(hit);
        this.moveDrag = {
          shapeId: hit.id,
          offsetX: x - ref.x,
          offsetY: y - ref.y,
        };
        this.clicked = true;
        return;
      }
    }

    this.clicked = true;
  };

  mouseUpHandler = (e: MouseEvent) => {
    const { x: endX, y: endY } = this.getCanvasPoint(e.clientX, e.clientY);

    if (this.resizeHandleDrag) {
      const idx = this.existingShapes.findIndex((s) => s.id === this.resizeHandleDrag!.shapeId);
      if (idx >= 0) {
        this.socket.send(
          JSON.stringify({
            type: "update_shape",
            roomId: this.roomId,
            shape: this.existingShapes[idx],
          })
        );
      }
      this.resizeHandleDrag = null;
      this.clicked = false;
      return;
    }

    if (this.moveDrag) {
      const idx = this.existingShapes.findIndex((s) => s.id === this.moveDrag!.shapeId);
      if (idx >= 0) {
        this.socket.send(
          JSON.stringify({
            type: "update_shape",
            roomId: this.roomId,
            shape: this.existingShapes[idx],
          })
        );
      }
      this.moveDrag = null;
      this.clicked = false;
      return;
    }

    if (this.selectedTool === "select") {
      const shape = this.getShapeAt(e.clientX, e.clientY);
      if (shape) this.onShapeSelect?.(shape);
      this.clicked = false;
      return;
    }

    if (this.selectedTool === "text") {
      const text = window.prompt("Enter text:");
      if (text != null && text.trim()) this.addTextShape(endX, endY + 16, text.trim());
      this.clicked = false;
      return;
    }

    this.clicked = false;

    if (this.dialogOpen) return;

    if (this.selectedTool === "pencil") {
      const shape: Shape = {
        id: generateShapeId(),
        type: "pencil",
        startX: this.startX,
        startY: this.startY,
        endX,
        endY,
        strokeColor: DEFAULT_STROKE,
      };
      this.existingShapes.push(shape);
      this.clearCanvas();
      this.sendChat(shape);
      return;
    }

    const width = endX - this.startX;
    const height = endY - this.startY;
    let shape: Shape | null = null;

    if (this.selectedTool === "rect") {
      shape = {
        id: generateShapeId(),
        type: "rect",
        x: this.startX,
        y: this.startY,
        width,
        height,
        strokeColor: DEFAULT_STROKE,
      };
    } else if (this.selectedTool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        id: generateShapeId(),
        type: "circle",
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
        radius,
        strokeColor: DEFAULT_STROKE,
      };
    }

    if (shape) {
      this.existingShapes.push(shape);
      this.clearCanvas();
      this.sendChat(shape);
    }
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked) return;

    const { x: curX, y: curY } = this.getCanvasPoint(e.clientX, e.clientY);

    if (this.resizeHandleDrag) {
      const idx = this.existingShapes.findIndex((s) => s.id === this.resizeHandleDrag!.shapeId);
      if (idx >= 0) {
        const shape = this.existingShapes[idx];
        const resized = this.applyHandleResize(shape, this.resizeHandleDrag.handleId, curX, curY);
        this.existingShapes[idx] = this.normalizeShape(resized, shape.id);
      }
      this.clearCanvas();
      return;
    }

    if (this.moveDrag) {
      const idx = this.existingShapes.findIndex((s) => s.id === this.moveDrag!.shapeId);
      if (idx >= 0) {
        const shape = this.existingShapes[idx];
        const newRefX = curX - this.moveDrag.offsetX;
        const newRefY = curY - this.moveDrag.offsetY;
        const moved = setShapeRef(shape, newRefX, newRefY);
        this.existingShapes[idx] = this.normalizeShape(moved, shape.id);
      }
      this.clearCanvas();
      return;
    }

    if (this.selectedTool === "select" || this.selectedTool === "text") return;

    this.clearCanvas();
    this.ctx.strokeStyle = DEFAULT_STROKE;

    if (this.selectedTool === "pencil") {
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(curX, curY);
      this.ctx.stroke();
    } else if (this.selectedTool === "rect") {
      this.ctx.strokeRect(this.startX, this.startY, curX - this.startX, curY - this.startY);
    } else if (this.selectedTool === "circle") {
      const w = curX - this.startX;
      const h = curY - this.startY;
      const r = Math.max(Math.abs(w), Math.abs(h)) / 2;
      this.ctx.beginPath();
      this.ctx.arc(this.startX + w / 2, this.startY + h / 2, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}

/*
 * CHANGELOG (pencil, select, text, dialog):
 * - Pencil: draws a single line from mousedown to mouseup; shape type "pencil" with start/end; rendered in clearCanvas.
 * - All shapes have id and optional strokeColor; ids generated for new shapes; loaded shapes normalized with fallback id.
 * - Select tool: click on shape border hits shape -> onShapeSelect(shape) for dialog; getShapeAt() with HIT_THRESHOLD for rect/circle/pencil/text.
 * - deleteShape(id) and updateShape(shape) update state, redraw, and broadcast delete_shape/update_shape over socket.
 * - Text tool: click opens prompt; addTextShape(x,y,text) creates "text" shape and sends via chat; rendered with fillText.
 * - WS handlers for delete_shape and update_shape update existingShapes and redraw.
 * CHANGELOG (move by drag + persist):
 * - When a shape is selected, mousedown on it starts move-drag: user holds left-click and drags; shape follows the cursor; on mouseup we send update_shape so the new position is broadcast and persisted.
 * - moveDrag stores shapeId and offset from shape ref to mouse; mousemove uses setShapeRef to place shape at (curMouse - offset).
 * CHANGELOG (shadow/duplicate when dragging fix):
 * - On "chat" we now only push the shape if we don't already have one with that id. Our own create sends "chat" and the server echoes it back; we were pushing again and drawing the shape twice, so dragging left a duplicate at the old position.
 * - setSelectedShapeId(id) lets MainCanvas sync selection; resize drag only runs for select tool when selected shape is hit.
 * - updateShape(updated) now guards on updated.id and findIndex; only replaces in place (no new shape).
 * CHANGELOG (Smaller/Larger button creating duplicate shape fix):
 * - setDialogOpen(open): when the edit dialog is open, mouseUpHandler skips rect/circle/pencil creation so no new shape is created by stray canvas events.
 * - getShapeById(id): returns the shape from existingShapes so the dialog always updates the shape that is in the game state.
 * CHANGELOG (resize by corners + Resize/Relocate in dialog):
 * - interactionMode "resize" | "relocate": when resize, selected shape shows blue outline and corner handles; drag a handle to stretch. When relocate, drag shape body to move.
 * - getHandlePositions, drawHandles, getHandleAt, applyHandleResize: rect 4 corners, circle 4 points, pencil 2 ends; resize-by-handle sends update_shape on mouseup.
 */
