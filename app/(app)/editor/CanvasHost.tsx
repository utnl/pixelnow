"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editor.store";
import { PixelEngine } from "@/engine/PixelEngine";

export default function CanvasHost() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PixelEngine | null>(null);
  const { 
    canvasWidth, canvasHeight, tool, primaryColor, setPrimaryColor, brushSize, 
    undoTrigger, redoTrigger, deleteSelectionTrigger,
    flipHTrigger, flipVTrigger, rotateTrigger,
    importTrigger, exportTrigger,
    setSelectionArea
  } = useEditorStore();

  const pencilCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z'/%3E%3C/svg%3E") 0 24, auto`;

  useEffect(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    const engine = new PixelEngine();
    engineRef.current = engine;
    
    engine.onColorPicked = (color: number) => {
        setPrimaryColor(color);
    };

    engine.onSelectionChanged = (area) => {
        setSelectionArea(area);
    };

    engine.onCanvasSizeChanged = (w, h) => {
        useEditorStore.setState({ canvasWidth: w, canvasHeight: h });
    };

    engine.init(containerRef.current, width, height);

    engine.setTool(tool);
    engine.setColor(primaryColor);
    engine.setBrushSize(brushSize);

    return () => {
       engine.destroy();
       if (engineRef.current === engine) {
          engineRef.current = null;
       }
    };
  }, []);

  // Sync canvas size
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.resizeProject(canvasWidth, canvasHeight);
    }
  }, [canvasWidth, canvasHeight]);

  // Sync tool
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setTool(tool);
    }
  }, [tool]);

  // Sync color
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setColor(primaryColor);
    }
  }, [primaryColor]);

  // Sync brush size
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.setBrushSize(brushSize);
    }
  }, [brushSize]);

  // React to triggers
  useEffect(() => {
    if (engineRef.current && undoTrigger > 0) engineRef.current.undo();
  }, [undoTrigger]);

  useEffect(() => {
    if (engineRef.current && redoTrigger > 0) engineRef.current.redo();
  }, [redoTrigger]);

  useEffect(() => {
    if (engineRef.current && deleteSelectionTrigger > 0) {
        engineRef.current.selectionManager.deleteSelection();
    }
  }, [deleteSelectionTrigger]);

  useEffect(() => {
    if (engineRef.current && flipHTrigger > 0) {
        engineRef.current.selectionManager.flipHorizontal();
    }
  }, [flipHTrigger]);

  useEffect(() => {
    if (engineRef.current && flipVTrigger > 0) {
        engineRef.current.selectionManager.flipVertical();
    }
  }, [flipVTrigger]);

  useEffect(() => {
    if (engineRef.current && rotateTrigger > 0) {
        engineRef.current.selectionManager.rotate90();
    }
  }, [rotateTrigger]);

  // Import trigger
  useEffect(() => {
    if (engineRef.current && importTrigger > 0) {
        engineRef.current.fileManager.importImage();
    }
  }, [importTrigger]);

  // Export trigger
  useEffect(() => {
    if (engineRef.current && exportTrigger > 0) {
        engineRef.current.fileManager.exportPNG();
    }
  }, [exportTrigger]);

  return (
    <div 
      ref={containerRef} 
      className={`flex-1 flex items-center justify-center bg-[#121212] overflow-hidden`}
      style={{ 
        cursor: tool === 'pencil' ? pencilCursor : tool === 'eraser' ? 'cell' : 'crosshair' 
      }}
    />
  );
}
