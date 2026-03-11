"use client";

import type { Shape } from "@/draw/types";
import { STROKE_COLORS } from "@/draw/types";
import type { InteractionMode } from "./MainCanvas";

export function ShapeEditDialog({
  shape,
  interactionMode,
  onModeChange,
  onClose,
  onDelete,
  onUpdate,
}: {
  shape: Shape;
  interactionMode: InteractionMode;
  onModeChange: (mode: InteractionMode) => void;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (s: Shape) => void;
}) {
  const isText = shape.type === "text";

  return (
    <div
      className="fixed right-4 top-1/2 -translate-y-1/2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50"
      role="dialog"
      aria-label="Edit shape"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3">
        <span className="font-medium text-gray-800">Edit shape</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-gray-700 text-xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        {isText && (
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Text</p>
            <input
              type="text"
              value={shape.text}
              onChange={(e) => onUpdate({ ...shape, text: e.target.value })}
              className="w-full px-2 py-1.5 rounded border border-gray-300 text-sm"
            />
          </div>
        )}
        <div>
          <p className="text-xs text-gray-500 mb-1.5">Resize or relocate</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onModeChange("resize");
              }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                interactionMode === "resize"
                  ? "bg-blue-100 border-blue-500 text-blue-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Resize
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onModeChange("relocate");
              }}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium ${
                interactionMode === "relocate"
                  ? "bg-blue-100 border-blue-500 text-blue-800"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              Relocate
            </button>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-1.5">Border color</p>
          <div className="flex gap-1.5 flex-wrap">
            {STROKE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdate({ ...shape, strokeColor: color });
                }}
                className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-500"
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          className="w-full py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
        >
          Delete shape
        </button>
      </div>
    </div>
  );
}

/*
 * CHANGELOG (shape edit dialog):
 * - Dialog shown when a shape is selected (select tool + click on shape).
 * - Resize: "Smaller" / "Larger" scale shape by RESIZE_FACTOR; rect/circle/pencil scaled from center.
 * - Border color: 5 solid options from STROKE_COLORS; on click updates shape and calls onUpdate.
 * - Delete shape: calls onDelete then onClose.
 * - stopPropagation/preventDefault on dialog and all buttons so canvas does not receive clicks (fixes button creating new shape).
 * - Smaller/Larger replaced by Resize and Relocate; they set interactionMode so user resizes by dragging corner handles or relocates by dragging the shape (chosen from dialog).
 */
