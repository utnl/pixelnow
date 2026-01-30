import * as PIXI from 'pixi.js';

export interface Layer {
    id: string;
    name: string;
    data: Uint32Array;
    texture: PIXI.Texture;
    sprite: PIXI.Sprite;
    buffer: Uint8ClampedArray;
    visible: boolean;
    locked: boolean;
}

export class LayerManager {
  private _width: number;
  private _height: number;
  public layers: Layer[] = [];
  public container: PIXI.Container;
  public activeLayerIndex: number = 0;

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
      this.activeLayerIndex = 0;
  }

  public addLayer(name: string = `Layer ${this.layers.length + 1}`): string {
    const id = Math.random().toString(36).substr(2, 9);
    
    const arrayBuffer = new ArrayBuffer(this.width * this.height * 4);
    const data = new Uint32Array(arrayBuffer);
    const buffer = new Uint8ClampedArray(arrayBuffer);

    const texture = PIXI.Texture.from({
        resource: buffer,
        width: this.width, 
        height: this.height,
        scaleMode: 'nearest'
    });

    const sprite = new PIXI.Sprite(texture);
    
    // Default active if first
    const layer: Layer = { 
        id, name, data, texture, sprite, buffer,
        visible: true,
        locked: false
    };
    
    // Add to TOP (end of array)
    this.layers.push(layer);
    this.container.addChild(sprite); // PIXI renders in order, so last child is on top
    
    // Set active to the new layer
    this.activeLayerIndex = this.layers.length - 1;

    return id;
  }

  public deleteActiveLayer() {
      // Don't delete the last layer
      if (this.layers.length <= 1) return;

      const layer = this.layers[this.activeLayerIndex];
      layer.sprite.destroy();
      layer.texture.destroy(true);
      
      this.layers.splice(this.activeLayerIndex, 1);
      
      // Update active index
      if (this.activeLayerIndex >= this.layers.length) {
          this.activeLayerIndex = this.layers.length - 1;
      }
      
      // Rebuild container children order
      this.rebuildContainer();
  }

  public setActiveLayer(index: number) {
      if (index >= 0 && index < this.layers.length) {
          this.activeLayerIndex = index;
      }
  }

  public toggleVisibility(index: number) {
      if (index >= 0 && index < this.layers.length) {
          const layer = this.layers[index];
          layer.visible = !layer.visible;
          layer.sprite.visible = layer.visible;
      }
  }

  public toggleAllVisibility() {
      // Logic: If any hidden -> Show all. Else -> Hide all.
      const anyHidden = this.layers.some(l => !l.visible);
      const newState = anyHidden;
      
      this.layers.forEach(l => {
          l.visible = newState;
          l.sprite.visible = newState;
      });
  }

  public duplicateLayer(index: number): string | null {
    if (index < 0 || index >= this.layers.length) return null;
    
    const sourceLayer = this.layers[index];
    const newId = Math.random().toString(36).substr(2, 9);
    // Auto name: "LayerName (Copy)"
    const newName = `${sourceLayer.name} (Copy)`;
    
    // Deep copy Buffer
    // sourceLayer.data.buffer refers to the underlying ArrayBuffer
    const newArrayBuffer = sourceLayer.data.buffer.slice(0); 
    const newData = new Uint32Array(newArrayBuffer);
    const newBuffer = new Uint8ClampedArray(newArrayBuffer);

    const newTexture = PIXI.Texture.from({
        resource: newBuffer,
        width: this.width, 
        height: this.height,
        scaleMode: 'nearest'
    });

    const newSprite = new PIXI.Sprite(newTexture);
    
    const newLayer: Layer = { 
        id: newId, 
        name: newName, 
        data: newData, 
        texture: newTexture, 
        sprite: newSprite, 
        buffer: newBuffer,
        visible: sourceLayer.visible,
        locked: false
    };
    
    // Insert RIGHT AFTER the source layer (on top of it)
    this.layers.splice(index + 1, 0, newLayer);
    
    // Rebuild container to correct draw order
    this.rebuildContainer();
    
    // Set active to new layer
    this.activeLayerIndex = index + 1;

    return newId;
  }

  public moveLayer(fromIndex: number, toIndex: number) {
      if (fromIndex < 0 || fromIndex >= this.layers.length || toIndex < 0 || toIndex >= this.layers.length) return;
      
      const layer = this.layers.splice(fromIndex, 1)[0];
      this.layers.splice(toIndex, 0, layer);
      
      // Update active index if we moved the active layer
      if (this.activeLayerIndex === fromIndex) {
          this.activeLayerIndex = toIndex;
      } else if (this.activeLayerIndex === toIndex) {
           // Complex logic, simpler to just let user re-select or keep it simple.
           // If we moved something else, we need to adjust activeIndex potentially.
           // Simplest: Find layer by ID later, for now simple logic:
      }
      
      // Re-find active layer by reference? No, index-based is tricky when moving.
      // Better strategy: Let UI re-set active layer ID. 
      // For now, let's just Rebuild container to reflect draw order.
      this.rebuildContainer();
  }

  private rebuildContainer() {
      this.container.removeChildren();
      this.layers.forEach(l => {
          this.container.addChild(l.sprite);
      });
  }

  public setPixel(layerIndex: number, x: number, y: number, color: number) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    
    // Use active layer if index is -1 (placeholder)
    const targetIndex = layerIndex === -1 ? this.activeLayerIndex : layerIndex;
    
    const layer = this.layers[targetIndex];
    if (!layer || !layer.visible || layer.locked) return;

    const idx = y * this.width + x;
    layer.data[idx] = color;
  }
  
  public updateLayer(layerIndex: number) { // Renamed from updateTexture to be consistent
      const targetIndex = layerIndex === -1 ? this.activeLayerIndex : layerIndex;
      const layer = this.layers[targetIndex];
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
              this.updateLayer(index);
          }
      });
  }
}
