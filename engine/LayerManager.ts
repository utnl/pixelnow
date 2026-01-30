import * as PIXI from 'pixi.js';

export interface Layer {
    id: string;
    name: string;
    data: Uint32Array;
    texture: PIXI.Texture;
    sprite: PIXI.Sprite;
    buffer: Uint8ClampedArray;
}

export class LayerManager {
  private _width: number;
  private _height: number;
  public layers: Layer[] = [];
  public container: PIXI.Container;

  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
    this.container = new PIXI.Container();
    
    this.addLayer('Background');
  }

  public get width() { return this._width; }
  public get height() { return this._height; }


  public reset(width: number, height: number) {
      this._width = width;
      this._height = height;
      this.layers.forEach(l => {
          l.sprite.destroy();
          l.texture.destroy(true);
      });
      this.layers = [];
      this.container.removeChildren();
      this.addLayer('Layer 1');
  }


  public addLayer(name: string): string {
    const id = Math.random().toString(36).substr(2, 9);
    
    // Create a shared buffer for both Uint32 and Uint8 accessibility
    const arrayBuffer = new ArrayBuffer(this.width * this.height * 4);
    const data = new Uint32Array(arrayBuffer);
    const buffer = new Uint8ClampedArray(arrayBuffer);

    // Initialize with transparent or background color if needed
    // For now, let's keep it transparent (all zeros)

    const texture = PIXI.Texture.from({
        resource: buffer,
        width: this.width, 
        height: this.height,
        scaleMode: 'nearest'
    });

    const sprite = new PIXI.Sprite(texture);
    
    const layer: Layer = { id, name, data, texture, sprite, buffer };
    
    this.layers.push(layer);
    this.container.addChild(sprite);

    return id;
  }

  public setPixel(layerIndex: number, x: number, y: number, color: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    const layer = this.layers[layerIndex];
    if (!layer) return;

    const idx = y * this.width + x;
    
    // Setting the Uint32 value (color) automatically updates the 
    // underlying Uint8 bytes in the shared ArrayBuffer.
    // Format expected: 0xAABBGGRR (Little Endian)
    layer.data[idx] = color;
  }
  
  public updateTexture(layerIndex: number) {
      const layer = this.layers[layerIndex];
      if (layer && layer.texture.source) {
          layer.texture.source.update();
      }
  }

  // --- History Support ---
  public getFullState(): Uint32Array[] {
      // Create copies of the data for each layer
      return this.layers.map(layer => new Uint32Array(layer.data));
  }

  public restoreFullState(state: Uint32Array[]) {
      state.forEach((layerData, index) => {
          if (this.layers[index]) {
              this.layers[index].data.set(layerData);
              this.updateTexture(index);
          }
      });
  }
}
