import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class FillTool implements Tool {
  name: string = 'fill';

  onDown(x: number, y: number, engine: PixelEngine): void {
    const layerIndex = 0; // Target active layer
    const targetColor = engine.getLayerPixel(layerIndex, x, y);
    const fillColor = engine.primaryColor;

    // Don't fill if same color
    if (targetColor === fillColor) return;

    this.floodFill(engine, layerIndex, x, y, targetColor, fillColor);
    
    // Final update after batch drawing
    engine.updateLayer(layerIndex);
  }

  onMove(x: number, y: number, engine: PixelEngine): void {
    // Fill tool typically doesn't do anything on move
  }

  onUp(x: number, y: number, engine: PixelEngine): void {
    // Fill tool typically doesn't do anything on up
  }

  private floodFill(
    engine: PixelEngine, 
    layerIndex: number, 
    startX: number, 
    startY: number, 
    targetColor: number, 
    fillColor: number
  ) {
    const width = engine.layerManager.width;
    const height = engine.layerManager.height;
    
    const stack: [number, number][] = [[startX, startY]];
    
    // Breadth-first search / Stack-based flood fill
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const currentColor = engine.getLayerPixel(layerIndex, x, y);
      if (currentColor !== targetColor) continue;

      // Fill current pixel without immediate texture update for performance
      engine.drawPixel(x, y, fillColor, false);

      // Add neighbors (4-way)
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }
}
