import { PixelEngine } from '../PixelEngine';

export interface Tool {
  name: string;
  onDown(x: number, y: number, engine: PixelEngine): void;
  onMove(x: number, y: number, engine: PixelEngine): void;
  onUp(x: number, y: number, engine: PixelEngine): void;
}