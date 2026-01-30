import { PixelEngine } from '../PixelEngine';

export interface Tool {
  name: string;
  onDown(x: number, y: number, engine: PixelEngine, event?: PointerEvent): void;
  onMove(x: number, y: number, engine: PixelEngine, event?: PointerEvent): void;
  onUp(x: number, y: number, engine: PixelEngine, event?: PointerEvent): void;
}