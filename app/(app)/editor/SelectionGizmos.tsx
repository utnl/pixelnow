"use client";

import { useEditorStore } from "@/store/editor.store";
import { useEffect, useState, useRef } from "react";

export default function SelectionGizmos() {
  const { 
    activeSelection, tool, 
    triggerFlipH, triggerFlipV, triggerRotate, triggerDeleteSelection,
    canvasWidth, canvasHeight, zoom
  } = useEditorStore();

  const [pos, setPos] = useState({ left: '0px', top: '0px' });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeSelection || tool !== 'selection') return;

    // Calculate position relative to Canvas Center
    // (x, y) is top-left of selection. canvasWidth/canvasHeight is the full canvas size.
    
    const cx = activeSelection.x + activeSelection.width / 2;
    const cy = activeSelection.y + activeSelection.height;
    
    const offsetX = (cx - canvasWidth / 2) * zoom;
    const offsetY = (cy - canvasHeight / 2) * zoom;

    setPos({ 
        left: `calc(50% + ${offsetX}px)`, 
        top: `calc(50% + ${offsetY + 20}px)` // +20px padding below selection
    });
    
  }, [activeSelection, tool, zoom, canvasWidth, canvasHeight]);

  if (!activeSelection || tool !== 'selection') return null;

  return (
    <div 
      className="absolute pointer-events-none z-50 flex flex-col gap-2 transition-all duration-75"
      style={{
        left: pos.left,
        top: pos.top,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-1.5 flex items-center gap-3 shadow-2xl pointer-events-auto backdrop-blur-xl bg-opacity-90 ring-1 ring-white/10">
        <GizmoButton icon={<RotateIcon />} onClick={triggerRotate} title="Rotate 90°" />
        <div className="w-px h-6 bg-gray-700" />
        <GizmoButton icon={<FlipHIcon />} onClick={triggerFlipH} title="Flip Horizontal" />
        <GizmoButton icon={<FlipVIcon />} onClick={triggerFlipV} title="Flip Vertical" />
        <div className="w-px h-6 bg-gray-700" />
        <GizmoButton icon={<TrashIcon />} onClick={triggerDeleteSelection} title="Delete Selection (Del)" />
      </div>
    </div>
  );
}

function GizmoButton({ icon, onClick, title }: { icon: React.ReactNode, onClick: () => void, title: string }) {
  return (
    <button 
      className="text-gray-400 hover:text-white transition-colors p-1"
      onClick={onClick}
      title={title}
    >
      {icon}
    </button>
  );
}

function RotateIcon() {
    return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
}

function FlipHIcon() {
    return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v20c0 .6 0 1 0 1m8-21v20c0 .6 0 1 0 1M3 12h18"/><path d="M12 3v18"/><path d="m2 16 5-4-5-4M22 16l-5-4 5-4"/></svg>;
}

function FlipVIcon() {
    return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h20m-20 8h20M12 3v18"/><path d="M12 12H3"/><path d="m16 2-4 5-4-5M16 22l-4-5-4-5"/></svg>;
}

function TrashIcon() {
    return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>;
}
