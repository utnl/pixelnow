import * as PIXI from 'pixi.js';
import { PixelEngine } from './PixelEngine';

export class InputSystem {
  public isShiftPressed = false;
  private isDrawing = false;
  private isPanning = false;
  private lastPos: { x: number, y: number } | null = null;
  private lastGlobalPos: { x: number, y: number } | null = null;

  constructor(private engine: PixelEngine) {}

  public init() {
    if (!this.engine.app || !this.engine.app.stage) return;

    this.engine.app.stage.eventMode = 'static';
    this.engine.app.stage.hitArea = this.engine.app.screen;

    this.engine.app.stage.on('pointerdown', this.onPointerDown.bind(this));
    this.engine.app.stage.on('pointermove', this.onPointerMove.bind(this));
    this.engine.app.stage.on('pointerup', this.onPointerUp.bind(this));
    this.engine.app.stage.on('pointerupoutside', this.onPointerUp.bind(this));
    
    const canvas = this.engine.app.canvas;
    if (canvas) {
        canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Shift') this.isShiftPressed = true;
    // Truyền trạng thái Alt vào tool hiện tại
    if (e.key === 'Alt') {
      const tool = this.engine.activeTool as any;
      if (tool && 'isAltPressed' in tool) {
        tool.isAltPressed = true;
      }
    }

    const isCtrl = e.ctrlKey || e.metaKey;
    if (isCtrl && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        this.engine.redo();
      } else {
        this.engine.undo();
      }
    } else if (isCtrl && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      this.engine.redo();
    } else if (isCtrl && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      this.engine.selectionManager.copy();
    } else if (isCtrl && e.key.toLowerCase() === 'v') {
      e.preventDefault();
      this.engine.selectionManager.paste();
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Shift') this.isShiftPressed = false;
    // Reset trạng thái Alt
    if (e.key === 'Alt') {
      const tool = this.engine.activeTool as any;
      if (tool && 'isAltPressed' in tool) {
        tool.isAltPressed = false;
      }
    }
  }

  private onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY;
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      this.engine.cameraSystem.zoom(delta, x, y);
  }

  private onPointerDown(e: PIXI.FederatedPointerEvent) {
    if (e.button === 0) {
        this.isDrawing = true;
        this.processInput(e);
    } else if (e.button === 1 || e.button === 2) {
        this.isPanning = true;
        this.lastGlobalPos = { x: e.global.x, y: e.global.y };
    }
  }

  private onPointerMove(e: PIXI.FederatedPointerEvent) {
    const canvas = this.engine.app?.canvas;
    if (canvas) {
        const localPos = this.engine.container.toLocal(e.global);
        const x = Math.floor(localPos.x);
        const y = Math.floor(localPos.y);

        if (this.engine.selectionManager.isPointInside(x, y)) {
            canvas.style.cursor = 'move';
        } else {
            // Reset to tool default (handled by React or manually here)
            canvas.style.cursor = ''; 
        }
    }

    if (this.isDrawing) {
        this.processInput(e);
    } else if (this.isPanning && this.lastGlobalPos) {
        const dx = e.global.x - this.lastGlobalPos.x;
        const dy = e.global.y - this.lastGlobalPos.y;
        this.engine.cameraSystem.pan(dx, dy);
        this.lastGlobalPos = { x: e.global.x, y: e.global.y };
    }
  }

  private onPointerUp(e: PIXI.FederatedPointerEvent) {
    if (this.isDrawing) {
        const localPos = this.engine.container.toLocal(e.global);
        const x = Math.floor(localPos.x); // Sử dụng tọa độ khi nhấc tay
        const y = Math.floor(localPos.y);
        
        this.engine.handleInputUp(x, y);
        this.engine.saveState();
    }
    this.isDrawing = false;
    this.isPanning = false;
    this.lastPos = null;
    this.lastGlobalPos = null;
  }

  private processInput(e: PIXI.FederatedPointerEvent) {
    const localPos = this.engine.container.toLocal(e.global);
    const x = Math.floor(localPos.x);
    const y = Math.floor(localPos.y);

    this.engine.handleInput(x, y, this.lastPos);
    this.lastPos = { x, y };
  }
}