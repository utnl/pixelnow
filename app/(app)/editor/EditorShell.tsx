"use client";

import { useState, useRef, useEffect } from "react";
import CanvasHost from "./CanvasHost";
import SelectionGizmos from "./SelectionGizmos";
import { useEditorStore } from "@/store/editor.store";
import { ColorUtils } from "@/engine/ColorUtils";

export default function EditorShell() {
  const { tool, setTool, primaryColor, setPrimaryColor, canvasWidth, canvasHeight, brushSize, setBrushSize, triggerUndo, triggerRedo, triggerDeleteSelection, triggerFlipH, triggerFlipV, triggerRotate, triggerImport, triggerExport } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Delete') triggerDeleteSelection();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDeleteSelection]);
  const setCanvasSize = (size: number) => {
    useEditorStore.setState({ canvasWidth: size, canvasHeight: size });
  };

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

      {/* 2. Top Toolbar (Common Actions & Tool Settings) */}
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
        <div className="flex items-center gap-2 border-r border-[#303030] pr-2">
          <span>Canvas Size:</span>
          <select 
            className="bg-[#303030] border border-black px-1 text-[10px] outline-none"
            value={canvasWidth}
            onChange={(e) => setCanvasSize(Number(e.target.value))}
          >
            <option value={16}>16x16</option>
            <option value={32}>32x32</option>
            <option value={64}>64x64</option>
            <option value={128}>128x128</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span>Brush Size:</span>
          <input 
            type="number" 
            className="w-12 bg-[#303030] border border-black px-1 outline-none" 
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
        <div className="w-48 flex flex-col bg-[#505050] border-r border-black overflow-hidden">
          
          {/* Dynamic Picker Area (Inspired by user image) */}
          <div className="p-2 border-b border-black bg-[#454545]">
             <HSVColorPicker color={primaryColor} onChange={setPrimaryColor} />
          </div>

          {/* Palette Grid */}
          <div className="flex-1 p-1 overflow-y-auto">
             <div className="grid grid-cols-6 gap-0.5">
               {Array.from({ length: 120 }).map((_, i) => {
                 let h = 0, s = 0, l = 0;
                 
                 if (i < 96) {
                    // 4 rows of 24 colors each with different lightness
                    h = (i % 24) * (360 / 24);
                    s = 80;
                    if (i < 24) l = 50;      // Standard
                    else if (i < 48) l = 75; // Light
                    else if (i < 72) l = 35; // Darker
                    else l = 15;             // Darkest
                 } else {
                    // Last 24 colors are Grayscale
                    h = 0;
                    s = 0;
                    l = ((i - 96) / 24) * 100;
                 }
                 
                 // Standard HSL to RGB
                 const c = (1 - Math.abs(2 * (l/100) - 1)) * (s/100);
                 const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
                 const m = (l/100) - c / 2;
                 let r = 0, g = 0, b = 0;
                 if (0 <= h && h < 60) { r = c; g = x; b = 0; }
                 else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
                 else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
                 else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
                 else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
                 else { r = c; g = 0; b = x; }
                 
                 const colorInt = ColorUtils.rgbaToUint32(
                    Math.round((r + m) * 255),
                    Math.round((g + m) * 255),
                    Math.round((b + m) * 255)
                 );
                 
                 const isActive = primaryColor === colorInt;

                 return (
                 <div 
                   key={i} 
                   className={`w-full aspect-square border cursor-pointer hover:z-10 hover:scale-125 transition-all ${
                     isActive ? 'border-white scale-110 z-20 shadow-md ring-1 ring-black' : 'border-black'
                   }`}
                   style={{ backgroundColor: ColorUtils.uint32ToCss(colorInt) }} 
                   onClick={() => setPrimaryColor(colorInt)}
                 />
               )})}
             </div>
          </div>

          {/* Active Colors */}
          <div className="h-20 border-t border-black p-2 flex items-center gap-3 bg-[#454545]">
             <label className="relative cursor-pointer group">
               <div 
                 className="w-12 h-12 border border-white z-10 shadow-lg group-hover:border-yellow-400" 
                 style={{ backgroundColor: ColorUtils.uint32ToCss(primaryColor) }} 
               />
               <input 
                 type="color" 
                 className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
                 value={ColorUtils.uint32ToHex(primaryColor)}
                 onChange={(e) => setPrimaryColor(ColorUtils.hexToUint32(e.target.value))}
               />
             </label>
             <div className="flex flex-col">
                <div className="text-[11px] font-bold text-white font-mono">{ColorUtils.uint32ToHex(primaryColor)}</div>
                <div className="text-[9px] text-gray-400">R: {primaryColor & 0xFF} G: {(primaryColor >> 8) & 0xFF} B: {(primaryColor >> 16) & 0xFF}</div>
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 bg-[#2b2b2b] relative overflow-hidden">
            <CanvasHost />
            <SelectionGizmos />
        </div>

        {/* RIGHT: Tools Strip */}
        <div className="w-10 flex flex-col items-center py-1 bg-[#505050] border-l border-black overflow-y-auto gap-0.5">
          <ToolButton 
            active={tool === 'pencil'} 
            onClick={() => setTool('pencil')} 
            icon={<PencilIcon />} 
            title="Pencil (B)" 
          />
          <ToolButton 
            active={tool === 'eraser'} 
            onClick={() => setTool('eraser')} 
            icon={<EraserIcon />} 
            title="Eraser (E)" 
          />
          <ToolButton 
            active={tool === 'fill'} 
            onClick={() => setTool('fill')} 
            icon={<FillIcon />} 
            title="Fill Bucket (G)" 
          />
          <div className="h-px w-6 bg-gray-600 my-1" />
          <ToolButton 
            active={tool === 'selection'} 
            onClick={() => setTool('selection')} 
            icon={<MarqueeIcon />} 
            title="Marquee Selection (M)" 
          />
          <ToolButton 
            active={tool === 'eyedropper'} 
            onClick={() => setTool('eyedropper')} 
            icon={<EyedropperIcon />} 
            title="Eyedropper (I)" 
          />
          <ToolButton 
            active={tool === 'rectangle'} 
            onClick={() => setTool('rectangle')} 
            icon={<RectIcon />} 
            title="Rectangle (R)" 
          />
          <ToolButton active={false} onClick={() => {}} icon="✋" title="Hand (H)" />
          <ToolButton active={false} onClick={() => {}} icon="🔍" title="Zoom (Z)" />
        </div>
      </div>

      {/* 4. Bottom Section: Timeline */}
      <div className="h-48 flex flex-col bg-[#505050] border-t border-black">
          <div className="h-6 bg-[#404040] border-b border-black flex items-center px-1 gap-1">
            <IconButton icon="⏮️" title="First Frame" />
            <IconButton icon="▶️" title="Play Animation" />
            <IconButton icon="⏭️" title="Last Frame" />
            <div className="ml-4 text-gray-400">Frame 1 / 1</div>
          </div>
         
         <div className="flex-1 flex overflow-hidden">
            <div className="w-48 border-r border-black bg-[#454545] flex flex-col overflow-y-auto">
               <LayerItem name="Layer 1" active />
               <LayerItem name="Background" />
            </div>
            
            <div className="flex-1 bg-[#353535] relative overflow-auto p-1">
               <div className="flex gap-1">
                  <div className="w-8 h-full bg-[#505050] border border-blue-500/50 flex flex-col gap-1 p-0.5">
                     <div className="flex-1 bg-white/10 rounded-sm border border-black/20" />
                     <div className="flex-1 bg-white/5 rounded-sm border border-black/20" />
                  </div>
                  <div className="w-8 h-full bg-[#404040] border border-black/20" />
                  <div className="w-8 h-full bg-[#404040] border border-black/20" />
                  <div className="w-8 h-full bg-[#404040] border border-black/20" />
               </div>
            </div>
         </div>
      </div>
      
      {/* 5. Status Bar */}
      <div className="h-5 bg-[#383838] border-t border-black flex items-center px-2 justify-between text-[10px] text-gray-400">
         <div>{canvasWidth}x{canvasHeight}  RGBA</div>
         <div>Zoom: {Math.round(100)}%</div>
      </div>
    </div>
  );
}

