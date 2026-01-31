import * as PIXI from 'pixi.js';
import { PixelEngine } from './PixelEngine';

export class CursorManager {
    private cursorGraphics: PIXI.Graphics;

    constructor(private engine: PixelEngine) {
        this.cursorGraphics = new PIXI.Graphics();
        this.cursorGraphics.zIndex = 20000; // Above everything, even Gizmos
        this.cursorGraphics.visible = false;
        console.log('[CursorManager] Initialized');
    }

    public init() {
        if (this.engine.app?.stage) {
            this.engine.app.stage.addChild(this.cursorGraphics);
        }
    }

    public update(x: number, y: number) { // x, y are in Canvas/Pixel coordinates
        const tool = this.engine.activeTool;
        if (!tool || (tool.name !== 'pencil' && tool.name !== 'eraser')) {
            this.cursorGraphics.visible = false;
            return;
        }

        this.cursorGraphics.visible = true;
        this.cursorGraphics.clear();

        const zoom = this.engine.cameraSystem.getZoom();
        const brushSize = this.engine.brushSize;

        // Convert Pixel coordinates to Screen coordinates
        // The input (x,y) from onPointerMove is already in "Local Container Space" (Pixel Space)
        // BUT we want to draw the cursor in "Screen Space" (Stage).

        // Let's get the global position of the pixel (x,y)
        const globalPos = this.engine.container.toGlobal(new PIXI.Point(x, y));

        // Calculate size in screen pixels
        // 1 pixel in world = 'zoom' pixels on screen
        const screenSize = brushSize * zoom;

        // Draw square cursor centered on the mouse
        // Note: Pixel coordinates are top-left based, so we centre it manually

        // If brushSize is 1, we want it exactly on the pixel grid.
        // If brushSize is > 1, we centre it around the logical brush center.

        // Align to pixel grid visually
        const halfSize = screenSize / 2;

        // Adjust for even/odd sizes if necessary, but centering on globalPos acts as the mouse tip
        // Usually brush draws centered on mouse. EraserTool logic:
        // const half = Math.floor(size / 2);
        // for (let dy = -half; dy < size - half; dy++) ...
        // So the range is [-half, size-half).
        // e.g size 3: floor(1.5)=1. Range [-1, 2) -> -1, 0, 1. Center at 0. Correct.
        // e.g size 2: floor(1)=1. Range [-1, 1) -> -1, 0. Center is between pixels? No, mouse is at 0.

        // To match EraserTool logic visually:
        // Top-left of the brush area in Local Space is (x - half, y - half)
        // Bottom-right is (x - half + size, y - half + size)

        const halfLocal = Math.floor(brushSize / 2);
        const tlLocal = new PIXI.Point(x - halfLocal, y - halfLocal);
        const brLocal = new PIXI.Point(x - halfLocal + brushSize, y - halfLocal + brushSize);

        const tlGlobal = this.engine.container.toGlobal(tlLocal);
        const brGlobal = this.engine.container.toGlobal(brLocal);

        const width = brGlobal.x - tlGlobal.x;
        const height = brGlobal.y - tlGlobal.y;

        this.cursorGraphics.rect(tlGlobal.x, tlGlobal.y, width, height);
        this.cursorGraphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.8 });

        // Add a subtle inner border for contrast on light backgrounds
        this.cursorGraphics.stroke({ color: 0x000000, width: 1, alpha: 0.5, alignment: 1 });
    }
}
