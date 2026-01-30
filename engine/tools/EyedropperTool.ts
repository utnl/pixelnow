import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class EyedropperTool implements Tool {
  name: string = 'eyedropper';

  onDown(x: number, y: number, engine: PixelEngine): void {
    this.pickColor(x, y, engine);
  }

  onMove(x: number, y: number, engine: PixelEngine): void {
    this.pickColor(x, y, engine);
  }

  onUp(x: number, y: number, engine: PixelEngine): void {
    // Nothing on up
  }

  private pickColor(x: number, y: number, engine: PixelEngine) {
    const layerIndex = 0; // Target active layer
    const width = engine.layerManager.width;
    const height = engine.layerManager.height;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const color = engine.getLayerPixel(layerIndex, x, y);
    
    // Transparent pixels (color 0) can be ignored or handled
    // In many editors, picking transparent gives you transparent, but for simplicity we pick if not transparent
    if (color !== 0) {
        engine.setColor(color);
        // Important: Link back to the UI store to update the picker
        // We'll handle this via a callback or event in PixelEngine
        engine.onColorPicked?.(color);
    }
  }
}
