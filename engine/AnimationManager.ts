import { PixelEngine } from './PixelEngine';
import { PixelNode } from './SceneNodes';

export interface NodeTransform {
    x: number;
    y: number;
    rotation: number;
    scaleX: number;
    scaleY: number;
    pivotX: number;
    pivotY: number;
}

export enum EasingType {
    Linear = 'Linear',
    EaseInQuad = 'EaseInQuad',
    EaseOutQuad = 'EaseOutQuad',
    EaseInOutQuad = 'EaseInOutQuad',
    BounceOut = 'BounceOut'
}

export interface Frame {
    id: string;
    // Map nodeIds -> Pixel Data (only for layers)
    layerData: Map<string, Uint32Array>;
    // Map nodeIds -> Visibility
    layerVisibility: Map<string, boolean>;
    // Map nodeIds -> Transforms (for layers and bones)
    nodeTransforms: Map<string, NodeTransform>;
    duration: number; // ms, default 100ms
    easing?: EasingType;
}

export class AnimationManager {
    public frames: Frame[] = [];
    public currentFrameIndex: number = 0;
    public isPlaying: boolean = false;
    public enableTweening: boolean = true;

    private accumulatedTime: number = 0;
    private fps: number = 10;

    constructor(private engine: PixelEngine) {
        this.frames.push({
            id: Math.random().toString(36).substr(2, 9),
            layerData: new Map(),
            layerVisibility: new Map(),
            nodeTransforms: new Map(),
            duration: 100,
            easing: EasingType.Linear
        });
    }

    public getCurrentFrame(): Frame {
        return this.frames[this.currentFrameIndex];
    }

    public update(deltaTimeMS: number) {
        if (!this.isPlaying || this.frames.length <= 1) return;

        const currentFrame = this.frames[this.currentFrameIndex];
        const frameDuration = currentFrame.duration || (1000 / this.fps);

        this.accumulatedTime += deltaTimeMS;

        if (this.accumulatedTime >= frameDuration) {
            // Move to next frame
            this.accumulatedTime -= frameDuration;
            const nextIndex = (this.currentFrameIndex + 1) % this.frames.length;
            this.loadFrame(nextIndex, true);
        }

        if (this.enableTweening) {
            this.applyInterpolatedTransforms();
        }
    }

    private applyInterpolatedTransforms() {
        const frameA = this.frames[this.currentFrameIndex];
        const nextIndex = (this.currentFrameIndex + 1) % this.frames.length;
        const frameB = this.frames[nextIndex];

        const frameDuration = frameA.duration || (1000 / this.fps);
        let linearT = this.accumulatedTime / frameDuration;
        linearT = Math.max(0, Math.min(1, linearT)); // Clamp

        // Apply Easing
        const easedT = this.applyEasing(linearT, frameA.easing || EasingType.Linear);

        this.traverseNodes(this.engine.layerManager.rootNode, (node) => {
            const transA = frameA.nodeTransforms.get(node.id);
            const transB = frameB.nodeTransforms.get(node.id);

            if (transA && transB) {
                // Interpolate all properties with easedT
                node.x = this.lerp(transA.x, transB.x, easedT);
                node.y = this.lerp(transA.y, transB.y, easedT);

                // Rotation lerp
                // Handle rotation wrapping for shortest path?
                // For now simple lerp is enough for simple swings
                node.rotation = this.lerp(transA.rotation, transB.rotation, easedT);

                node.scale.set(
                    this.lerp(transA.scaleX, transB.scaleX, easedT),
                    this.lerp(transA.scaleY, transB.scaleY, easedT)
                );
                node.pivot.set(
                    this.lerp(transA.pivotX, transB.pivotX, easedT),
                    this.lerp(transA.pivotY, transB.pivotY, easedT)
                );
            }
        });
    }

