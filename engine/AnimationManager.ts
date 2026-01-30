import { PixelEngine } from './PixelEngine';

export interface Frame {
    id: string;
    // Map layerId -> Pixel Data
    layerData: Map<string, Uint32Array>;
    // Map layerId -> Visibility
    layerVisibility: Map<string, boolean>;
    duration: number; // ms, default 100ms
}

export class AnimationManager {
    public frames: Frame[] = [];
    public currentFrameIndex: number = 0;
    public isPlaying: boolean = false;
    private playInterval: any = null;
    private fps: number = 10; // 12 FPS standard for pixel art

    constructor(private engine: PixelEngine) {
        // Init with 1 empty frame and empty map
        this.frames.push({
            id: Math.random().toString(36).substr(2, 9),
            layerData: new Map(),
            layerVisibility: new Map(),
            duration: 100
        });
    }

    public getCurrentFrame(): Frame {
        return this.frames[this.currentFrameIndex];
    }

    public saveCurrentFrameState() {
        // Save current layer pixel data AND visibility into the current frame
        const currentFrame = this.frames[this.currentFrameIndex];
        
        this.engine.layerManager.layers.forEach(layer => {
            // Data
            const savedData = new Uint32Array(layer.data);
            currentFrame.layerData.set(layer.id, savedData);
            
            // Metadata (Visibility)
            currentFrame.layerVisibility.set(layer.id, layer.visible);
        });
    }

    public loadFrame(index: number) {
        if (index < 0 || index >= this.frames.length) return;
        
        // Save current state before switching?
        if (!this.isPlaying) {
             this.saveCurrentFrameState();
        }

        this.currentFrameIndex = index;
        const targetFrame = this.frames[index];

        // Restore pixel data AND visibility to layers
        this.engine.layerManager.layers.forEach(layer => {
            const savedData = targetFrame.layerData.get(layer.id);
            const savedVisible = targetFrame.layerVisibility.get(layer.id);

            // Data Restore
            if (savedData) {
                 layer.data.set(savedData);
            } else {
                layer.data.fill(0);
            }
            
            // Visibility Restore
            const isVisible = savedVisible !== undefined ? savedVisible : true; // Default true if undefined
            layer.visible = isVisible;
            layer.sprite.visible = isVisible;

            // Texture Update
            layer.texture.source.update();
        });
        
        // Notify UI
        if (this.engine.onFrameChanged) this.engine.onFrameChanged(this.currentFrameIndex, this.frames.length);
    }

    public addFrame(duplicate: boolean = true) {
        this.saveCurrentFrameState();

        const newId = Math.random().toString(36).substr(2, 9);
        const newLayerData = new Map<string, Uint32Array>();
        const newLayerVisibility = new Map<string, boolean>();

        if (duplicate) {
            // Copy data from current frame
            const currentFrame = this.frames[this.currentFrameIndex];
            
            currentFrame.layerData.forEach((data, layerId) => {
                newLayerData.set(layerId, new Uint32Array(data));
            });
            
            currentFrame.layerVisibility.forEach((vis, layerId) => {
                newLayerVisibility.set(layerId, vis);
            });

        } else {
            // Empty frame
            this.engine.layerManager.layers.forEach(layer => {
                 newLayerData.set(layer.id, new Uint32Array(layer.data.length));
                 newLayerVisibility.set(layer.id, true); // Visible by default for new empty frame? Or inherit?
                 // Let's inherit visibility actually, usually better workflow
                 // but "Add Frame" usually implies Blank Slate, so visible = true is safe.
            });
        }

        const newFrame: Frame = {
            id: newId,
            layerData: newLayerData,
            layerVisibility: newLayerVisibility,
            duration: 100
        };

        // Insert after current
        this.frames.splice(this.currentFrameIndex + 1, 0, newFrame);
        
        // Switch to new frame
        this.loadFrame(this.currentFrameIndex + 1);
    }
    
    public deleteCurrentFrame() {
        if (this.frames.length <= 1) return; 
        
        this.frames.splice(this.currentFrameIndex, 1);
        
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
        }
        
        this.loadFrame(this.currentFrameIndex);
    }

    public play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.saveCurrentFrameState();

        this.playInterval = setInterval(() => {
            let nextFrame = this.currentFrameIndex + 1;
            if (nextFrame >= this.frames.length) {
                nextFrame = 0; 
            }
            this.loadFrame(nextFrame);
        }, 1000 / this.fps);
    }

    public stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        clearInterval(this.playInterval);
        this.playInterval = null;
    }

    public togglePlay() {
        if (this.isPlaying) this.stop();
        else this.play();
    }
}
