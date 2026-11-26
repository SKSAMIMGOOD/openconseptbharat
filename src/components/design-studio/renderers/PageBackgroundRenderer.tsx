"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Rect, Image as KonvaImage, Group } from "react-konva";
import type { PageBackgroundConfig, DesignAsset } from "@/types/design-studio";
import { calculateImageFitDimensions } from "@/lib/design-studio/coordinate-converter";

export interface PageBackgroundRendererProps {
  background: PageBackgroundConfig;
  widthPt: number;
  heightPt: number;
  assets?: Record<string, DesignAsset>;
  scaleFactor?: number;
}

/**
 * Calculates start and end coordinates for a linear gradient based on angle in degrees.
 */
function getLinearGradientPoints(
  angleDeg: number,
  width: number,
  height: number
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  // Normalize angle (0 to 360)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const halfW = width / 2;
  const halfH = height / 2;

  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    start: {
      x: halfW - cos * halfW,
      y: halfH - sin * halfH,
    },
    end: {
      x: halfW + cos * halfW,
      y: halfH + sin * halfH,
    },
  };
}

/**
 * Formats color stops into the flat array expected by Konva: [offset1, color1, offset2, color2, ...]
 */
function formatColorStops(
  colorStops?: Array<{ offset: number; color: string }>
): (number | string)[] {
  if (!colorStops || colorStops.length === 0) {
    return [0, "#ffffff", 1, "#f3f4f6"];
  }
  const result: (number | string)[] = [];
  for (const stop of colorStops) {
    result.push(stop.offset, stop.color);
  }
  return result;
}

/**
 * Modular Page Background Renderer for Design Studio Canvas.
 * Supports solid fills, directional linear gradients, background images, and transparent backdrops.
 */
export const PageBackgroundRenderer: React.FC<PageBackgroundRendererProps> = React.memo(
  ({ background, widthPt, heightPt, assets = {}, scaleFactor = 1.0 }) => {
    const [bgImageObj, setBgImageObj] = useState<HTMLImageElement | null>(null);

    const bgAsset = background.assetId ? assets[background.assetId] : undefined;
    const bgUrl = bgAsset?.url;

    useEffect(() => {
      if (!bgUrl) {
        setBgImageObj(null);
        return;
      }

      let isMounted = true;
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = bgUrl;
      img.onload = () => {
        if (isMounted) setBgImageObj(img);
      };
      img.onerror = () => {
        if (isMounted) setBgImageObj(null);
      };

      return () => {
        isMounted = false;
        img.onload = null;
        img.onerror = null;
      };
    }, [bgUrl]);

    // Gradient calculation
    const gradientPoints = useMemo(() => {
      if (background.type !== "gradient" || !background.gradient) {
        return null;
      }
      return getLinearGradientPoints(
        background.gradient.angleDegrees || 180,
        widthPt,
        heightPt
      );
    }, [background.type, background.gradient, widthPt, heightPt]);

    const colorStops = useMemo(
      () => formatColorStops(background.gradient?.colorStops),
      [background.gradient?.colorStops]
    );

    // 1. Transparent
    if (background.type === "transparent") {
      return (
        <Rect
          id="page-background-transparent"
          name="page-background-surface"
          x={0}
          y={0}
          width={widthPt}
          height={heightPt}
          fill="transparent"
        />
      );
    }

    // 2. Gradient
    if (background.type === "gradient" && gradientPoints) {
      return (
        <Rect
          id="page-background-gradient"
          name="page-background-surface"
          x={0}
          y={0}
          width={widthPt}
          height={heightPt}
          fillLinearGradientStartPoint={gradientPoints.start}
          fillLinearGradientEndPoint={gradientPoints.end}
          fillLinearGradientColorStops={colorStops}
        />
      );
    }

    // 3. Image Background
    if (background.type === "image" && bgImageObj) {
      const fitted = calculateImageFitDimensions(
        widthPt,
        heightPt,
        bgImageObj.naturalWidth || widthPt,
        bgImageObj.naturalHeight || heightPt,
        "cover"
      );

      return (
        <Group id="page-background-image-group" name="page-background-surface">
          {/* Fallback solid beneath transparent image areas */}
          <Rect
            x={0}
            y={0}
            width={widthPt}
            height={heightPt}
            fill={background.color || "#ffffff"}
          />
          <KonvaImage
            image={bgImageObj}
            x={fitted.x}
            y={fitted.y}
            width={fitted.width}
            height={fitted.height}
            opacity={background.opacity ?? 1.0}
          />
        </Group>
      );
    }

    // 4. Default Solid
    return (
      <Rect
        id="page-background-solid"
        name="page-background-surface"
        x={0}
        y={0}
        width={widthPt}
        height={heightPt}
        fill={background.color || "#ffffff"}
      />
    );
  }
);

PageBackgroundRenderer.displayName = "PageBackgroundRenderer";
