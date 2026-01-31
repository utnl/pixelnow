import * as PIXI from 'pixi.js';

export enum NodeType {
    BONE = 'bone',
    LAYER = 'layer'
}

export abstract class PixelNode extends PIXI.Container {
    public id: string;
    public name: string;
    public abstract readonly type: NodeType;

    constructor(id: string, name: string) {
        super();
        this.id = id;
        this.name = name;
    }

    // Common properties can be accessed via PIXI.Container (x, y, rotation, scale, pivot)
}

export class BoneNode extends PixelNode {
    public readonly type = NodeType.BONE;

    constructor(id: string, name: string = 'New Bone') {
        super(id, name);
    }
}

export class LayerNode extends PixelNode {
    public readonly type = NodeType.LAYER;

    public data: Uint32Array;
    public texture: PIXI.Texture;
    public sprite: PIXI.Sprite;
    public buffer: Uint8ClampedArray;
    public locked: boolean = false;

    constructor(id: string, name: string, width: number, height: number, existingData?: Uint32Array) {
        super(id, name);

        const arrayBuffer = existingData ? existingData.buffer.slice(0) : new ArrayBuffer(width * height * 4);
        this.data = new Uint32Array(arrayBuffer);
        this.buffer = new Uint8ClampedArray(arrayBuffer);

        this.texture = PIXI.Texture.from({
            resource: this.buffer,
            width: width,
            height: height,
            scaleMode: 'nearest'
        });

        this.sprite = new PIXI.Sprite(this.texture);
        this.addChild(this.sprite);
    }

    public updateTexture() {
        if (this.texture.source) {
            this.texture.source.update();
        }
    }

    public destroy(options?: any) {
        this.texture.destroy(true);
        super.destroy(options);
    }
}
