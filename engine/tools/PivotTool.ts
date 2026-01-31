import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';
import * as PIXI from 'pixi.js';

export class PivotTool implements Tool {
    name = 'pivot';

    onDown(x: number, y: number, engine: PixelEngine, event?: PointerEvent) {
        this.updatePivot(x, y, engine);
    }

    onMove(x: number, y: number, engine: PixelEngine, event?: PointerEvent) {
        if (event?.buttons === 1) {
            this.updatePivot(x, y, engine);
        }
    }

    onUp() { }

    private updatePivot(x: number, y: number, engine: PixelEngine) {
        const node = engine.layerManager.activeNode;
        if (!node || node.id === 'root_node' || !node.parent) return;

        // 1. Get where the click is in the node's LOCAL space
        const localPos = node.toLocal(new PIXI.Point(x, y), engine.container);

        // 2. Get where the click is in the node's PARENT space
        const parentPos = node.parent.toLocal(new PIXI.Point(x, y), engine.container);

        // 3. Update pivot to localPos
        node.pivot.set(localPos.x, localPos.y);

        // 4. Update position to parentPos to compensate for pivot jump
        node.position.set(parentPos.x, parentPos.y);

        console.log(`[PivotTool] Setting pivot for ${node.name} to`, localPos);
    }
}
