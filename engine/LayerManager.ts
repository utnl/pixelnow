import * as PIXI from 'pixi.js';
import { BoneNode, LayerNode, PixelNode } from './SceneNodes';

export class LayerManager {
    private _width: number;
    private _height: number;
    public rootNode: BoneNode;
    public layers: LayerNode[] = []; // Still keeping a flat list for UI simplicity
    public activeLayerIndex: number = 0;
    public activeNodeId: string | null = null;

    constructor(width: number, height: number) {
        this._width = width;
        this._height = height;
        this.rootNode = new BoneNode('root_node', 'Root');
        this.activeNodeId = 'root_node';

        this.addLayer('Background');
    }

    public get container(): PIXI.Container {
        return this.rootNode;
    }

    public get width() { return this._width; }
    public get height() { return this._height; }


    public reset(width: number, height: number) {
        this._width = width;
        this._height = height;

        // Destroy all nodes
        this.layers.forEach(l => l.destroy());
        this.layers = [];

        this.rootNode.removeChildren();
        this.addLayer('Layer 1');
        this.activeLayerIndex = 0;
    }

    public addLayer(name: string = `Layer ${this.layers.length + 1}`): string {
        const id = Math.random().toString(36).substr(2, 9);
        const layer = new LayerNode(id, name, this.width, this.height);

        // Add to flat list and root node
        this.layers.push(layer);
        this.rootNode.addChild(layer);

        this.activeLayerIndex = this.layers.length - 1;
        this.activeNodeId = id;
        return id;
    }

    public addBone(name: string = 'New Bone', parentId?: string): string {
        const id = Math.random().toString(36).substr(2, 9);
        const bone = new BoneNode(id, name);

        const parent = parentId ? this.findNodeById(this.rootNode, parentId) : this.rootNode;
        if (parent) {
            parent.addChild(bone);
        } else {
            this.rootNode.addChild(bone);
        }

        return id;
    }

    public deleteActiveLayer() {
        if (this.layers.length <= 1) return;

        const layer = this.layers[this.activeLayerIndex];
        layer.destroy();

        this.layers.splice(this.activeLayerIndex, 1);

        if (this.activeLayerIndex >= this.layers.length) {
            this.activeLayerIndex = this.layers.length - 1;
        }
    }

    public setActiveLayer(index: number) {
        if (index >= 0 && index < this.layers.length) {
            this.activeLayerIndex = index;
            this.activeNodeId = this.layers[index].id;
        }
    }

    public setActiveNode(id: string) {
        this.activeNodeId = id;
        // If it's a layer, also update activeLayerIndex for backward compatibility
        const layerIdx = this.layers.findIndex(l => l.id === id);
        if (layerIdx !== -1) {
            this.activeLayerIndex = layerIdx;
        }
    }

    public get activeNode(): PixelNode | null {
        if (!this.activeNodeId) return null;
        return this.findNodeById(this.rootNode, this.activeNodeId);
    }

    public toggleVisibility(index: number) {
        if (index >= 0 && index < this.layers.length) {
            const layer = this.layers[index];
            layer.visible = !layer.visible;
        }
    }

    public toggleAllVisibility() {
        const anyHidden = this.layers.some(l => !l.visible);
        const newState = anyHidden;

        this.layers.forEach(l => {
            l.visible = newState;
        });
    }

    public duplicateLayer(index: number): string | null {
        if (index < 0 || index >= this.layers.length) return null;

        const sourceLayer = this.layers[index];
        const newId = Math.random().toString(36).substr(2, 9);
        const newName = `${sourceLayer.name} (Copy)`;

        const newLayer = new LayerNode(newId, newName, this.width, this.height, sourceLayer.data);
        newLayer.visible = sourceLayer.visible;

        // Copy transform
        newLayer.position.copyFrom(sourceLayer.position);
        newLayer.rotation = sourceLayer.rotation;
        newLayer.scale.copyFrom(sourceLayer.scale);
        newLayer.pivot.copyFrom(sourceLayer.pivot);

        this.layers.splice(index + 1, 0, newLayer);

        // Add to parent of source layer
        if (sourceLayer.parent) {
            sourceLayer.parent.addChildAt(newLayer, sourceLayer.parent.getChildIndex(sourceLayer) + 1);
        } else {
            this.rootNode.addChild(newLayer);
        }

        this.activeLayerIndex = index + 1;
        return newId;
    }

