import * as PIXI from 'pixi.js';
import { LayerManager } from './LayerManager';
import { InputSystem } from './InputSystem';
import { CameraSystem } from './CameraSystem';
import { Tool } from './tools/Tool';
import { PencilTool } from './tools/PencilTool';
import { EraserTool } from './tools/EraserTool';
import { FillTool } from './tools/FillTool';
import { EyedropperTool } from './tools/EyedropperTool';
import { RectangleTool } from './tools/RectangleTool';
import { SelectionTool } from './tools/SelectionTool';
import { HistorySystem } from './HistorySystem';
import { SelectionManager } from './SelectionManager';
import { FileManager } from './FileManager';
import { HandTool } from './tools/HandTool';
import { AnimationManager } from './AnimationManager';
import { PivotTool } from './tools/PivotTool';
import { TransformTool } from './tools/TransformTool';
import { RiggingManager } from './RiggingManager';
import { CursorManager } from './CursorManager';



export class PixelEngine {
  public app: PIXI.Application | null = null;
  public container: PIXI.Container;

  public layerManager: LayerManager;
  public inputSystem: InputSystem;
  public cameraSystem: CameraSystem;
  public historySystem: HistorySystem;
  public selectionManager: SelectionManager;
  public fileManager: FileManager;
  public animationManager: AnimationManager;
  public riggingManager: RiggingManager;
  public cursorManager: CursorManager;

  public onColorPicked?: (color: number) => void;
  public onSelectionChanged?: (area: { x: number, y: number, width: number, height: number } | null) => void;
  public onCanvasSizeChanged?: (width: number, height: number) => void;
  public onLayerChanged?: () => void;
  public onFrameChanged?: (current: number, total: number) => void;

  public activeTool: Tool;

  // ...

  public getLayerPixel(layerIndex: number, x: number, y: number): number {
    const targetIndex = layerIndex === -1 ? this.layerManager.activeLayerIndex : layerIndex;
    if (targetIndex < 0 || targetIndex >= this.layerManager.layers.length) return 0;

    // Check bounds
    if (x < 0 || x >= this.layerManager.width || y < 0 || y >= this.layerManager.height) return 0;

    const layer = this.layerManager.layers[targetIndex];
    if (!layer || !layer.visible) return 0; // Ignore hidden layers when picking? usually yes.

    const idx = y * this.layerManager.width + x;
    return layer.data[idx];
  }

  public drawPixel(x: number, y: number, colorOverride?: number, shouldUpdate: boolean = true) {
    const color = colorOverride !== undefined ? colorOverride : this.primaryColor;

    const activeNode = this.layerManager.activeNode;
    if (activeNode && activeNode.type === 'layer') {
      // Convert root-space (x,y) to layer-local-space
      const localPoint = activeNode.toLocal(new PIXI.Point(x, y), this.container);
      this.layerManager.setPixel(-1, Math.round(localPoint.x), Math.round(localPoint.y), color);
      if (shouldUpdate) {
        this.layerManager.updateLayer(-1);
      }
    }
  }

  public setPixelRaw(x: number, y: number, color: number, layerIndex: number = -1) {
    this.layerManager.setPixel(layerIndex, x, y, color);
  }

  public updateLayer(layerIndex: number = -1) {
    this.layerManager.updateLayer(layerIndex);
  }

  // --- Animation API Wrappers ---
  public addFrame() { this.animationManager.addFrame(true); }
  public addEmptyFrame() { this.animationManager.addFrame(false); }
  public deleteFrame() { this.animationManager.deleteCurrentFrame(); }
  public togglePlay() { this.animationManager.togglePlay(); }
  public nextFrame() {
    const next = this.animationManager.currentFrameIndex + 1;
    if (next < this.animationManager.frames.length) this.animationManager.loadFrame(next);
  }
  public prevFrame() {
    const prev = this.animationManager.currentFrameIndex - 1;
    if (prev >= 0) this.animationManager.loadFrame(prev);
  }
  public goToFrame(index: number) { this.animationManager.loadFrame(index); }
  public isPlaying() { return this.animationManager.isPlaying; }

