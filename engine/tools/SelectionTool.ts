import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';
import { HandleType } from '../SelectionManager';

export class SelectionTool implements Tool {
  name: string = 'selection';
  private startX: number = 0;
  private startY: number = 0;
  private isSelecting: boolean = false;
  private isMoving: boolean = false;
  private isRotating: boolean = false;
  private activeHandle: HandleType = 'none';
  private moveOffsetX: number = 0;
  private moveOffsetY: number = 0;
  private initialSelection: {x: number, y: number, w: number, h: number} | null = null;
  private dragThreshold: number = 2; 
  private hasMoved: boolean = false;
  private isAltPressed: boolean = false;
  private activeCursor: string = 'default';

  onDown(x: number, y: number, engine: PixelEngine): void {
    const selection = engine.selectionManager.getActiveSelection();
    const handle = engine.selectionManager.getHandleAt(x, y);
    const canvas = engine.app?.canvas;

    if (handle !== 'none') {
        const currentRot = engine.selectionManager.rotation;
        
        if (handle === 'rot') {
            this.activeCursor = 'crosshair';
            this.isRotating = true;
            this.activeHandle = 'none';
        } else {
            // TẤT CẢ 8 handles (góc + cạnh) đều để Resize
            this.activeCursor = this.getRotatedCursor(handle, currentRot);
            this.activeHandle = handle;
            this.initialSelection = selection ? { ...selection, w: selection.width, h: selection.height } : null;
        }
        
        if (canvas) canvas.style.cursor = this.activeCursor;
        
        if (!engine.selectionManager.isMovingSelection()) {
            engine.selectionManager.startMoving();
        }
        return;
    }

    const isInside = selection && engine.selectionManager.isPointInside(x, y);

    if (isInside) {
      this.isMoving = true;
      this.activeCursor = 'move';
      if (canvas) canvas.style.cursor = this.activeCursor;
      this.moveOffsetX = x - selection!.x;
      this.moveOffsetY = y - selection!.y;
      
      if (!engine.selectionManager.isMovingSelection()) {
          engine.selectionManager.startMoving();
      }
    } else {
      // Click ra ngoài -> Clear vùng cũ và bắt đầu chọn vùng mới
      engine.selectionManager.clearSelection();
      this.isSelecting = true;
      this.activeCursor = 'crosshair';
      if (canvas) canvas.style.cursor = this.activeCursor;
      this.startX = x;
      this.startY = y;
      this.hasMoved = false;
    }
  }

  onMove(x: number, y: number, engine: PixelEngine): void {
    const canvas = engine.app?.canvas;
    
    if (canvas && (this.isRotating || this.activeHandle !== 'none' || this.isMoving || this.isSelecting)) {
        canvas.style.cursor = this.activeCursor;
    }
    
    if (this.isRotating) {
        const selection = engine.selectionManager.getActiveSelection();
        if (!selection) return;
        const cx = selection.x + selection.width / 2;
        const cy = selection.y + selection.height / 2;
        // Tính góc xoay linh hoạt
        const angle = Math.atan2(y - cy, x - cx) + Math.PI / 2;
        engine.selectionManager.setRotation(angle);
    } 
    else if (this.activeHandle !== 'none' && this.initialSelection) {
        const s = this.initialSelection;
        const dx = x - (this.activeHandle.includes('l') ? s.x : (this.activeHandle.includes('r') ? s.x + s.w : s.x + s.w/2));
        const dy = y - (this.activeHandle.includes('t') ? s.y : (this.activeHandle.includes('b') ? s.y + s.h : s.y + s.h/2));
        
        // Cần thuật toán resize chính xác hỗ trợ xoay (nhưng tạm thời làm đơn giản)
        // Lưu ý: Resize khi đã xoay là một bài toán khó, hiện tại ta chỉ resize bounding box thẳng
        let newX = s.x, newY = s.y, newW = s.w, newH = s.h;

        if (this.activeHandle.includes('r')) newW = Math.max(1, x - s.x);
        if (this.activeHandle.includes('l')) {
            newW = Math.max(1, s.x + s.w - x);
            newX = s.x + s.w - newW;
        }
        if (this.activeHandle.includes('b')) newH = Math.max(1, y - s.y);
        if (this.activeHandle.includes('t')) {
            newH = Math.max(1, s.y + s.h - y);
            newY = s.y + s.h - newH;
        }

        engine.selectionManager.resizeSelection(newX, newY, newW, newH);
    } 
    else if (this.isSelecting) {
      const dist = Math.hypot(x - this.startX, y - this.startY);
      if (dist > this.dragThreshold || this.hasMoved) {
        this.hasMoved = true;
        const x1 = Math.min(this.startX, x);
        const y1 = Math.min(this.startY, y);
        const w = Math.abs(x - this.startX) + 1;
        const h = Math.abs(y - this.startY) + 1;
        engine.selectionManager.setSelection(x1, y1, w, h);
      }
    } else if (this.isMoving) {
      engine.selectionManager.moveSelection(x - this.moveOffsetX, y - this.moveOffsetY);
    } else {
        // Cập nhật cursor khi hover
        if (canvas) {
            const h = engine.selectionManager.getHandleAt(x, y);
            if (h === 'rot') {
                canvas.style.cursor = 'crosshair';
            } else if (h !== 'none') {
                canvas.style.cursor = this.getRotatedCursor(h, engine.selectionManager.rotation);
            } else if (engine.selectionManager.isPointInside(x, y)) {
                canvas.style.cursor = 'move';
            } else {
                canvas.style.cursor = 'default';
            }
        }
    }
  }

  onUp(x: number, y: number, engine: PixelEngine): void {
    this.isSelecting = false;
    this.isMoving = false;
    this.isRotating = false;
    this.activeHandle = 'none';
    this.initialSelection = null;
    
    const canvas = engine.app?.canvas;
    if (canvas) canvas.style.cursor = 'default';
  }

  private getRotatedCursor(handle: HandleType, rotation: number): string {
    const angle = ((rotation * 180 / Math.PI) % 180 + 180) % 180;
    const cursors: Record<string, string[]> = {
        'ns': ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'],
        'ew': ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'],
        'nwse': ['nwse-resize', 'ns-resize', 'nesw-resize', 'ew-resize'],
        'nesw': ['nesw-resize', 'ew-resize', 'nwse-resize', 'ns-resize']
    };

    let base = '';
    if (handle === 'tc' || handle === 'bc') base = 'ns';
    else if (handle === 'ml' || handle === 'mr') base = 'ew';
    else if (handle === 'tl' || handle === 'br') base = 'nwse';
    else if (handle === 'tr' || handle === 'bl') base = 'nesw';

    if (!base) return 'default';
    const index = Math.round(angle / 45) % 4;
    return cursors[base][index];
  }

  setAltPressed(pressed: boolean) {
    this.isAltPressed = pressed;
  }
}