    public reparentNode(childId: string, parentId: string): boolean {
        const child = this.findNodeById(this.rootNode, childId);
        const parent = this.findNodeById(this.rootNode, parentId);

        if (!child || !parent) return false;
        if (child === parent) return false;

        // Check for circular dependency
        let curr: any = parent;
        while (curr) {
            if (curr === child) return false;
            curr = curr.parent;
        }

        // Preserve Global Position
        const globalPos = child.toGlobal(new PIXI.Point(0, 0));

        // Move
        parent.addChild(child);

        // Restore Position
        const newLocal = parent.toLocal(globalPos);
        child.position.set(newLocal.x, newLocal.y);

        return true;
    }

    public moveLayer(fromIndex: number, toIndex: number) {
        if (fromIndex < 0 || fromIndex >= this.layers.length || toIndex < 0 || toIndex >= this.layers.length) return;

        const layer = this.layers.splice(fromIndex, 1)[0];
        this.layers.splice(toIndex, 0, layer);

        if (this.activeLayerIndex === fromIndex) {
            this.activeLayerIndex = toIndex;
        }

        this.rebuildRootOrder();
    }

    private rebuildRootOrder() {
        // For now, this only works for flat layers at root level
        // In a full tree, we'd need more complex logic
        this.layers.forEach(l => {
            this.rootNode.addChild(l);
        });
    }

    public setPixel(layerIndex: number, x: number, y: number, color: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

        const targetIndex = layerIndex === -1 ? this.activeLayerIndex : layerIndex;
        const layer = this.layers[targetIndex];
        if (!layer || !layer.visible || layer.locked) return;

        const idx = y * this.width + x;
        layer.data[idx] = color;
    }

    public updateLayer(layerIndex: number) {
        const targetIndex = layerIndex === -1 ? this.activeLayerIndex : layerIndex;
        const layer = this.layers[targetIndex];
        if (layer) {
            layer.updateTexture();
        }
    }

    private findNodeById(root: PixelNode, id: string): PixelNode | null {
        if (root.id === id) return root;
        for (const child of root.children) {
            if (child instanceof PixelNode) {
                const found = this.findNodeById(child, id);
                if (found) return found;
            }
        }
        return null;
    }

    // --- History Support ---
    public getFullState(): Uint32Array[] {
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

    // --- UI Helpers ---
    public getFlattenedLayers(): { id: string, name: string, visible: boolean, active: boolean, parentId: string | null, depth: number }[] {
        const result: { id: string, name: string, visible: boolean, active: boolean, parentId: string | null, depth: number }[] = [];

        // Helper to find parent ID for root children (which is root_node)
        const rootId = 'root_node';

        const traverse = (node: PIXI.Container, depth: number) => {
            // Traverse backwards to show top-most layers first in UI list
            for (let i = node.children.length - 1; i >= 0; i--) {
                const child = node.children[i];
                // Check if it's our node type
                if ((child instanceof LayerNode || child instanceof BoneNode)) {
                    const pixelNode = child as PixelNode;
                    const isActive = this.activeNodeId === pixelNode.id;
                    // Determine parentId to expose to UI. 
                    // If parent is rootNode, we can say parentId is null (top level) or 'root_node'.
                    // Let's use 'root_node' if we want to be explicit, or null for root items.
                    // UI usually expects null for top level items.
                    const parentNode = node as PixelNode;
                    const pid = (node === this.rootNode) ? null : parentNode.id;

                    result.push({
                        id: pixelNode.id,
                        name: pixelNode.name,
                        visible: pixelNode.visible,
                        active: isActive,
                        parentId: pid,
                        depth: depth
                    });

                    // Recursive
                    if (child.children.length > 0) {
                        traverse(child, depth + 1);
                    }
                }
            }
        };

        traverse(this.rootNode, 0);
        return result;
    }

    public renameNode(id: string, newName: string) {
        const node = this.findNodeById(this.rootNode, id);
        if (node) {
            node.name = newName;
        }
    }
}
