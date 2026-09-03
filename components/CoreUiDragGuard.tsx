/** CoreUiDragGuard component/module.
 * Owns the UI behavior implemented in this file; data and side effects remain within its existing boundaries.
 * refs: none
 */
"use client";

import { useEffect } from "react";

const ALLOWED_DRAG_TARGETS = [
  "[data-allow-native-drag='true']",
  "[draggable='true']",
  "input",
  "textarea",
  "[contenteditable='true']",
].join(",");

/** Prevent accidental native dragging of application chrome and UI artwork.  Returns: `React.JSX.Element`. · refs: none */
export default function CoreUiDragGuard() {
  useEffect(() => {
    const preventCoreUiDrag = (event: DragEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(ALLOWED_DRAG_TARGETS)) return;
      event.preventDefault();
    };

    document.addEventListener("dragstart", preventCoreUiDrag, true);
    return () => document.removeEventListener("dragstart", preventCoreUiDrag, true);
  }, []);

  return null;
}
