import * as PIXI from 'pixi.js';
import { PixelEngine } from './PixelEngine';
import { PixelNode } from './SceneNodes';

export class RiggingManager {
    private gizmoGraphics: PIXI.Graphics;

    constructor(private engine: PixelEngine) {
        this.gizmoGraphics = new PIXI.Graphics();
        console.log('[RiggingManager] Initialized');
    }

    public init() {
        // Add to stage after app is ready, not container
        if (this.engine.app?.stage) {
            this.engine.app.stage.addChild(this.gizmoGraphics);
            console.log('[RiggingManager] Added gizmo to stage');
        }
    }

    public update() {
        this.gizmoGraphics.clear();

        const tool = this.engine.activeTool.name;
        const activeNode = this.engine.layerManager.activeNode;

        // Only show pivot gizmo for relevant tools
        if (tool !== 'pivot' && tool !== 'transform') return;

        if (!activeNode || activeNode.id === 'root_node') return;

        this.drawPivot(activeNode);
    }

    private drawPivot(node: PixelNode) {
        // Pivot is at node.pivot in local space
        // We want to draw it in SCREEN space (stage)
        const pivotGlobal = node.toGlobal(node.pivot);
        const radius = 6; // Smaller radius

        // Rotation Handle Position (50px above pivot in local space)
        // We need to account for node rotation/scale
        const handleLocal = new PIXI.Point(node.pivot.x, node.pivot.y - 50);
        const handleGlobal = node.toGlobal(handleLocal);

        // --- Draw Rotation Gizmo (Line + Knob) ---
        if (this.engine.activeTool.name === 'transform') {
            // Connector Line
            this.gizmoGraphics.moveTo(pivotGlobal.x, pivotGlobal.y);
            this.gizmoGraphics.lineTo(handleGlobal.x, handleGlobal.y);
            this.gizmoGraphics.stroke({ color: 0xFFFFFF, width: 1 });

            // Knob
            this.gizmoGraphics.circle(handleGlobal.x, handleGlobal.y, 6);
            this.gizmoGraphics.fill(0x00AAFF); // Blue knob
            this.gizmoGraphics.stroke({ color: 0xFFFFFF, width: 2 });

            // Hit Area Hint (Visual only, Logic is in TransformTool)
        }

        // --- Draw Pivot (Target Icon) ---
        // Outer Shadow
        this.gizmoGraphics.circle(pivotGlobal.x, pivotGlobal.y, radius + 2);
        this.gizmoGraphics.stroke({ color: 0x000000, width: 2, alpha: 0.5 });

        // Circle
        this.gizmoGraphics.circle(pivotGlobal.x, pivotGlobal.y, radius);
        this.gizmoGraphics.stroke({ color: 0xFFFFFF, width: 2 });

        // Dot
        this.gizmoGraphics.circle(pivotGlobal.x, pivotGlobal.y, 2);
        this.gizmoGraphics.fill(0xFFFF00);
    }
}
