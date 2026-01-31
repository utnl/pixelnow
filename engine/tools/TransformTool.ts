import { Tool } from './Tool';
import { PixelEngine } from '../PixelEngine';
import * as PIXI from 'pixi.js';

export class TransformTool implements Tool {
    name = 'transform';
    private isRotating: boolean = false;
    private lastPos: { x: number, y: number } | null = null;
    private startRotation: number = 0;
    private startMouseAngle: number = 0;

    onDown(x: number, y: number, engine: PixelEngine, event?: PointerEvent) {
        const node = engine.layerManager.activeNode;
        if (!node || node.id === 'root_node' || !node.parent) return;

        this.lastPos = { x, y };

        // Calculate Rotation Handle Position in Screen Space
        // Must match RiggingManager logic
        const handleLocal = new PIXI.Point(node.pivot.x, node.pivot.y - 50);
        const handleGlobal = node.toGlobal(handleLocal);

        // Mouse Position in Screen Space?
        // Wait, (x, y) passed to tool is usually Engine Canvas Local (offset from top-left of canvas).
        // node.toGlobal returns Global Screen/Stage coordinates.
        // Assuming engine.container is direct child of stage or root.
        // Let's use container.toLocal(handleGlobal) to get it in same space as x,y
        // OR better: handleGlobal IS relative to Stage.
        // The input x,y comes from processInput which uses e.global ?? No, input system converts to container local?
        // Checking InputSystem: localPos = this.engine.container.toLocal(e.global);
        // So x, y are Container Local Coordinates.

        const handleContainerPos = engine.container.toLocal(handleGlobal);

        // Distance Check
        const dist = Math.sqrt(Math.pow(x - handleContainerPos.x, 2) + Math.pow(y - handleContainerPos.y, 2));

        // Threshold 20px (generous hit area)
        // Also allow Shift key as fallback
        if (dist < 20 / engine.cameraSystem.getZoom() || event?.shiftKey) {
            this.isRotating = true;
            this.startRotation = node.rotation;

            // For rotation, we need angle relative to Pivot
            const pivotContainerPos = node.toLocal(node.pivot, engine.container); // Actually node.position is pivot in parent space usually if pivot is 0,0. 
            // Let's rely on node.parent.toLocal(mouse) to get mouse in parent space
            // Angle = atan2(mouseY - nodeY, mouseX - nodeX)

            const localPosInParent = node.parent.toLocal(new PIXI.Point(x, y), engine.container);
            this.startMouseAngle = Math.atan2(localPosInParent.y - node.y, localPosInParent.x - node.x);
        } else {
            this.isRotating = false;
        }
    }

    onMove(x: number, y: number, engine: PixelEngine, event?: PointerEvent) {
        const node = engine.layerManager.activeNode;
        if (!node || node.id === 'root_node' || !node.parent || !this.lastPos) return;

        if (this.isRotating) {
            // Rotate
            const localPosInParent = node.parent.toLocal(new PIXI.Point(x, y), engine.container);
            const currentAngle = Math.atan2(localPosInParent.y - node.y, localPosInParent.x - node.x);
            node.rotation = this.startRotation + (currentAngle - this.startMouseAngle);
        } else {
            // Move
            const dx = x - this.lastPos.x;
            const dy = y - this.lastPos.y;

            node.x += dx;
            node.y += dy;

            this.lastPos = { x, y };
        }
    }

    onUp() {
        this.lastPos = null;
    }
}
