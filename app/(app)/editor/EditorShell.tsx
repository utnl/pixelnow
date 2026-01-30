"use client";

import { useState, useRef, useEffect } from "react";
import CanvasHost from "./CanvasHost";
import SelectionGizmos from "./SelectionGizmos";
import { useEditorStore } from "@/store/editor.store";
import { ColorUtils } from "@/engine/ColorUtils";

export default function EditorShell() {
  const { 
    tool, setTool, primaryColor, setPrimaryColor, canvasWidth, canvasHeight, brushSize, setBrushSize, 
    triggerUndo, triggerRedo, triggerDeleteSelection, triggerFlipH, triggerFlipV, triggerRotate, triggerImport, triggerExport,
    
    // Layer store
    layers, triggerAddLayer, triggerDuplicateLayer, triggerDeleteLayer, triggerSetActiveLayer, triggerToggleLayerVisibility, triggerToggleAllLayerVisibility,
    
    // Animation store
    currentFrame, totalFrames, isPlaying, triggerAddFrame, triggerDeleteFrame, triggerTogglePlay, triggerGoToFrame
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete') triggerDeleteSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDeleteSelection]);
  
  return (
    <div className="flex flex-col h-screen bg-[#404040] text-gray-200 font-sans text-xs select-none">
      {/* 1. Main Menu Bar */}
      <div className="flex items-center px-1 h-6 bg-[#383838] border-b border-black">
        <MenuBarItem label="File" />
        <MenuBarItem label="Edit" />
        <MenuBarItem label="Sprite" />
        <MenuBarItem label="Layer" />
        <MenuBarItem label="Frame" />
        <MenuBarItem label="Select" />
        <MenuBarItem label="View" />
        <MenuBarItem label="Help" />
      </div>

      {/* 2. Top Toolbar */}
      <div className="flex items-center h-8 bg-[#505050] border-b border-black px-2 gap-2">
        <div className="flex items-center gap-1 border-r border-[#303030] pr-2">
           <IconButton icon="📄" title="New Project" />
           <IconButton icon="📂" title="Import Image" onClick={triggerImport} />
           <IconButton icon="💾" title="Export PNG" onClick={triggerExport} />
        </div>
        <div className="flex items-center gap-1 border-r border-[#303030] pr-2">
           <IconButton icon="↩️" title="Undo (Ctrl+Z)" onClick={triggerUndo} />
           <IconButton icon="↪️" title="Redo (Ctrl+Y)" onClick={triggerRedo} />
        </div>
        <div className="flex items-center gap-1 border-r border-[#303030] pr-2 text-[10px]">
          <span className="text-gray-400">W:</span>
          <input 
            type="number" 
            className="w-10 bg-[#303030] border border-black px-1 text-center outline-none" 
            value={canvasWidth} 
            onChange={(e) => useEditorStore.setState({ canvasWidth: Number(e.target.value) })}
          />
          <span className="text-gray-400">H:</span>
          <input 
            type="number" 
            className="w-10 bg-[#303030] border border-black px-1 text-center outline-none" 
            value={canvasHeight} 
            onChange={(e) => useEditorStore.setState({ canvasHeight: Number(e.target.value) })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span>Brush:</span>
          <input 
            type="number" 
            className="w-8 bg-[#303030] border border-black px-1 outline-none text-center" 
            value={brushSize} 
            min={1} 
            max={64}
            onChange={(e) => setBrushSize(Number(e.target.value))}
          />
          <span>px</span>
        </div>
      </div>

      {/* 3. Middle Section: Palette | Canvas | Tools */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Color Palette */}
        <div className="w-48 flex flex-col bg-[#505050] border-r border-black overflow-hidden relative">
          <div className="p-2 border-b border-black bg-[#454545]">
             <HSVColorPicker color={primaryColor} onChange={setPrimaryColor} />
          </div>
          <div className="flex-1 p-1 overflow-y-auto">
             <div className="grid grid-cols-6 gap-0.5">
               {Array.from({ length: 120 }).map((_, i) => {
                 let h = 0, s = 0, l = 0;
                 if (i < 96) {
                    h = (i % 24) * (360 / 24); s = 80;
                    if (i < 24) l = 50; else if (i < 48) l = 75; else if (i < 72) l = 35; else l = 15;
                 } else { h = 0; s = 0; l = ((i - 96) / 24) * 100; }
                 const c = (1 - Math.abs(2 * (l/100) - 1)) * (s/100);
                 const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                 const m = (l/100) - c / 2;
                 let r = 0, g = 0, b = 0;
                 if (0 <= h && h < 60) { r = c; g = x; b = 0; } else if (60 <= h && h < 120) { r = x; g = c; b = 0; } else if (120 <= h && h < 180) { r = 0; g = c; b = x; } else if (180 <= h && h < 240) { r = 0; g = x; b = c; } else if (240 <= h && h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
                 const colorInt = ColorUtils.rgbaToUint32(Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255));
                 return (
                 <div key={i} className={`w-full aspect-square border cursor-pointer hover:z-10 hover:scale-125 transition-all ${primaryColor === colorInt ? 'border-white scale-110 z-20 shadow-md ring-1 ring-black' : 'border-black'}`} style={{ backgroundColor: ColorUtils.uint32ToCss(colorInt) }} onClick={() => setPrimaryColor(colorInt)}/>
               )})}
             </div>
          </div>
          <div className="h-16 border-t border-black p-2 flex items-center gap-3 bg-[#454545]">
             <div className="w-10 h-10 border border-white shadow-lg" style={{ backgroundColor: ColorUtils.uint32ToCss(primaryColor) }} />
             <div className="flex flex-col">
                <div className="text-[11px] font-bold text-white font-mono">{ColorUtils.uint32ToHex(primaryColor)}</div>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[#2b2b2b] relative overflow-hidden">
            <CanvasHost />
            <SelectionGizmos />
        </div>

        {/* RIGHT: Tools Strip */}
        <div className="w-10 flex flex-col items-center py-1 bg-[#505050] border-l border-black overflow-y-auto gap-0.5">
          <ToolButton active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<PencilIcon />} title="Pencil (B)" />
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<EraserIcon />} title="Eraser (E)" />
          <ToolButton active={tool === 'fill'} onClick={() => setTool('fill')} icon={<FillIcon />} title="Fill Bucket (G)" />
          <div className="h-px w-6 bg-gray-600 my-1" />
          <ToolButton active={tool === 'selection'} onClick={() => setTool('selection')} icon={<MarqueeIcon />} title="Marquee Selection (M)" />
          <ToolButton active={tool === 'rectangle'} onClick={() => setTool('rectangle')} icon={<RectIcon />} title="Rectangle (R)" />
          <ToolButton active={tool === 'eyedropper'} onClick={() => setTool('eyedropper')} icon={<EyedropperIcon />} title="Eyedropper (I)" />
          <ToolButton active={tool === 'hand'} onClick={() => setTool('hand')} icon="✋" title="Hand (H)" />
        </div>
      </div>

      {/* 4. Bottom Section: Timeline Animation Grid */}
      <div className="h-56 flex flex-col bg-[#505050] border-t border-black">
          {/* Timeline Toolbar */}
          <div className="h-7 bg-[#404040] border-b border-black flex items-center px-1 gap-1">
            <IconButton icon="⏮️" title="First Frame" onClick={() => triggerGoToFrame(0)} />
            <IconButton icon="◀️" title="Prev Frame" onClick={() => triggerGoToFrame(currentFrame - 1)} />
            <IconButton icon={isPlaying ? "⏸️" : "▶️"} title={isPlaying ? "Pause" : "Play"} onClick={triggerTogglePlay} active={isPlaying} />
            <IconButton icon="▶️" title="Next Frame" onClick={() => triggerGoToFrame(currentFrame + 1)} />
            <IconButton icon="⏭️" title="Last Frame" onClick={() => triggerGoToFrame(totalFrames - 1)} />
            
            <div className="w-px h-4 bg-gray-600 mx-2" />
            
            <IconButton icon="➕" title="New Frame" onClick={triggerAddFrame} />
            <IconButton icon="🗑️" title="Delete Frame" onClick={triggerDeleteFrame} />
             
            <div className="w-px h-4 bg-gray-600 mx-2" />
            <div className="text-[10px] text-gray-400 font-mono">
                FRAME: {currentFrame + 1} / {totalFrames}
            </div>
          </div>
         
         <div className="flex-1 flex overflow-hidden">
             
             {/* LEFT: Layer Headers */}
             <div className="w-48 border-r border-black bg-[#454545] flex flex-col relative z-20">
                <div className="h-6 bg-[#383838] border-b border-black flex items-center px-2 gap-2 justify-between">
                   <div className="flex items-center gap-1 font-bold text-gray-400">
                      <button onClick={triggerToggleAllLayerVisibility} title="Toggle All Layers" className="hover:text-white px-1">👁️</button>
                      <span className="ml-1">LAYERS</span>
                   </div>
                   <div className="flex gap-1">
                       <button onClick={triggerAddLayer} title="New Layer" className="text-gray-400 hover:text-white"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></button>
                       <button onClick={triggerDuplicateLayer} title="Duplicate Layer" className="text-gray-400 hover:text-white"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg></button>
                       <button onClick={triggerDeleteLayer} title="Delete Layer" className="text-gray-400 hover:text-white"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg></button>
                   </div>
                </div>
                
                {/* Layer List Header Space to match Frame Header */}
                <div className="h-6 bg-[#404040] border-b border-black" />

                <div className="flex-1 overflow-y-auto no-scrollbar">
                   {/* Reversed map to show top layers at top visually (index 0 is bottom in engine) */}
                   {layers.map((layer) => (
                       <LayerItem 
                           key={layer.id}
                           name={layer.name}
                           active={layer.active}
                           visible={layer.visible}
                           onClick={() => triggerSetActiveLayer(layer.id)}
                           onToggleVisibility={(e) => { e.stopPropagation(); triggerToggleLayerVisibility(layer.id); }}
                       />
                   ))}
                </div>
             </div>
            
            {/* RIGHT: Frame Grid (Aseprite Style) */}
            <div className="flex-1 bg-[#303030] relative overflow-auto flex flex-col">
               {/* Frame Headers (Top Row) */}
               <div className="flex h-6 bg-[#404040] border-b border-black sticky top-0 z-10 min-w-max">
                  {Array.from({ length: totalFrames }).map((_, i) => (
                      <div 
                        key={i}
                        className={`w-8 h-full border-r border-black flex items-center justify-center text-[10px] cursor-pointer hover:bg-[#505050] transition-colors ${
                             i === currentFrame ? 'bg-[#ffcc00] text-black font-bold' : 'text-gray-400'
                        }`}
                        onClick={() => triggerGoToFrame(i)}
                      >
                         {i + 1}
                      </div>
                  ))}
                  {/* Plus button at end of frames */}
                  <div className="w-8 h-full flex items-center justify-center text-gray-500 hover:bg-[#505050] cursor-pointer" onClick={triggerAddFrame}>+</div>
               </div>

               {/* Grid Content */}
               <div className="flex-1 min-w-max">
                  {/* Loop through layers same order as Left Panel */}
                  {layers.map((layer) => (
                    <div key={layer.id} className="flex h-8 border-b border-black/30">
                        {Array.from({ length: totalFrames }).map((_, fIndex) => {
                             const isActiveFrame = fIndex === currentFrame;
                             const isActiveLayer = layer.active;
                             // This is where we would check if this specific cell has content
                             // For now, we simulate "Cell" look
                             return (
                               <div 
                                 key={fIndex}
                                 className={`w-8 h-full border-r border-black/30 flex items-center justify-center cursor-pointer relative ${
                                     isActiveFrame && isActiveLayer 
                                         ? 'bg-blue-600/30' // Current working cell
                                         : isActiveFrame 
                                             ? 'bg-[#454545]' // Current frame column
                                             : 'hover:bg-[#3a3a3a]'
                                 }`}
                                 onClick={() => {
                                     triggerGoToFrame(fIndex);
                                     triggerSetActiveLayer(layer.id);
                                 }}
                               >
                                  {/* Dot to indicate content (Mocked for now, need Frame Data context later) */}
                                   <div className={`w-2 h-2 rounded-full ${isActiveFrame ? 'bg-white' : 'bg-gray-600'}`} />
                               </div>
                             );
                        })}
                        {/* Empty spacer for the plus column */}
                        <div className="w-8 bg-transparent" />
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
      
      {/* 5. Status Bar */}
      <div className="h-5 bg-[#383838] border-t border-black flex items-center px-2 justify-between text-[10px] text-gray-400">
         <div className="flex gap-4">
            <span>{canvasWidth}x{canvasHeight}</span>
            <span className="text-gray-300">Active: <span className="text-blue-400 font-bold">{layers.find(l => l.active)?.name || '-'}</span></span>
            <span className={isPlaying ? "text-green-400" : ""}>{isPlaying ? "[ PLAYING ]" : ""}</span>
         </div>
         <div>Zoom: {Math.round(100)}%</div>
      </div>
    </div>
  );
}

// --- Icons & Components ---
function PencilIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>; }
function EraserIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.05 20h7.66l8.7-8.7c.78-.78.78-2.05 0-2.83l-5.06-5.06A1.996 1.996 0 0015.14 3zM15.14 5l4.87 4.87-3 3L12.14 8l3-3z"/></svg>; }
function FillIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4c0 .55.45 1 1 1s1-.45 1-1V4h-1zM6 4h10v2H6V4zm11 9l-4.13 4.13c-.38.38-1.01.38-1.39 0L6.35 13H5v2c0 .55.45 1 1 1h2.24l3.58 3.58c.39.39 1.02.39 1.41 0L16.82 16H19c.55 0 1-.45 1-1v-2h-2z"/></svg>; }
function EyedropperIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M17.42 10.41l-1-1L15 10.83l-1.42-1.42 1.42-1.42-1-1L12.58 8.41l-1.42-1.42 1.42-1.42-1-1L9.17 6l-1.42 1.42L10.58 10l-2.83 2.83c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0L14.12 13.54l1.42 1.42 1-1-1.42-1.42 1.42-1.42zM12.12 17.08L5.05 10.01l1.41-1.41 7.07 7.07-1.41 1.41z"/></svg>; }
function RectIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 6V18H20V6H4ZM18 16H6V8H18V16Z"/></svg>; }
function MarqueeIcon() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4 4h2v2H4V4zm4 0h2v2H8V4zm4 0h2v2h-2V4zm4 0h2v2h-2V4zm4 0h2v2h-2V4zM4 8h2v2H4V8zm16 0h2v2h-2V8zM4 12h2v2H4v-2zm16 0h2v2h-2v-2zM4 16h2v2H4v-2zm16 0h2v2h-2v-2zM4 20h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" /></svg>; }

function MenuBarItem({ label }: { label: string }) { return <div className="px-2 py-0.5 hover:bg-blue-700 hover:text-white cursor-pointer rounded-sm">{label}</div>; }

interface IconButtonProps { icon: React.ReactNode; title: string; onClick?: () => void; active?: boolean; }
function IconButton({ icon, title, onClick, active }: IconButtonProps) {
  return (
    <button 
      className={`p-1.5 rounded-md transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-[#323232] text-gray-400 hover:text-white'}`}
      title={title} onClick={onClick}
    >
      <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
    </button>
  );
}

function ToolButton({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string }) {
  return (
    <button onClick={onClick} title={title} className={`w-8 h-8 flex items-center justify-center border transition-all mb-1 rounded-sm ${active ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' : 'border-transparent hover:bg-[#606060] hover:border-[#707070] text-gray-300'}`}>
      <div className={`${active ? 'brightness-125' : ''}`}>{icon}</div>
    </button>
  );
}

interface LayerItemProps { name: string; active?: boolean; visible?: boolean; onClick?: () => void; onToggleVisibility?: (e: React.MouseEvent) => void; }
function LayerItem({ name, active, visible, onClick, onToggleVisibility }: LayerItemProps) {
  return (
    <div className={`h-8 flex items-center px-2 text-xs border-b border-black cursor-pointer select-none group transition-all ${active ? 'bg-[#007acc] text-white border-l-4 border-l-white font-medium pl-1' : 'hover:bg-[#4a4a4a] text-gray-400 border-l-4 border-l-transparent pl-1'}`} onClick={onClick}>
      <button className={`mr-2 w-4 h-4 flex items-center justify-center rounded hover:bg-black/20 ${visible ? 'text-inherit opacity-100' : 'text-gray-500 opacity-50'}`} onClick={onToggleVisibility} title={visible ? "Hide Layer" : "Show Layer"}>{visible ? '👁️' : '🚫'}</button>
      <span className="flex-1 truncate">{name}</span>
    </div>
  );
}

function HSVColorPicker({ color, onChange }: { color: number, onChange: (c: number) => void }) {
  const r = color & 0xFF; const g = (color >> 8) & 0xFF; const b = (color >> 16) & 0xFF;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const d = max - min;
  const s = max === 0 ? 0 : d / max; const v = max / 255;
  let h = 0; if (d !== 0) { if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; }
  const [hue, setHue] = useState(h * 360);
  const updateColor = (hVal: number, sVal: number, vVal: number) => {
    const i = Math.floor(hVal / 60); const f = hVal / 60 - i; const p = vVal * (1 - sVal); const q = vVal * (1 - f * sVal); const t = vVal * (1 - (1 - f) * sVal);
    let r1 = 0, g1 = 0, b1 = 0;
    switch (i % 6) { case 0: r1 = vVal; g1 = t; b1 = p; break; case 1: r1 = q; g1 = vVal; b1 = p; break; case 2: r1 = p; g1 = vVal; b1 = t; break; case 3: r1 = p; g1 = q; b1 = vVal; break; case 4: r1 = t; g1 = p; b1 = vVal; break; case 5: r1 = vVal; g1 = p; b1 = q; break; }
    onChange(ColorUtils.rgbaToUint32(Math.round(r1 * 255), Math.round(g1 * 255), Math.round(b1 * 255)));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-square border border-black cursor-crosshair overflow-hidden" style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }} onMouseDown={(e) => { const update = (ev: any) => { const rect = e.currentTarget.getBoundingClientRect(); updateColor(hue, Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)), 1 - Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height))); }; update(e); const move = (ev:any) => update(ev); const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }}>
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute w-2 h-2 border border-white rounded-full -ml-1 -mt-1 pointer-events-none mix-blend-difference" style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }} />
      </div>
      <div className="relative h-3 w-full border border-black cursor-pointer" style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }} onMouseDown={(e) => { const update = (ev: any) => { const rect = e.currentTarget.getBoundingClientRect(); const newHue = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width)) * 360; setHue(newHue); updateColor(newHue, s, v); }; update(e); const move = (ev:any) => update(ev); const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); }; window.addEventListener('mousemove', move); window.addEventListener('mouseup', up); }}>
        <div className="absolute top-0 bottom-0 w-1 bg-white border border-black -ml-0.5" style={{ left: `${(hue / 360) * 100}%` }} />
      </div>
    </div>
  );
}
