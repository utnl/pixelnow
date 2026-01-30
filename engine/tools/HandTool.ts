import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class HandTool implements Tool {
  name: string = 'hand';
  
  private isDragging = false;
  private lastX = 0;
  private lastY = 0;

  onDown(x: number, y: number, engine: PixelEngine, event: PointerEvent): void {
    this.isDragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    
    // Đổi cursor
    if (engine.app?.canvas) {
        engine.app.canvas.style.cursor = 'grabbing';
    }
  }

  onMove(x: number, y: number, engine: PixelEngine, event: PointerEvent): void {
    if (!this.isDragging) return;

    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;

    engine.cameraSystem.pan(dx, dy);

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  onUp(x: number, y: number, engine: PixelEngine): void {
    this.isDragging = false;
    if (engine.app?.canvas) {
        engine.app.canvas.style.cursor = 'grab';
    }
  }
}
