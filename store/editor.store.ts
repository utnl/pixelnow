import { create } from 'zustand';

interface EditorState {
  tool: 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle' | 'selection';
  primaryColor: number; // Hex color (e.g., 0xff0000)
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  brushSize: number;
  undoTrigger: number;
  redoTrigger: number;
  deleteSelectionTrigger: number;
  flipHTrigger: number;
  flipVTrigger: number;
  rotateTrigger: number;
  importTrigger: number;
  exportTrigger: number;
  activeSelection: { x: number, y: number, width: number, height: number } | null;
  
  setTool: (tool: EditorState['tool']) => void;
  setPrimaryColor: (color: number) => void;
  setZoom: (zoom: number) => void;
  setBrushSize: (size: number) => void;
  setSelectionArea: (area: EditorState['activeSelection']) => void;
  triggerUndo: () => void;
  triggerRedo: () => void;
  triggerDeleteSelection: () => void;
  triggerFlipH: () => void;
  triggerFlipV: () => void;
  triggerRotate: () => void;
  triggerImport: () => void;
  triggerExport: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  tool: 'pencil',
  primaryColor: 0xFFFFFFFF,
  canvasWidth: 32,
  canvasHeight: 32,
  zoom: 1,
  brushSize: 1,
  undoTrigger: 0,
  redoTrigger: 0,
  deleteSelectionTrigger: 0,
  flipHTrigger: 0,
  flipVTrigger: 0,
  rotateTrigger: 0,
  importTrigger: 0,
  exportTrigger: 0,
  activeSelection: null,

  setTool: (tool) => set({ tool }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setZoom: (zoom) => set({ zoom }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setSelectionArea: (activeSelection) => set({ activeSelection }),
  triggerUndo: () => set((state) => ({ undoTrigger: state.undoTrigger + 1 })),
  triggerRedo: () => set((state) => ({ redoTrigger: state.redoTrigger + 1 })),
  triggerDeleteSelection: () => set((state) => ({ deleteSelectionTrigger: state.deleteSelectionTrigger + 1 })),
  triggerFlipH: () => set((state) => ({ flipHTrigger: state.flipHTrigger + 1 })),
  triggerFlipV: () => set((state) => ({ flipVTrigger: state.flipVTrigger + 1 })),
  triggerRotate: () => set((state) => ({ rotateTrigger: state.rotateTrigger + 1 })),
  triggerImport: () => set((state) => ({ importTrigger: state.importTrigger + 1 })),
  triggerExport: () => set((state) => ({ exportTrigger: state.exportTrigger + 1 })),
}));

