import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';
import * as PIXI from 'pixi.js';

export class RectangleTool implements Tool {
  name: string = 'rectangle';
  private startX: number = 0;
  private startY: number = 0;
  private previewGraphics: PIXI.Graphics | null = null;

  onDown(x: number, y: number, engine: PixelEngine): void {
    this.startX = x;
    this.startY = y;
    
    if (!this.previewGraphics) {
      this.previewGraphics = new PIXI.Graphics();
      engine.container.addChild(this.previewGraphics);
    }
  }

  onMove(x: number, y: number, engine: PixelEngine): void {
    if (!this.previewGraphics) return;

    this.previewGraphics.clear();
    
    const xmin = Math.min(this.startX, x);
    const ymin = Math.min(this.startY, y);
    const width = Math.abs(x - this.startX) + 1;
    const height = Math.abs(y - this.startY) + 1;

    // Draw preview border
    this.previewGraphics.rect(xmin, ymin, width, height);
    this.previewGraphics.stroke({ color: 0xffffff, width: 1 / engine.container.scale.x, alignment: 0 });
  }

  onUp(x: number, y: number, engine: PixelEngine): void {
    if (this.previewGraphics) {
      this.previewGraphics.clear();
      engine.container.removeChild(this.previewGraphics);
      this.previewGraphics = null;
    }

    const xmin = Math.min(this.startX, x);
    const ymin = Math.min(this.startY, y);
    const xmax = Math.max(this.startX, x);
    const ymax = Math.max(this.startY, y);

    // Draw the actual pixels on the layer manager
    // We only draw the outline for now
    for (let curX = xmin; curX <= xmax; curX++) {
      engine.drawPixel(curX, ymin, undefined, false);
      engine.drawPixel(curX, ymax, undefined, false);
    }
    for (let curY = ymin; curY <= ymax; curY++) {
      engine.drawPixel(xmin, curY, undefined, false);
      engine.drawPixel(xmax, curY, undefined, false);
    }

    engine.updateLayer(0);
  }
}
