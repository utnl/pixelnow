import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class EraserTool implements Tool {
  name = 'eraser';

  onDown(x: number, y: number, engine: PixelEngine) {
    this.erase(x, y, engine);
  }

  onMove(x: number, y: number, engine: PixelEngine) {
    this.erase(x, y, engine);
  }

  private erase(cx: number, cy: number, engine: PixelEngine) {
    const size = engine.brushSize;
    const half = Math.floor(size / 2);

    // Batch updates: Draw all pixels without triggering texture update
    for (let dy = -half; dy < size - half; dy++) {
      for (let dx = -half; dx < size - half; dx++) {
        engine.drawPixel(cx + dx, cy + dy, 0x00000000, false);
      }
    }

    // Trigger update only once
    engine.updateLayer(-1);
  }

  onUp() { }
}