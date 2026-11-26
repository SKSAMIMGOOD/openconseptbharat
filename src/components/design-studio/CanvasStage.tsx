"use client";

import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";
import type Konva from "konva";
import type {
  DesignPage,
  PhysicalDimensions,
  DesignOrientation,
  DesignAsset,
  TextDesignElement,
  ShapeDesignElement,
  ImageDesignElement,
  ElementTransform,
} from "@/types/design-studio";
import {
  getPageDimensionsPt,
  calculateResponsiveFitScale,
  calculateBleedAndSafeZone,
} from "@/lib/design-studio/coordinate-converter";
import { TextElementRenderer } from "./renderers/TextElementRenderer";
import { ShapeElementRenderer } from "./renderers/ShapeElementRenderer";
import { ImageElementRenderer } from "./renderers/ImageElementRenderer";
import { PageBackgroundRenderer } from "./renderers/PageBackgroundRenderer";

export interface CanvasStageProps {
  /** The current active design page to render */
  page: DesignPage;
  /** Physical real-world specifications */
  dimensions: PhysicalDimensions;
  /** Document orientation (portrait | landscape) */
  orientation: DesignOrientation;
  /** In-memory document assets dictionary */
  assets?: Record<string, DesignAsset>;
  /** Zoom multiplier (e.g. 1.0 = 100%, 1.25 = 125%) */
  zoom?: number;
  /** Available workspace container width in CSS pixels (for responsive auto-fitting) */
  containerWidth?: number;
  /** Available workspace container height in CSS pixels (for responsive auto-fitting) */
  containerHeight?: number;
  /** Whether to show print bleed and interior safe zone guide overlays */
  showBleedAndGuides?: boolean;
  /** Element selection callback */
  onSelectElement?: (elementId: string | null) => void;
  /** ID of the currently selected element */
  selectedElementId?: string | null;
  /** Transform change callback (position, size, rotation) committed on interaction finish */
  onUpdateElementTransform?: (elementId: string, transform: Partial<ElementTransform>) => void;
  /** Text content change callback for inline editing */
  onUpdateElementText?: (elementId: string, newText: string) => void;
  /** Optional wrapper class name */
  className?: string;
}

/**
 * Reusable React-Konva Canvas Stage for Design Studio.
 *
 * Converts the engine-independent DesignDocument schema into a hardware-accelerated
 * 2D canvas scene graph with responsive workspace scaling, layer ordering, and
 * interactive object manipulation (selection, drag, resize, rotation).
 */