  // --- Layer API Wrappers ---
  public addLayer() {
    this.layerManager.addLayer();
    this.historySystem.saveState();
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public duplicateActiveLayer() {
    this.layerManager.duplicateLayer(this.layerManager.activeLayerIndex);
    this.historySystem.saveState();
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public deleteActiveLayer() {
    this.layerManager.deleteActiveLayer();
    this.historySystem.saveState();
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public setActiveLayer(index: number) {
    this.layerManager.setActiveLayer(index);
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public toggleLayerVisibility(index: number) {
    this.layerManager.toggleVisibility(index);
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public toggleAllLayerVisibility() {
    this.layerManager.toggleAllVisibility();
    if (this.onLayerChanged) this.onLayerChanged();
  }

  public addBone(name: string = 'New Bone', parentId?: string) {
    this.layerManager.addBone(name, parentId);
    if (this.onLayerChanged) this.onLayerChanged();
  }

  // ...
  public primaryColor: number = 0xFFFFFFFF; // White default
  public brushSize: number = 1;

  private isDestroyed = false;

  constructor() {
    this.container = new PIXI.Container();

    // Systems
    this.layerManager = new LayerManager(32, 32);
    this.container.addChild(this.layerManager.container);

    this.cameraSystem = new CameraSystem(this);
    this.inputSystem = new InputSystem(this);
    this.historySystem = new HistorySystem(this);
    this.selectionManager = new SelectionManager(this);
    this.selectionManager = new SelectionManager(this);
    this.animationManager = new AnimationManager(this);
    this.fileManager = new FileManager(this);
    this.riggingManager = new RiggingManager(this);
    this.cursorManager = new CursorManager(this);

    // Default Tool
    this.activeTool = new PencilTool();

    // Initial state
    this.historySystem.saveState();
  }


  async init(container: HTMLElement, viewportWidth: number, viewportHeight: number) {
    if (this.isDestroyed) return;

    try {
      console.log('[PixelEngine] Creating Application...');
      // Set default scale mode to nearest for pixel art
      PIXI.TextureStyle.defaultOptions.scaleMode = 'nearest';

      const app = new PIXI.Application();

      await app.init({
        width: viewportWidth,
        height: viewportHeight,
        backgroundColor: 0x1a1a1a,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      if (this.isDestroyed) {
        app.destroy(true, { children: true, texture: true });
        return;
      }

      this.app = app;

      if (this.app.canvas) {
        container.appendChild(this.app.canvas);
        this.app.canvas.style.width = '100%';
        this.app.canvas.style.height = '100%';
        this.app.canvas.style.display = 'block';
        this.app.canvas.className = 'shadow-inner cursor-crosshair';
      }

      if (PIXI.TextureSource) {
        PIXI.TextureSource.defaultOptions.scaleMode = 'nearest';
      }

      this.app.stage.addChild(this.container);

      this.createCheckerboard(this.layerManager.width, this.layerManager.height);

      const border = new PIXI.Graphics();
      border.rect(-0.5, -0.5, this.layerManager.width + 1, this.layerManager.height + 1);
      border.stroke({ color: 0x444444, width: 1, alignment: 1 });
      this.container.addChild(border);

      const initialScale = Math.min(viewportWidth, viewportHeight) / (this.layerManager.width * 1.2);
      this.cameraSystem.setZoom(initialScale);
      this.cameraSystem.setPosition(
        (viewportWidth - this.layerManager.width * initialScale) / 2,
        (viewportHeight - this.layerManager.height * initialScale) / 2
      );

      this.inputSystem.init();

      // Initialize Selection Ticker
      this.selectionManager.initTicker();

      // Initialize Rigging Gizmos
      this.riggingManager.init();
      this.cursorManager.init();

      // Add Animation Update Loop
      this.app.ticker.add((ticker) => {
        this.animationManager.update(ticker.deltaMS);
        this.riggingManager.update();
      });

      console.log('[PixelEngine] Ready with Viewport.');
    } catch (e) {
      console.error('[PixelEngine] Initialization error:', e);
    }
  }

  private createCheckerboard(w: number, h: number) {
    const size = 2;
    const graphics = new PIXI.Graphics();
    for (let y = 0; y < h; y += size) {
      for (let x = 0; x < w; x += size) {
        const isDark = ((x / size) + (y / size)) % 2 === 0;
        graphics.rect(x, y, Math.min(size, w - x), Math.min(size, h - y));
        graphics.fill({ color: isDark ? 0x2a2a2a : 0x333333 });
      }
    }
    this.container.addChildAt(graphics, 0);
  }

  public resizeProject(newWidth: number, newHeight: number) {
    if (!this.app) return;
    if (this.layerManager.width === newWidth && this.layerManager.height === newHeight) return;

    this.layerManager.reset(newWidth, newHeight);

    // Clear ONLY the transient children (checkerboard, border)
    // but keep the layer container and system graphics if possible.
    // Re-organize the hierarchy cleanly:
    this.container.removeChildren();

    // 1. Bottom: Checkerboard
    this.createCheckerboard(newWidth, newHeight);

    // 2. Middle: Layers
    this.container.addChild(this.layerManager.container);

    // 3. Top-ish: Border
    const border = new PIXI.Graphics();
    border.rect(-0.5, -0.5, newWidth + 1, newHeight + 1);
    border.stroke({ color: 0x444444, width: 1, alignment: 1 });
    this.container.addChild(border);

    // 4. Very Top: Selection Marquee
    if (this.selectionManager) {
      this.container.addChild(this.selectionManager.getGraphics());
      this.container.addChild(this.selectionManager.getHandleGraphics());
    }

    const initialScale = Math.min(this.app.screen.width, this.app.screen.height) / (newWidth * 1.2);
    this.cameraSystem.setZoom(initialScale);
    this.cameraSystem.setPosition(
      (this.app.screen.width - newWidth * initialScale) / 2,
      (this.app.screen.height - newHeight * initialScale) / 2
    );

    this.historySystem.saveState();
  }

  public undo() { this.historySystem.undo(); }
  public redo() { this.historySystem.redo(); }
  public saveState() { this.historySystem.saveState(); }

  public handleInput(x: number, y: number, lastPos: { x: number, y: number } | null, event?: PointerEvent) {
    if (this.isDestroyed || !this.activeTool) return;

    // Update cursor preview
    this.cursorManager.update(x, y);

    // Hand tool handled differently (screen space delta)
    if (this.activeTool.name === 'hand') {
      if (!lastPos) {
        this.activeTool.onDown(x, y, this, event);
      } else {
        this.activeTool.onMove(x, y, this, event);
      }
      return;
    }

    // Normal tools (Pixel space with Bresenham)
    if (!lastPos) {
      this.activeTool.onDown(x, y, this, event);
    } else {
      let x0 = lastPos.x;
      let y0 = lastPos.y;
      const x1 = x;
      const y1 = y;
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
      while (true) {
        this.activeTool.onMove(x0, y0, this, event);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
      }
    }
  }

  public handleInputUp(x: number, y: number, event?: PointerEvent) {
    if (this.activeTool) {
      this.activeTool.onUp(x, y, this, event);
    }
  }

  public setColor(color: number) { this.primaryColor = color; }
  public setBrushSize(size: number) { this.brushSize = size; }

  public setTool(toolName: string) {
    if (toolName !== 'selection' && this.selectionManager) {
      this.selectionManager.clearSelection();
    }

    if (toolName === 'pencil') this.activeTool = new PencilTool();
    if (toolName === 'eraser') this.activeTool = new EraserTool();
    if (toolName === 'fill') this.activeTool = new FillTool();
    if (toolName === 'eyedropper') this.activeTool = new EyedropperTool();
    if (toolName === 'rectangle') this.activeTool = new RectangleTool();
    if (toolName === 'selection') this.activeTool = new SelectionTool();
    if (toolName === 'hand') this.activeTool = new HandTool();
    if (toolName === 'pivot') this.activeTool = new PivotTool();
    if (toolName === 'transform') this.activeTool = new TransformTool();

    if (this.app?.canvas) {
      this.app.canvas.style.cursor = toolName === 'hand' ? 'grab' : 'default';
    }
  }


  destroy() {
    this.isDestroyed = true;
    if (this.app) {
      try {
        this.app.destroy(true, { children: true, texture: true });
      } catch (e) {
        console.warn('[PixelEngine] Error during destroy:', e);
      }
      this.app = null;
    }
  }
}
