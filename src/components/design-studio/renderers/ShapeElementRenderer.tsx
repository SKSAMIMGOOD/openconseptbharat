"use client";

import React, { useMemo } from "react";
import { Rect, Circle, Ellipse, Line, Star, RegularPolygon, Group } from "react-konva";
import type { ShapeDesignElement, ElementTransform } from "@/types/design-studio";
import { toKonvaShapeProps } from "@/lib/design-studio/konva-adapter";

export interface ShapeElementRendererProps {
  element: ShapeDesignElement;
  scaleFactor?: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onTransformEnd?: (id: string, transform: ElementTransform) => void;
}

/**
 * Modular Konva Shape Element Renderer.
 * Supports Rect, Circle, Ellipse, Line, Divider, Triangle, and Star primitives
 * with selection, drag repositioning, and shape transformation.
 */
export const ShapeElementRenderer: React.FC<ShapeElementRendererProps> = React.memo(
  ({
    element,
    scaleFactor = 1.0,
    isSelected = false,
    onSelect,
    onDragEnd,
    onTransformEnd,
  }) => {
    const konvaProps = useMemo(
      () => toKonvaShapeProps(element, scaleFactor, false),
      [element, scaleFactor]
    );

    if (!element.visible) {
      return null;
    }

    const { x, y, width, height, rotation, scaleX, scaleY, opacity, fill, stroke, strokeWidth, dash, cornerRadius } = konvaProps;

    const handleClick = (e: any) => {
      e.cancelBubble = true;
      onSelect?.(element.id);
    };

    const handleDragEnd = (e: any) => {
      e.cancelBubble = true;
      onDragEnd?.(element.id, Number(e.target.x().toFixed(2)), Number(e.target.y().toFixed(2)));
    };

    const handleTransformEnd = (e: any) => {
      e.cancelBubble = true;
      const node = e.target;
      const sX = node.scaleX();
      const sY = node.scaleY();

      const newWidth = Math.max(5, Math.round(node.width() * sX * 100) / 100);
      const newHeight = Math.max(5, Math.round(node.height() * sY * 100) / 100);

      node.scaleX(1);
      node.scaleY(1);
      node.width(newWidth);
      node.height(newHeight);

      onTransformEnd?.(element.id, {
        x: Number(node.x().toFixed(2)),
        y: Number(node.y().toFixed(2)),
        width: newWidth,
        height: newHeight,
        rotation: Math.round(((node.rotation() % 360) + 360) % 360),
        scaleX: 1,
        scaleY: 1,
      });
    };

    const isDraggable = !element.locked && isSelected;

    switch (element.shapeType) {
      case "circle": {
        const radius = Math.min(width, height) / 2;
        return (
          <Group
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Circle
              x={width / 2}
              y={height / 2}
              radius={radius}
              opacity={opacity}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={dash}
            />
          </Group>
        );
      }

      case "ellipse": {
        return (
          <Group
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Ellipse
              x={width / 2}
              y={height / 2}
              radiusX={width / 2}
              radiusY={height / 2}
              opacity={opacity}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={dash}
            />
          </Group>
        );
      }

      case "line":
      case "divider": {
        const centerY = height / 2;
        return (
          <Group
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Line
              x={0}
              y={0}
              points={[0, centerY, width, centerY]}
              opacity={opacity}
              stroke={stroke && stroke !== "transparent" ? stroke : fill}
              strokeWidth={strokeWidth > 0 ? strokeWidth : Math.max(1, 1 * scaleFactor)}
              dash={dash}
            />
          </Group>
        );
      }

      case "triangle": {
        const radius = Math.min(width, height) / 2;
        return (
          <Group
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <RegularPolygon
              x={width / 2}
              y={height / 2}
              sides={3}
              radius={radius}
              opacity={opacity}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={dash}
            />
          </Group>
        );
      }

      case "star": {
        const outerRadius = Math.min(width, height) / 2;
        const innerRadius = outerRadius * 0.45;
        return (
          <Group
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          >
            <Star
              x={width / 2}
              y={height / 2}
              numPoints={5}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              opacity={opacity}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              dash={dash}
            />
          </Group>
        );
      }

      case "rect":
      default:
        return (
          <Rect
            id={element.id}
            name={element.name}
            x={x}
            y={y}
            width={width}
            height={height}
            rotation={rotation}
            scaleX={scaleX}
            scaleY={scaleY}
            opacity={opacity}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            dash={dash}
            cornerRadius={cornerRadius}
            draggable={isDraggable}
            onClick={handleClick}
            onTap={handleClick}
            onDragEnd={handleDragEnd}
            onTransformEnd={handleTransformEnd}
          />
        );
    }
  }
);

ShapeElementRenderer.displayName = "ShapeElementRenderer";
