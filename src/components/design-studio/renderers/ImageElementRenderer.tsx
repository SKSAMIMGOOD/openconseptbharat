"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Image as KonvaImage, Rect, Text, Group } from "react-konva";
import type { ImageDesignElement, DesignAsset, ElementTransform } from "@/types/design-studio";
import { calculateImageFitDimensions } from "@/lib/design-studio/coordinate-converter";

export interface ImageElementRendererProps {
  element: ImageDesignElement;
  asset?: DesignAsset;
  scaleFactor?: number;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDragEnd?: (id: string, x: number, y: number) => void;
  onTransformEnd?: (id: string, transform: ElementTransform) => void;
}

// In-memory cache for decoded HTMLImageElement instances to avoid reloading across page toggles
const HTML_IMAGE_CACHE = new Map<string, HTMLImageElement>();

/**
 * Placeholder frame rendered when an asset is missing, loading, or corrupt.
 */
const PlaceholderFrame: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  borderRadius?: number;
  roleHint?: string;
  isError?: boolean;
  onClick?: () => void;
}> = ({
  x,
  y,
  width,
  height,
  rotation,
  scaleX,
  scaleY,
  opacity,
  borderRadius = 4,
  roleHint = "Image",
  isError = false,
  onClick,
}) => {
  const label = isError ? "Asset Unavailable" : `[ ${roleHint} ]`;
  const fontSize = Math.max(9, Math.min(14, Math.round(width * 0.08)));

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      opacity={opacity}
      onClick={onClick}
      onTap={onClick}
    >
      {/* Dashed placeholder container */}
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isError ? "#fef2f2" : "#f8fafc"}
        stroke={isError ? "#f87171" : "#94a3b8"}
        strokeWidth={1}
        dash={[4, 4]}
        cornerRadius={borderRadius}
      />
      {/* Center label */}
      <Text
        x={4}
        y={(height - fontSize * 1.3) / 2}
        width={Math.max(10, width - 8)}
        text={label}
        fontSize={fontSize}
        fontFamily="sans-serif"
        fill={isError ? "#dc2626" : "#64748b"}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

/**
 * Modular Konva Image Element Renderer.
 * Resolves assets via Document Asset Registry with aspect-ratio fitting and graceful fallbacks.
 */
export const ImageElementRenderer: React.FC<ImageElementRendererProps> = React.memo(
  ({
    element,
    asset,
    scaleFactor = 1.0,
    isSelected = false,
    onSelect,
    onDragEnd,
    onTransformEnd,
  }) => {
    const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
    const [loadFailed, setLoadFailed] = useState<boolean>(false);

    const assetUrl = asset?.url;

    // Load and cache the image element
    useEffect(() => {
      if (!assetUrl) {
        setImageObj(null);
        setLoadFailed(false);
        return;
      }

      const cached = HTML_IMAGE_CACHE.get(assetUrl);
      if (cached && cached.complete && cached.naturalWidth > 0) {
        setImageObj(cached);
        setLoadFailed(false);
        return;
      }

      let isMounted = true;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = assetUrl;

      img.onload = () => {
        if (!isMounted) return;
        HTML_IMAGE_CACHE.set(assetUrl, img);
        setImageObj(img);
        setLoadFailed(false);
      };

      img.onerror = () => {
        if (!isMounted) return;
        setImageObj(null);
        setLoadFailed(true);
      };

      return () => {
        isMounted = false;
        img.onload = null;
        img.onerror = null;
      };
    }, [assetUrl]);

    if (!element.visible) {
      return null;
    }

    const x = element.transform.x * scaleFactor;
    const y = element.transform.y * scaleFactor;
    const width = element.transform.width * scaleFactor;
    const height = element.transform.height * scaleFactor;
    const rotation = element.transform.rotation;
    const scaleX = element.transform.scaleX;
    const scaleY = element.transform.scaleY;
    const opacity = element.opacity;
    const borderRadius = (element.borderRadius || 0) * scaleFactor;

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

      const newWidth = Math.max(10, Math.round(node.width() * sX * 100) / 100);
      const newHeight = Math.max(10, Math.round(node.height() * sY * 100) / 100);

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

    // If no asset is associated or loading failed
    if (!asset || loadFailed || !imageObj) {
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
          <PlaceholderFrame
            x={0}
            y={0}
            width={width}
            height={height}
            rotation={0}
            scaleX={1}
            scaleY={1}
            opacity={opacity}
            borderRadius={borderRadius}
            roleHint={element.placeholderRole || element.name || "Image"}
            isError={loadFailed || (!asset && Boolean(element.assetId))}
          />
        </Group>
      );
    }

    // Calculate aspect-ratio fitting ("contain", "cover", "fill")
    const fit = element.fit || "contain";
    const naturalW = imageObj.naturalWidth || width;
    const naturalH = imageObj.naturalHeight || height;
    const fitted = calculateImageFitDimensions(width, height, naturalW, naturalH, fit);

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
        opacity={opacity}
        draggable={isDraggable}
        clipFunc={
          borderRadius > 0
            ? (ctx) => {
                ctx.beginPath();
                ctx.roundRect(0, 0, width, height, borderRadius);
                ctx.closePath();
              }
            : undefined
        }
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        <KonvaImage
          image={imageObj}
          x={fitted.x}
          y={fitted.y}
          width={fitted.width}
          height={fitted.height}
          crop={element.cropRect}
        />
      </Group>
    );
  }
);

ImageElementRenderer.displayName = "ImageElementRenderer";
