/**
 * Design Studio — Konva Scene Graph Adapter
 *
 * Implements a strict abstraction boundary between the engine-independent
 * DesignDocument schema and the Konva.js rendering engine.
 *
 * INVARIANT:
 * Neither DesignDocument, DesignElement, nor any domain state types import Konva.
 * Only this adapter translates schema definitions to/from Konva prop bags.
 */

import type {
  TextDesignElement,
  ShapeDesignElement,
  ImageDesignElement,
  ElementTransform,
  DesignElement,
} from "../../types/design-studio.ts";

export interface KonvaCommonProps {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  draggable: boolean;
  listening: boolean;
}

export interface KonvaTextProps extends KonvaCommonProps {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  fill: string;
  align: string;
  verticalAlign: string;
  lineHeight: number;
  letterSpacing: number;
}

export interface KonvaShapeProps extends KonvaCommonProps {
  shapeType: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash?: number[];
  cornerRadius?: number;
}

export interface KonvaImageProps extends KonvaCommonProps {
  assetId: string;
  cornerRadius?: number;
}

/**
 * Translates a schema TextDesignElement into Konva Text props.
 */
export function toKonvaTextProps(
  element: TextDesignElement,
  scale: number = 1.0,
  isInteractive: boolean = true
): KonvaTextProps {
  const fontStyle = [
    element.fontStyle === "italic" ? "italic" : "",
    element.fontWeight === "bold" || Number(element.fontWeight) >= 700 ? "bold" : "",
  ]
    .filter(Boolean)
    .join(" ") || "normal";

  return {
    id: element.id,
    name: element.name,
    x: element.transform.x * scale,
    y: element.transform.y * scale,
    width: element.transform.width * scale,
    height: element.transform.height * scale,
    rotation: element.transform.rotation,
    scaleX: element.transform.scaleX,
    scaleY: element.transform.scaleY,
    opacity: element.opacity,
    draggable: isInteractive && !element.locked,
    listening: isInteractive && element.visible,
    text: element.text,
    fontFamily: element.fontFamily,
    fontSize: element.fontSize * scale,
    fontStyle,
    fill: element.fill,
    align: element.align,
    verticalAlign: element.verticalAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing * scale,
  };
}

/**
 * Translates a schema ShapeDesignElement into Konva Shape props.
 */
export function toKonvaShapeProps(
  element: ShapeDesignElement,
  scale: number = 1.0,
  isInteractive: boolean = true
): KonvaShapeProps {
  return {
    id: element.id,
    name: element.name,
    shapeType: element.shapeType,
    x: element.transform.x * scale,
    y: element.transform.y * scale,
    width: element.transform.width * scale,
    height: element.transform.height * scale,
    rotation: element.transform.rotation,
    scaleX: element.transform.scaleX,
    scaleY: element.transform.scaleY,
    opacity: element.opacity,
    draggable: isInteractive && !element.locked,
    listening: isInteractive && element.visible,
    fill: element.fill,
    stroke: element.stroke,
    strokeWidth: element.strokeWidth * scale,
    dash: element.strokeDashArray
      ? element.strokeDashArray.map((d) => d * scale)
      : undefined,
    cornerRadius: element.cornerRadius ? element.cornerRadius * scale : undefined,
  };
}

/**
 * Translates a schema ImageDesignElement into Konva Image props.
 */
export function toKonvaImageProps(
  element: ImageDesignElement,
  scale: number = 1.0,
  isInteractive: boolean = true
): KonvaImageProps {
  return {
    id: element.id,
    name: element.name,
    assetId: element.assetId,
    x: element.transform.x * scale,
    y: element.transform.y * scale,
    width: element.transform.width * scale,
    height: element.transform.height * scale,
    rotation: element.transform.rotation,
    scaleX: element.transform.scaleX,
    scaleY: element.transform.scaleY,
    opacity: element.opacity,
    draggable: isInteractive && !element.locked,
    listening: isInteractive && element.visible,
    cornerRadius: element.borderRadius ? element.borderRadius * scale : undefined,
  };
}

/**
 * Extracts updated spatial transformation from a transformed Konva node
 * back into the engine-independent ElementTransform contract in points.
 */
export function extractTransformFromKonvaState(
  rawX: number,
  rawY: number,
  rawWidth: number,
  rawHeight: number,
  rawRotation: number,
  rawScaleX: number,
  rawScaleY: number,
  scale: number = 1.0
): ElementTransform {
  return {
    x: Number((rawX / scale).toFixed(2)),
    y: Number((rawY / scale).toFixed(2)),
    width: Number((rawWidth / scale).toFixed(2)),
    height: Number((rawHeight / scale).toFixed(2)),
    rotation: Math.round(((rawRotation % 360) + 360) % 360),
    scaleX: Number(rawScaleX.toFixed(4)),
    scaleY: Number(rawScaleY.toFixed(4)),
  };
}