    private applyEasing(t: number, type: EasingType): number {
        switch (type) {
            case EasingType.EaseInQuad: return t * t;
            case EasingType.EaseOutQuad: return t * (2 - t);
            case EasingType.EaseInOutQuad: return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            case EasingType.BounceOut:
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) {
                    return n1 * t * t;
                } else if (t < 2 / d1) {
                    return n1 * (t -= 1.5 / d1) * t + 0.75;
                } else if (t < 2.5 / d1) {
                    return n1 * (t -= 2.25 / d1) * t + 0.9375;
                } else {
                    return n1 * (t -= 2.625 / d1) * t + 0.984375;
                }
            case EasingType.Linear:
            default: return t;
        }
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }

    public saveCurrentFrameState() {
        const currentFrame = this.frames[this.currentFrameIndex];

        this.traverseNodes(this.engine.layerManager.rootNode, (node) => {
            currentFrame.nodeTransforms.set(node.id, {
                x: node.x,
                y: node.y,
                rotation: node.rotation,
                scaleX: node.scale.x,
                scaleY: node.scale.y,
                pivotX: node.pivot.x,
                pivotY: node.pivot.y
            });

            if ('data' in node) {
                const layer = node as any;
                currentFrame.layerData.set(layer.id, new Uint32Array(layer.data));
                currentFrame.layerVisibility.set(layer.id, layer.visible);
            }
        });
    }

    public loadFrame(index: number, isAutoPlay: boolean = false) {
        if (index < 0 || index >= this.frames.length) return;

        if (!this.isPlaying && !isAutoPlay) {
            this.saveCurrentFrameState();
        }

        this.currentFrameIndex = index;
        const targetFrame = this.frames[index];

        this.traverseNodes(this.engine.layerManager.rootNode, (node) => {
            const transform = targetFrame.nodeTransforms.get(node.id);

            if (transform) {
                node.x = transform.x;
                node.y = transform.y;
                node.rotation = transform.rotation;
                node.scale.set(transform.scaleX, transform.scaleY);
                node.pivot.set(transform.pivotX, transform.pivotY);
            }

            if ('data' in node) {
                const layer = node as any;
                const savedData = targetFrame.layerData.get(layer.id);
                const savedVisible = targetFrame.layerVisibility.get(layer.id);

                if (savedData) {
                    layer.data.set(savedData);
                }

                const isVisible = savedVisible !== undefined ? savedVisible : true;
                layer.visible = isVisible;
                layer.updateTexture();
            }
        });

        if (this.engine.onFrameChanged) this.engine.onFrameChanged(this.currentFrameIndex, this.frames.length);
    }

    private traverseNodes(root: PixelNode, callback: (node: PixelNode) => void) {
        callback(root);
        root.children.forEach(child => {
            if (child instanceof PixelNode) {
                this.traverseNodes(child, callback);
            }
        });
    }

    public addFrame(duplicate: boolean = true) {
        this.saveCurrentFrameState();

        const newId = Math.random().toString(36).substr(2, 9);
        const newLayerData = new Map<string, Uint32Array>();
        const newLayerVisibility = new Map<string, boolean>();
        const newNodeTransforms = new Map<string, NodeTransform>();

        if (duplicate) {
            const currentFrame = this.frames[this.currentFrameIndex];

            currentFrame.layerData.forEach((data, id) => {
                newLayerData.set(id, new Uint32Array(data));
            });

            currentFrame.layerVisibility.forEach((vis, id) => {
                newLayerVisibility.set(id, vis);
            });

            currentFrame.nodeTransforms.forEach((trans, id) => {
                newNodeTransforms.set(id, { ...trans });
            });

        } else {
            this.traverseNodes(this.engine.layerManager.rootNode, (node) => {
                newNodeTransforms.set(node.id, {
                    x: node.x, y: node.y, rotation: node.rotation,
                    scaleX: node.scale.x, scaleY: node.scale.y,
                    pivotX: node.pivot.x, pivotY: node.pivot.y
                });

                if ('data' in node) {
                    const layer = node as any;
                    newLayerData.set(layer.id, new Uint32Array(layer.data.length));
                    newLayerVisibility.set(layer.id, true);
                }
            });
        }

        const newFrame: Frame = {
            id: newId,
            layerData: newLayerData,
            layerVisibility: newLayerVisibility,
            nodeTransforms: newNodeTransforms,
            duration: 100
        };

        this.frames.splice(this.currentFrameIndex + 1, 0, newFrame);
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
        this.accumulatedTime = 0;
        this.saveCurrentFrameState();
    }

    public stop() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        this.loadFrame(this.currentFrameIndex); // Snap back to nearest frame
    }

    public togglePlay() {
        if (this.isPlaying) this.stop();
        else this.play();
    }
}
