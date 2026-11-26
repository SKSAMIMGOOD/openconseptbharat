/**
 * Design Studio — History Manager (Undo / Redo Engine)
 *
 * Implements pure, immutable, and engine-independent document history tracking.
 * 1. Stores complete, serialized/cloned immutable document states.
 * 2. Uses bounded ring-buffer behavior (default max 50 entries) to prevent memory bloating.
 * 3. Does not store Konva nodes, temporary pointer offsets, or selection UI state.
 * 4. Image asset references (IDs) are preserved; image memory buffers are held in AssetManager.
 * 5. Provides canUndo, canRedo, pushState, undo, and redo methods.
 */

import type { DesignDocument } from "../../types/design-studio.ts";

export interface HistoryManagerState {
  past: DesignDocument[];
  present: DesignDocument;
  future: DesignDocument[];
}

export class HistoryManager {
  private past: DesignDocument[] = [];
  private present: DesignDocument;
  private future: DesignDocument[] = [];
  private maxHistoryLimit: number;

  constructor(initialDocument: DesignDocument, maxHistoryLimit: number = 50) {
    this.present = JSON.parse(JSON.stringify(initialDocument));
    this.maxHistoryLimit = Math.max(5, maxHistoryLimit);
  }

  /**
   * Returns current present document.
   */
  public getCurrentDocument(): DesignDocument {
    return this.present;
  }

  /**
   * Pushes a new document state onto the history stack.
   * Clears the future redo stack and drops oldest past entries if exceeding max limit.
   */
  public pushState(newDoc: DesignDocument): void {
    // Check if new document is identical to present (avoid duplicate no-op snapshots)
    const serializedNew = JSON.stringify(newDoc);
    const serializedPresent = JSON.stringify(this.present);
    if (serializedNew === serializedPresent) {
      return;
    }

    this.past.push(this.present);
    if (this.past.length > this.maxHistoryLimit) {
      this.past.shift(); // Drop oldest state to free memory
    }

    this.present = JSON.parse(serializedNew);
    this.future = []; // Clear redo stack upon new action
  }

  /**
   * Whether an undo action is available.
   */
  public canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Whether a redo action is available.
   */
  public canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Undoes the last action, moving present to future and popping previous from past.
   * Returns the new present document, or null if cannot undo.
   */
  public undo(): DesignDocument | null {
    if (!this.canUndo()) {
      return null;
    }

    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previous;

    return this.present;
  }

  /**
   * Redoes the last undone action, moving present to past and popping next from future.
   * Returns the new present document, or null if cannot redo.
   */
  public redo(): DesignDocument | null {
    if (!this.canRedo()) {
      return null;
    }

    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;

    return this.present;
  }

  /**
   * Clears history and resets present to a new initial document.
   */
  public reset(initialDocument: DesignDocument): void {
    this.past = [];
    this.present = JSON.parse(JSON.stringify(initialDocument));
    this.future = [];
  }

  /**
   * Returns debug metrics on current stack depths.
   */
  public getMetrics(): { pastCount: number; futureCount: number; maxLimit: number } {
    return {
      pastCount: this.past.length,
      futureCount: this.future.length,
      maxLimit: this.maxHistoryLimit,
    };
  }
}
