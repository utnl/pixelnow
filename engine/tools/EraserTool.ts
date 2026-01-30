import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';

export class EraserTool implements Tool {
  name = 'eraser';
  
  onDown(x: number, y: number, engine: PixelEngine) {
    engine.drawPixel(x, y, 0x00000000);
  }
  
  onMove(x: number, y: number, engine: PixelEngine) {
    engine.drawPixel(x, y, 0x00000000);
  }
  
  onUp() {}
}