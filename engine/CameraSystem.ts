import { PixelEngine } from './PixelEngine';

export class CameraSystem {
  private engine: PixelEngine;
  private zoomLevel = 1;
  private minZoom = 0.1;
  private maxZoom = 50;

  constructor(engine: PixelEngine) {
    this.engine = engine;
  }

  public setZoom(zoom: number) {
    this.zoomLevel = zoom;
    this.engine.container.scale.set(zoom);
  }

  public setPosition(x: number, y: number) {
    this.engine.container.position.set(x, y);
  }

  public getZoom() { return this.zoomLevel; }

  public zoom(delta: number, x: number, y: number) {
    const oldZoom = this.zoomLevel;
    let newZoom = oldZoom * (1 - delta * 0.001);
    newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom));

    const worldPos = { 
        x: (x - this.engine.container.x) / oldZoom, 
        y: (y - this.engine.container.y) / oldZoom 
    };
    
    this.engine.container.scale.set(newZoom);
    this.engine.container.position.set(
        x - worldPos.x * newZoom,
        y - worldPos.y * newZoom
    );
    
    this.zoomLevel = newZoom;
  }

  public pan(dx: number, dy: number) {
    this.engine.container.position.x += dx;
    this.engine.container.position.y += dy;
  }
}