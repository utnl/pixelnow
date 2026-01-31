import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class PencilTool implements Tool {
  name = 'pencil';

  onDown(x: number, y: number, engine: PixelEngine) {
    this.draw(x, y, engine);
  }

  onMove(x: number, y: number, engine: PixelEngine) {
    this.draw(x, y, engine);
  }

  private draw(cx: number, cy: number, engine: PixelEngine) {
    const size = engine.brushSize;
    if (size === 1) {
      // Fast path for single pixel
      engine.drawPixel(cx, cy);
      return;
    }

    const half = Math.floor(size / 2);

    // Batch updates
    for (let dy = -half; dy < size - half; dy++) {
      for (let dx = -half; dx < size - half; dx++) {
        engine.drawPixel(cx + dx, cy + dy, undefined, false);
      }
    }

    // Trigger update once
    engine.updateLayer(-1);
  }

  onUp() { }
}