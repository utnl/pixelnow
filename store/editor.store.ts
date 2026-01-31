import { create } from 'zustand';

export interface LayerState {
  id: string;
  name: string;
  visible: boolean;
  active: boolean;
  parentId?: string | null;
  depth?: number;
}

interface EditorState {
  tool: 'pencil' | 'eraser' | 'fill' | 'eyedropper' | 'rectangle' | 'selection' | 'hand' | 'pivot' | 'transform';
  primaryColor: number;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
  brushSize: number;

  // Triggers for Engine Actions
  undoTrigger: number;
  redoTrigger: number;
  deleteSelectionTrigger: number;
  flipHTrigger: number;
  flipVTrigger: number;
  rotateTrigger: number;
  importTrigger: number;
  exportTrigger: number;
  exportJSONTrigger: number;

  // Layer Triggers
  addLayerTrigger: number;
  duplicateLayerTrigger: number;
  deleteLayerTrigger: number;
  toggleLayerVisibilityTrigger: { id: string, ts: number } | null;
  toggleAllLayerVisibilityTrigger: number;
  // Layer Trigger Props
  reparentLayerTrigger: { childId: string, parentId: string, ts: number } | null;
  renameLayerTrigger: { id: string, name: string, ts: number } | null;

  setActiveLayerTrigger: { id: string, ts: number } | null;

  activeSelection: { x: number, y: number, width: number, height: number } | null;

  // UI State (Synced from Engine)
  layers: LayerState[];

  // Animation State
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;

  // Animation Triggers
  addFrameTrigger: number;
  deleteFrameTrigger: number;
  togglePlayTrigger: number;
  goToFrameTrigger: { index: number, ts: number } | null;
  setEasingTrigger: { easing: string, ts: number } | null;

  triggerSetEasing: (easingType: string) => void;

  setTool: (tool: EditorState['tool']) => void;
  setPrimaryColor: (color: number) => void;
  setZoom: (zoom: number) => void;
  setBrushSize: (size: number) => void;
  setSelectionArea: (area: EditorState['activeSelection']) => void;
  setLayers: (layers: LayerState[]) => void;
  setFrameInfo: (current: number, total: number, isPlaying: boolean) => void;

  triggerUndo: () => void;
  triggerRedo: () => void;
  triggerDeleteSelection: () => void;
  triggerFlipH: () => void;
  triggerFlipV: () => void;
  triggerRotate: () => void;
  triggerImport: () => void;
  triggerExport: () => void;
  triggerExportJSON: () => void;

  triggerAddLayer: () => void;
  triggerDuplicateLayer: () => void;
  triggerDeleteLayer: () => void;
  triggerToggleLayerVisibility: (id: string) => void;
  triggerToggleAllLayerVisibility: () => void;
  triggerSetActiveLayer: (id: string) => void;
  triggerReparentLayer: (childId: string, parentId: string) => void;
  triggerRenameLayer: (id: string, name: string) => void;

  triggerAddFrame: () => void;
  triggerDeleteFrame: () => void;
  triggerTogglePlay: () => void;
  triggerGoToFrame: (index: number) => void;
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
  exportJSONTrigger: 0,
  addLayerTrigger: 0,
  duplicateLayerTrigger: 0,
  deleteLayerTrigger: 0,
  toggleLayerVisibilityTrigger: null,
  toggleAllLayerVisibilityTrigger: 0,
  setActiveLayerTrigger: null,
  reparentLayerTrigger: null,
  renameLayerTrigger: null,
  activeSelection: null,
  layers: [],

  // Animation Defaults
  currentFrame: 0,
  totalFrames: 1,
  isPlaying: false,
  addFrameTrigger: 0,
  deleteFrameTrigger: 0,
  togglePlayTrigger: 0,
  goToFrameTrigger: null,
  setEasingTrigger: null,

  setTool: (tool) => set({ tool }),
  setPrimaryColor: (primaryColor) => set({ primaryColor }),
  setZoom: (zoom) => set({ zoom }),
  setBrushSize: (brushSize) => set({ brushSize }),
  setSelectionArea: (activeSelection) => set({ activeSelection }),
  setLayers: (layers) => set({ layers }),
  setFrameInfo: (currentFrame, totalFrames, isPlaying) => set({ currentFrame, totalFrames, isPlaying }),

  triggerUndo: () => set((state) => ({ undoTrigger: state.undoTrigger + 1 })),
  triggerRedo: () => set((state) => ({ redoTrigger: state.redoTrigger + 1 })),
  triggerDeleteSelection: () => set((state) => ({ deleteSelectionTrigger: state.deleteSelectionTrigger + 1 })),
  triggerFlipH: () => set((state) => ({ flipHTrigger: state.flipHTrigger + 1 })),
  triggerFlipV: () => set((state) => ({ flipVTrigger: state.flipVTrigger + 1 })),
  triggerRotate: () => set((state) => ({ rotateTrigger: state.rotateTrigger + 1 })),
  triggerImport: () => set((state) => ({ importTrigger: state.importTrigger + 1 })),
  triggerExport: () => set((state) => ({ exportTrigger: state.exportTrigger + 1 })),
  triggerExportJSON: () => set((state) => ({ exportJSONTrigger: state.exportJSONTrigger + 1 })),
  triggerSetEasing: (easingType: string) => set({ setEasingTrigger: { easing: easingType, ts: Date.now() } }),

  triggerAddLayer: () => set((state) => ({ addLayerTrigger: state.addLayerTrigger + 1 })),
  triggerDuplicateLayer: () => set((state) => ({ duplicateLayerTrigger: state.duplicateLayerTrigger + 1 })),
  triggerDeleteLayer: () => set((state) => ({ deleteLayerTrigger: state.deleteLayerTrigger + 1 })),
  triggerRenameLayer: (id, name) => set({ renameLayerTrigger: { id, name, ts: Date.now() } }),
  triggerToggleLayerVisibility: (id) => set({ toggleLayerVisibilityTrigger: { id, ts: Date.now() } }),
  triggerToggleAllLayerVisibility: () => set((state) => ({ toggleAllLayerVisibilityTrigger: state.toggleAllLayerVisibilityTrigger + 1 })),
  triggerSetActiveLayer: (id) => set({ setActiveLayerTrigger: { id, ts: Date.now() } }),
  triggerReparentLayer: (childId, parentId) => set({ reparentLayerTrigger: { childId, parentId, ts: Date.now() } }),

  triggerAddFrame: () => set((state) => ({ addFrameTrigger: state.addFrameTrigger + 1 })),
  triggerDeleteFrame: () => set((state) => ({ deleteFrameTrigger: state.deleteFrameTrigger + 1 })),
  triggerTogglePlay: () => set((state) => ({ togglePlayTrigger: state.togglePlayTrigger + 1 })),
  triggerGoToFrame: (index) => set({ goToFrameTrigger: { index, ts: Date.now() } }),
}));
