import { PixelEngine } from './PixelEngine';

export class HistorySystem {
  private undoStack: Uint32Array[][] = [];
  private redoStack: Uint32Array[][] = [];
  private maxHistory = 50;

  constructor(private engine: PixelEngine) {}

  public saveState() {
    const currentState = this.engine.layerManager.getFullState();
    
    // Check if state actually changed to avoid duplicates
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack[this.undoStack.length - 1];
      if (this.isEqual(currentState, lastState)) return;
    }

    this.undoStack.push(currentState);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    
    // Clear redo stack on new action
    this.redoStack = [];
  }

  public undo() {
    if (this.undoStack.length <= 1) return; // Need at least current + previous

    const currentState = this.undoStack.pop()!;
    this.redoStack.push(currentState);

    const prevState = this.undoStack[this.undoStack.length - 1];
    this.engine.layerManager.restoreFullState(prevState);
  }

  public redo() {
    if (this.redoStack.length === 0) return;

    const nextState = this.redoStack.pop()!;
    this.undoStack.push(nextState);

    this.engine.layerManager.restoreFullState(nextState);
  }

  private isEqual(s1: Uint32Array[], s2: Uint32Array[]): boolean {
    if (s1.length !== s2.length) return false;
    for (let i = 0; i < s1.length; i++) {
        if (s1[i].length !== s2[i].length) return false;
        // Optimization: checking a few points or using a checksum might be faster
        // for now just full check
        for (let j = 0; j < s1[i].length; j++) {
            if (s1[i][j] !== s2[i][j]) return false;
        }
    }
    return true;
  }
}
