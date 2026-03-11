/** Shared shape types for canvas. All shapes have id and optional strokeColor. */

export const STROKE_COLORS = ["#000000", "#e03131", "#1971c2", "#2f9e44", "#9c36b5"] as const;
export type StrokeColor = (typeof STROKE_COLORS)[number];

export type Shape =
  | {
      id: string;
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      strokeColor?: string;
    }
  | {
      id: string;
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
      strokeColor?: string;
    }
  | {
      id: string;
      type: "pencil";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      strokeColor?: string;
    }
  | {
      id: string;
      type: "text";
      x: number;
      y: number;
      text: string;
      strokeColor?: string;
      fontSize?: number;
    };

export function generateShapeId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ensureShapeId(shape: Shape, fallbackId: string): Shape {
  if ("id" in shape && shape.id) return shape;
  return { ...shape, id: fallbackId } as Shape;
}

/** Scale a shape from its center by factor. Used for resize-by-drag and Smaller/Larger buttons. */
export function scaleShape(shape: Shape, factor: number): Shape {
  if (shape.type === "rect") {
    const cx = shape.x + shape.width / 2;
    const cy = shape.y + shape.height / 2;
    const newW = shape.width * factor;
    const newH = shape.height * factor;
    return {
      ...shape,
      x: cx - newW / 2,
      y: cy - newH / 2,
      width: newW,
      height: newH,
    };
  }
  if (shape.type === "circle") {
    return { ...shape, radius: shape.radius * factor };
  }
  if (shape.type === "pencil") {
    const cx = (shape.startX + shape.endX) / 2;
    const cy = (shape.startY + shape.endY) / 2;
    return {
      ...shape,
      startX: cx + (shape.startX - cx) * factor,
      startY: cy + (shape.startY - cy) * factor,
      endX: cx + (shape.endX - cx) * factor,
      endY: cy + (shape.endY - cy) * factor,
    };
  }
  if (shape.type === "text") return { ...shape };
  return shape;
}

/** Center of shape for drag-to-resize distance. */
export function getShapeCenter(shape: Shape): { x: number; y: number } {
  if (shape.type === "rect")
    return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  if (shape.type === "circle") return { x: shape.centerX, y: shape.centerY };
  if (shape.type === "pencil")
    return {
      x: (shape.startX + shape.endX) / 2,
      y: (shape.startY + shape.endY) / 2,
    };
  if (shape.type === "text") return { x: shape.x, y: shape.y };
  return { x: 0, y: 0 };
}

/** Reference point used for move-by-drag (same as center for rect/circle/pencil; text uses top-left). */
export function getShapeRef(shape: Shape): { x: number; y: number } {
  return getShapeCenter(shape);
}

/** Move shape so its reference point is at (refX, refY). Used for relocate-by-drag. */
export function setShapeRef(shape: Shape, refX: number, refY: number): Shape {
  const ref = getShapeRef(shape);
  const dx = refX - ref.x;
  const dy = refY - ref.y;
  if (shape.type === "rect")
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  if (shape.type === "circle")
    return { ...shape, centerX: shape.centerX + dx, centerY: shape.centerY + dy };
  if (shape.type === "pencil")
    return {
      ...shape,
      startX: shape.startX + dx,
      startY: shape.startY + dy,
      endX: shape.endX + dx,
      endY: shape.endY + dy,
    };
  if (shape.type === "text")
    return { ...shape, x: shape.x + dx, y: shape.y + dy };
  return shape;
}

/*
 * CHANGELOG (shape types for select/edit/text):
 * - All shapes have id (string) and optional strokeColor.
 * - STROKE_COLORS: 5 solid options (black, red, blue, green, purple) for border color in edit dialog.
 * - Added "text" shape: x, y, text; rendered as fillText on canvas.
 * - scaleShape(shape, factor): scale from center for rect/circle/pencil; used by dialog buttons and drag-to-resize.
 * - getShapeCenter(shape): for drag-to-resize distance calculation.
 * - getShapeRef / setShapeRef(shape, refX, refY): for move-by-drag; translate shape so its ref point is at new position.
 */