// --- Icons ---
function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.05 20h7.66l8.7-8.7c.78-.78.78-2.05 0-2.83l-5.06-5.06A1.996 1.996 0 0015.14 3zM15.14 5l4.87 4.87-3 3L12.14 8l3-3z"/>
    </svg>
  );
}

function FillIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4c0 .55.45 1 1 1s1-.45 1-1V4h-1zM6 4h10v2H6V4zm11 9l-4.13 4.13c-.38.38-1.01.38-1.39 0L6.35 13H5v2c0 .55.45 1 1 1h2.24l3.58 3.58c.39.39 1.02.39 1.41 0L16.82 16H19c.55 0 1-.45 1-1v-2h-2z"/>
    </svg>
  );
}

function EyedropperIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17.42 10.41l-1-1L15 10.83l-1.42-1.42 1.42-1.42-1-1L12.58 8.41l-1.42-1.42 1.42-1.42-1-1L9.17 6l-1.42 1.42L10.58 10l-2.83 2.83c-.39.39-.39 1.02 0 1.41l2.12 2.12c.39.39 1.02.39 1.41 0L14.12 13.54l1.42 1.42 1-1-1.42-1.42 1.42-1.42zM12.12 17.08L5.05 10.01l1.41-1.41 7.07 7.07-1.41 1.41z"/>
    </svg>
  );
}

function RectIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M4 6V18H20V6H4ZM18 16H6V8H18V16Z"/>
    </svg>
  );
}

function MarqueeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M4 4h2v2H4V4zm4 0h2v2H8V4zm4 0h2v2h-2V4zm4 0h2v2h-2V4zm4 0h2v2h-2V4zM4 8h2v2H4V8zm16 0h2v2h-2V8zM4 12h2v2H4v-2zm16 0h2v2h-2v-2zM4 16h2v2H4v-2zm16 0h2v2h-2v-2zM4 20h2v2H4v-2zm4 0h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" />
    </svg>
  );
}

function MenuBarItem({ label }: { label: string }) {
  return (
    <div className="px-2 py-0.5 hover:bg-blue-700 hover:text-white cursor-pointer rounded-sm">
      {label}
    </div>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  active?: boolean;
}

function IconButton({ icon, title, onClick, active }: IconButtonProps) {
  return (
    <button 
      className={`p-1.5 rounded-md transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'hover:bg-[#323232] text-gray-400 hover:text-white'
      }`}
      title={title}
      onClick={onClick}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {icon}
      </div>
    </button>
  );
}

function RotateIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );
}

function FlipHIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v20c0 .6 0 1 0 1m8-21v20c0 .6 0 1 0 1M3 12h18"/>
      <path d="M12 3v18"/>
      <path d="m2 16 5-4-5-4M22 16l-5-4 5-4"/>
    </svg>
  );
}

function FlipVIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8h20m-20 8h20M12 3v18"/>
      <path d="M12 12H3"/>
      <path d="m16 2-4 5-4-5M16 22l-4-5-4-5"/>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
    </svg>
  );
}

function ToolButton({ active, onClick, icon, title }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string }) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`w-8 h-8 flex items-center justify-center border transition-all mb-1 rounded-sm ${
        active 
          ? 'bg-blue-600 border-blue-400 text-white shadow-lg scale-105' 
          : 'border-transparent hover:bg-[#606060] hover:border-[#707070] text-gray-300'
      }`}
    >
      <div className={`${active ? 'brightness-125' : ''}`}>{icon}</div>
    </button>
  );
}

function LayerItem({ name, active }: { name: string, active?: boolean }) {
  return (
    <div className={`h-8 flex items-center px-2 text-xs border-b border-black cursor-pointer ${active ? 'bg-blue-600 text-white' : 'hover:bg-[#555]'}`}>
      <span className="mr-2">👁️</span>
      {name}
    </div>
  );
}

// --- HSV Color Picker Components ---

function HSVColorPicker({ color, onChange }: { color: number, onChange: (c: number) => void }) {
  // Convert current integer color to HSV for internal state
  const r = color & 0xFF;
  const g = (color >> 8) & 0xFF;
  const b = (color >> 16) & 0xFF;

  // Simple RGB to HSV conversion
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max / 255;
  let h = 0;

  if (d !== 0) {
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  const [hue, setHue] = useState(h * 360);
  
  // HSV to RGB for the integer update
  const updateColor = (hVal: number, sVal: number, vVal: number) => {
    const i = Math.floor(hVal / 60);
    const f = hVal / 60 - i;
    const p = vVal * (1 - sVal);
    const q = vVal * (1 - f * sVal);
    const t = vVal * (1 - (1 - f) * sVal);
    let r1 = 0, g1 = 0, b1 = 0;
    switch (i % 6) {
      case 0: r1 = vVal; g1 = t; b1 = p; break;
      case 1: r1 = q; g1 = vVal; b1 = p; break;
      case 2: r1 = p; g1 = vVal; b1 = t; break;
      case 3: r1 = p; g1 = q; b1 = vVal; break;
      case 4: r1 = t; g1 = p; b1 = vVal; break;
      case 5: r1 = vVal; g1 = p; b1 = q; break;
    }
    onChange(ColorUtils.rgbaToUint32(Math.round(r1 * 255), Math.round(g1 * 255), Math.round(b1 * 255)));
  };

  return (
    <div className="flex flex-col gap-2">
      {/* SV Area */}
      <div 
        className="relative w-full aspect-square border border-black cursor-crosshair overflow-hidden"
        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        onMouseDown={(e) => {
           const update = (ev: MouseEvent | React.MouseEvent) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
              const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
              updateColor(hue, x, 1 - y);
           };
           update(e);
           const move = (ev: MouseEvent) => update(ev);
           const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
           window.addEventListener('mousemove', move);
           window.addEventListener('mouseup', up);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        {/* Cursor */}
        <div 
          className="absolute w-2 h-2 border border-white rounded-full -ml-1 -mt-1 pointer-events-none mix-blend-difference"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
        />
      </div>

      {/* Hue Slider */}
      <div 
        className="relative h-3 w-full border border-black cursor-pointer"
        style={{ background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)' }}
        onMouseDown={(e) => {
            const update = (ev: MouseEvent | React.MouseEvent) => {
               const rect = e.currentTarget.getBoundingClientRect();
               const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
               const newHue = x * 360;
               setHue(newHue);
               updateColor(newHue, s, v);
            };
            update(e);
            const move = (ev: MouseEvent) => update(ev);
            const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
        }}
      >
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white border border-black -ml-0.5" 
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>
    </div>
  );
}