export const CanvasStage: React.FC<CanvasStageProps> = ({
  page,
  dimensions,
  orientation,
  assets = {},
  zoom = 1.0,
  containerWidth,
  containerHeight,
  showBleedAndGuides = true,
  onSelectElement,
  selectedElementId,
  onUpdateElementTransform,
  onUpdateElementText,
  className,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // 1. Page dimensions in logical PostScript points (72 pt / inch)
  const { widthPt, heightPt } = useMemo(
    () => getPageDimensionsPt(dimensions, orientation),
    [dimensions, orientation]
  );

  // 2. Responsive scale calculation
  const scaleFactor = useMemo(() => {
    let baseScale = 1.0;
    if (containerWidth && containerHeight && containerWidth > 0 && containerHeight > 0) {
      baseScale = calculateResponsiveFitScale(widthPt, heightPt, containerWidth, containerHeight, 32);
    } else {
      // Default: 96 screen DPI / 72 PostScript points = ~1.3333 px per pt
      baseScale = 96 / 72;
    }
    const safeZoom = Math.max(0.1, Math.min(5.0, zoom));
    return baseScale * safeZoom;
  }, [widthPt, heightPt, containerWidth, containerHeight, zoom]);

  // 3. Screen display dimensions in CSS pixels
  const screenWidthPx = Math.round(widthPt * scaleFactor);
  const screenHeightPx = Math.round(heightPt * scaleFactor);

  // 4. Bleed and safe margins
  const guides = useMemo(
    () => calculateBleedAndSafeZone(dimensions, orientation),
    [dimensions, orientation]
  );

  // 5. Sorted elements by zIndex to preserve layer ordering
  const sortedElements = useMemo(() => {
    if (!page?.elements) return [];
    return [...page.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  }, [page?.elements]);

  // Currently selected element object
  const selectedElement = useMemo(() => {
    if (!selectedElementId || !page?.elements) return null;
    return page.elements.find((el) => el.id === selectedElementId) || null;
  }, [selectedElementId, page?.elements]);

  // 6. Synchronize Konva Transformer node attachment
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;

    if (!selectedElementId || !selectedElement || selectedElement.locked || !selectedElement.visible) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }

    const selectedNode = stageRef.current.findOne("#" + selectedElementId);
    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedElementId, selectedElement, page?.elements]);

  // Handle drag reposition completion (emits updated x, y)
  const handleDragEnd = useCallback(
    (elementId: string, x: number, y: number) => {
      onUpdateElementTransform?.(elementId, { x, y });
    },
    [onUpdateElementTransform]
  );

  // Handle transform completion (emits updated x, y, width, height, rotation)
  const handleTransformEnd = useCallback(
    (elementId: string, transform: ElementTransform) => {
      onUpdateElementTransform?.(elementId, transform);
    },
    [onUpdateElementTransform]
  );

  // Determine enabled Transformer anchor handles based on element type
  const enabledAnchors = useMemo(() => {
    if (!selectedElement) return [];
    if (selectedElement.type === "text") {
      // Text reflows by horizontal width or corner resize
      return ["middle-left", "middle-right", "top-left", "top-right", "bottom-left", "bottom-right"];
    }
    if (selectedElement.type === "shape") {
      if (selectedElement.shapeType === "line" || selectedElement.shapeType === "divider") {
        return ["middle-left", "middle-right"];
      }
    }
    // Full 8-point handles for images and 2D shapes
    return [
      "top-left",
      "top-center",
      "top-right",
      "middle-right",
      "bottom-right",
      "bottom-center",
      "bottom-left",
      "middle-left",
    ];
  }, [selectedElement]);

  const keepRatio = useMemo(() => {
    if (!selectedElement) return false;
    // Images and circular shapes maintain aspect ratio by default
    if (selectedElement.type === "image") return true;
    if (selectedElement.type === "shape") {
      return (
        selectedElement.shapeType === "circle" ||
        selectedElement.shapeType === "star" ||
        selectedElement.shapeType === "triangle"
      );
    }
    return false;
  }, [selectedElement]);

  return (
    <div
      className={`relative inline-block select-none shadow-2xl border border-surface-200 dark:border-surface-800 rounded-sm bg-white transition-all ${
        className || ""
      }`}
      style={{
        width: screenWidthPx,
        height: screenHeightPx,
      }}
      data-testid="canvas-stage-wrapper"
    >
      <Stage
        ref={stageRef}
        width={screenWidthPx}
        height={screenHeightPx}
        scaleX={scaleFactor}
        scaleY={scaleFactor}
        onMouseDown={(e) => {
          // Deselect when clicking directly on the canvas background or stage
          if (e.target === e.target.getStage() || e.target.name() === "page-background-surface") {
            onSelectElement?.(null);
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.target.getStage() || e.target.name() === "page-background-surface") {
            onSelectElement?.(null);
          }
        }}
      >
        {/* Layer 1: Page Background */}
        <Layer id="background-layer">
          <PageBackgroundRenderer
            background={page.background}
            widthPt={widthPt}
            heightPt={heightPt}
            assets={assets}
            scaleFactor={1.0}
          />
        </Layer>

        {/* Layer 2: Editable Objects in Layer Order */}
        <Layer id="elements-layer">
          {sortedElements.map((el) => {
            if (!el.visible) return null;

            const isSelected = selectedElementId === el.id;

            switch (el.type) {
              case "text":
                return (
                  <TextElementRenderer
                    key={el.id}
                    element={el as TextDesignElement}
                    scaleFactor={1.0}
                    isSelected={isSelected}
                    onSelect={onSelectElement}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    onTextChange={onUpdateElementText}
                  />
                );

              case "shape":
                return (
                  <ShapeElementRenderer
                    key={el.id}
                    element={el as ShapeDesignElement}
                    scaleFactor={1.0}
                    isSelected={isSelected}
                    onSelect={onSelectElement}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                );

              case "image":
                return (
                  <ImageElementRenderer
                    key={el.id}
                    element={el as ImageDesignElement}
                    asset={assets[(el as ImageDesignElement).assetId]}
                    scaleFactor={1.0}
                    isSelected={isSelected}
                    onSelect={onSelectElement}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                  />
                );

              default:
                return null;
            }
          })}

          {/* Interactive Selection Transformer */}
          <Transformer
            ref={transformerRef}
            enabledAnchors={enabledAnchors}
            keepRatio={keepRatio}
            rotateEnabled={!selectedElement?.locked}
            rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
            flipEnabled={false}
            borderStroke="#2563eb"
            borderStrokeWidth={1.5}
            borderDash={[4, 4]}
            anchorFill="#ffffff"
            anchorStroke="#2563eb"
            anchorStrokeWidth={1.5}
            anchorSize={8}
            anchorCornerRadius={2}
            boundBoxFunc={(oldBox, newBox) => {
              // Enforce minimum dimension boundary
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        </Layer>

        {/* Layer 3: Print Guides (Bleed and Safe Zone Overlays) */}
        {showBleedAndGuides && (
          <Layer id="guides-layer" listening={false}>
            {/* Safe zone boundary (dashed emerald line) */}
            <Rect
              x={guides.safeRectPt.x}
              y={guides.safeRectPt.y}
              width={guides.safeRectPt.width}
              height={guides.safeRectPt.height}
              stroke="rgba(16, 185, 129, 0.5)"
              strokeWidth={1}
              dash={[4, 4]}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
};

export default CanvasStage;
