import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class PencilTool implements Tool {
  name = 'pencil';
  
  onDown(x: number, y: number, engine: PixelEngine) {
    engine.drawPixel(x, y);
  }
  
  onMove(x: number, y: number, engine: PixelEngine) {
    engine.drawPixel(x, y);
  }
  
  onUp() {}
}