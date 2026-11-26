"use client";

import React, { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import type { CanvasStageProps } from "./CanvasStage";
import type { ElementTransform } from "@/types/design-studio";

/**
 * Loading fallback skeleton rendered while Konva chunks hydrate in the browser.
 */
const CanvasStageSkeleton: React.FC<{ widthPx?: number; heightPx?: number }> = ({
  widthPx = 400,
  heightPx = 250,
}) => {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-300 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 animate-pulse text-surface-400"
      style={{
        width: widthPx,
        height: heightPx,
        maxWidth: "100%",
      }}
      aria-busy="true"
      aria-label="Loading interactive canvas editor"
    >
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-medium">Initializing Design Studio Canvas...</span>
    </div>
  );
};

/**
 * Dynamically imported CanvasStage with server-side rendering disabled.
 * Protects Next.js SSR pipelines from accessing window/document/HTMLCanvasElement.
 */
const DynamicCanvasStage = dynamic<CanvasStageProps>(
  () => import("./CanvasStage").then((mod) => mod.CanvasStage),
  {
    ssr: false,
    loading: () => <CanvasStageSkeleton />,
  }
);

export interface CanvasViewportProps extends Omit<CanvasStageProps, "containerWidth" | "containerHeight"> {
  containerClassName?: string;
  /** Explicit container width override in CSS pixels */
  containerWidth?: number;
  /** Explicit container height override in CSS pixels */
  containerHeight?: number;
  /** Selection callback pass-through */
  onSelectElement?: (elementId: string | null) => void;
  /** Selected element ID pass-through */
  selectedElementId?: string | null;
  /** Transform updates pass-through */
  onUpdateElementTransform?: (elementId: string, transform: Partial<ElementTransform>) => void;
  /** Text content update pass-through */
  onUpdateElementText?: (elementId: string, newText: string) => void;
}

/**
 * Next.js SSR-Safe Canvas Viewport wrapper.
 * Automatically measures available container bounds to enable responsive fitting.
 */
export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  containerClassName,
  containerWidth: explicitWidth,
  containerHeight: explicitHeight,
  ...stageProps
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredBounds, setMeasuredBounds] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setMeasuredBounds({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateDimensions();
      });
      resizeObserver.observe(containerRef.current);
    } else {
      window.addEventListener("resize", updateDimensions);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", updateDimensions);
      }
    };
  }, []);

  const activeWidth = explicitWidth || measuredBounds.width;
  const activeHeight = explicitHeight || measuredBounds.height;

  return (
    <div
      ref={containerRef}
      className={`w-full h-full min-h-[300px] flex items-center justify-center p-4 overflow-auto ${
        containerClassName || ""
      }`}
    >
      <DynamicCanvasStage
        {...stageProps}
        containerWidth={activeWidth > 0 ? activeWidth : undefined}
        containerHeight={activeHeight > 0 ? activeHeight : undefined}
      />
    </div>
  );
};

export default CanvasViewport;
