"use client";

import React, { useMemo } from "react";
import { Text } from "react-konva";
import type { TextDesignElement, ElementTransform } from "@/types/design-studio";
import { toKonvaTextProps } from "@/lib/design-studio/konva-adapter";

export interface TextElementRendererProps {
  element: TextDesignElement;
  scaleFactor?: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onTransformEnd?: (id: string, transform: ElementTransform) => void;
  onTextChange?: (id: string, newText: string) => void;
}

/**
 * Transforms text content according to TextTransform property.
 */
function applyTextTransform(text: string, transform?: string): string {
  if (!text) return "";
  switch (transform) {
    case "uppercase":
      return text.toUpperCase();
    case "lowercase":
      return text.toLowerCase();
    case "capitalize":
      return text.replace(/\b\w/g, (char) => char.toUpperCase());
    case "none":
    default:
      return text;
  }
}

/**
 * Modular Konva Text Element Renderer.
 * Supports direct click selection, drag repositioning, and scale-distortion prevention.
 */
export const TextElementRenderer: React.FC<TextElementRendererProps> = React.memo(
  ({
    element,
    scaleFactor = 1.0,
    isSelected = false,
    onSelect,
    onDragEnd,
    onTransformEnd,
    onTextChange,
  }) => {
    const konvaProps = useMemo(
      () => toKonvaTextProps(element, scaleFactor, false),
      [element, scaleFactor]
    );

    const transformedText = useMemo(
      () => applyTextTransform(element.text, element.textTransform),
      [element.text, element.textTransform]
    );

    if (!element.visible) {
      return null;
    }

    const handleClick = (e: any) => {
      e.cancelBubble = true;
      onSelect?.(element.id);
    };

    const handleDblClick = (e: any) => {
      e.cancelBubble = true;
      if (element.locked) return;

      const textNode = e.target;
      const stage = textNode.getStage();
      if (!stage) return;

      const container = stage.container();
      if (!container) return;

      // Calculate absolute screen position of text node
      const textPosition = textNode.absolutePosition();
      const area = document.createElement("textarea");
      container.appendChild(area);

      area.value = element.text;
      area.style.position = "absolute";
      area.style.top = `${textPosition.y}px`;
      area.style.left = `${textPosition.x}px`;
      area.style.width = `${Math.max(80, textNode.width() * stage.scaleX())}px`;
      area.style.height = `${Math.max(30, textNode.height() * stage.scaleY())}px`;
      area.style.fontSize = `${textNode.fontSize() * stage.scaleY()}px`;
      area.style.border = "2px solid #2563eb";
      area.style.padding = "2px 4px";
      area.style.margin = "0px";
      area.style.overflow = "hidden";
      area.style.background = "white";
      area.style.outline = "none";
      area.style.resize = "none";
      area.style.lineHeight = `${textNode.lineHeight() || 1.3}`;
      area.style.fontFamily = textNode.fontFamily();
      area.style.fontWeight = `${textNode.fontStyle()?.includes("bold") ? "bold" : "normal"}`;
      area.style.fontStyle = `${textNode.fontStyle()?.includes("italic") ? "italic" : "normal"}`;
      area.style.textAlign = textNode.align();
      area.style.color = textNode.fill();
      area.style.zIndex = "1000";
      area.style.borderRadius = "2px";
      area.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)";

      textNode.hide();
      const tr = stage.findOne("Transformer");
      if (tr) tr.hide();
      stage.batchDraw();

      area.focus();
      area.select();

      let cleanedUp = false;
      function removeTextarea() {
        if (cleanedUp) return;
        cleanedUp = true;
        if (area.parentNode) {
          area.parentNode.removeChild(area);
        }
        window.removeEventListener("click", handleOutsideClick);
        textNode.show();
        if (tr) tr.show();
        stage.batchDraw();
        onTextChange?.(element.id, area.value);
      }

      function handleOutsideClick(event: MouseEvent) {
        if (event.target !== area) {
          removeTextarea();
        }
      }

      area.addEventListener("keydown", (event: KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
          removeTextarea();
        }
        if (event.key === "Escape") {
          area.value = element.text; // discard edit
          removeTextarea();
        }
      });

      area.addEventListener("blur", () => {
        removeTextarea();
      });

      // Defer outside click listener so current click event doesn't trigger it
      setTimeout(() => {
        window.addEventListener("click", handleOutsideClick);
      });
    };

    return (
      <Text
        id={element.id}
        name={element.name}
        x={konvaProps.x}
        y={konvaProps.y}
        width={konvaProps.width}
        height={konvaProps.height}
        rotation={konvaProps.rotation}
        scaleX={konvaProps.scaleX}
        scaleY={konvaProps.scaleY}
        opacity={konvaProps.opacity}
        text={transformedText}
        fontFamily={konvaProps.fontFamily}
        fontSize={konvaProps.fontSize}
        fontStyle={konvaProps.fontStyle}
        fill={konvaProps.fill}
        align={konvaProps.align}
        verticalAlign={konvaProps.verticalAlign}
        lineHeight={konvaProps.lineHeight}
        letterSpacing={konvaProps.letterSpacing}
        textDecoration={element.textDecoration !== "none" ? element.textDecoration : undefined}
        draggable={!element.locked && isSelected}
        listening={true}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          onDragEnd?.(element.id, Number(e.target.x().toFixed(2)), Number(e.target.y().toFixed(2)));
        }}
        onTransformEnd={(e) => {
          e.cancelBubble = true;
          const node = e.target;
          const sX = node.scaleX();
          const sY = node.scaleY();

          // Reset node scales to 1 and reflow text by width
          const newWidth = Math.max(20, Math.round(node.width() * sX * 100) / 100);
          const newHeight = Math.max(10, Math.round(node.height() * sY * 100) / 100);
          node.scaleX(1);
          node.scaleY(1);
          node.width(newWidth);

          onTransformEnd?.(element.id, {
            x: Number(node.x().toFixed(2)),
            y: Number(node.y().toFixed(2)),
            width: newWidth,
            height: newHeight,
            rotation: Math.round(((node.rotation() % 360) + 360) % 360),
            scaleX: 1,
            scaleY: 1,
          });
        }}
      />
    );
  }
);

TextElementRenderer.displayName = "TextElementRenderer";
