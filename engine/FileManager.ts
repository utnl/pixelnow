import { PixelEngine } from './PixelEngine';

export class FileManager {
  constructor(private engine: PixelEngine) { }

  private get width() { return this.engine.layerManager.width; }
  private get height() { return this.engine.layerManager.height; }

  /**
   * Mở dialog chọn file và import vào canvas
   */
  public async importImage(): Promise<boolean> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/png, image/gif, image/bmp, image/jpeg, image/webp';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(false);
          return;
        }

        try {
          await this.loadImageFile(file);
          resolve(true);
        } catch (error) {
          console.error('[FileManager] Import failed:', error);
          resolve(false);
        }
      };

      input.click();
    });
  }

  /**
   * Load file ảnh và vẽ vào canvas
   */
  private async loadImageFile(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          // 1. Resize Project to fit image
          this.engine.resizeProject(img.width, img.height);

          if (this.engine.onCanvasSizeChanged) {
            this.engine.onCanvasSizeChanged(img.width, img.height);
          }

          // Tạo canvas tạm để lấy pixel data
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const data = imageData.data;

          // Vẽ từng pixel vào engine
          for (let y = 0; y < img.height; y++) {
            for (let x = 0; x < img.width; x++) {
              const i = (y * img.width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const a = data[i + 3];

              const color = (a << 24) | (b << 16) | (g << 8) | r;

              if (a > 0) {
                this.engine.setPixelRaw(x, y, color, -1);
              }
            }
          }

          this.engine.updateLayer(-1);
          this.engine.saveState();

          console.log(`[FileManager] Imported ${file.name} (${img.width}x${img.height}) and resized canvas`);
          resolve();
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Export canvas thành PNG
   */
  public exportPNG(filename: string = 'pixel-art.png'): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d')!;

    const imageData = ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.engine.getLayerPixel(0, x, y);
        const i = (y * this.width + x) * 4;

        // ABGR -> RGBA
        data[i] = color & 0xFF;             // R
        data[i + 1] = (color >> 8) & 0xFF;  // G
        data[i + 2] = (color >> 16) & 0xFF; // B
        data[i + 3] = (color >> 24) & 0xFF; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Download
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();

    console.log(`[FileManager] Exported ${filename}`);
  }

  /**
   * Export Animation Data (JSON) for Game Engines
   */
  public exportJSON(filename: string = 'animation-data.json'): void {
    const animMgr = this.engine.animationManager;
    const layerMgr = this.engine.layerManager;

    // 1. Build Hierarchy
    const hierarchy: any[] = [];
    const traverse = (node: any, parentId: string | null) => {
      if (node.id !== 'root_node') {
        hierarchy.push({
          id: node.id,
          name: node.name,
          parentId: parentId
        });
      }
      if (node.children) {
        node.children.forEach((child: any) => {
          if (child.id) traverse(child, node.id === 'root_node' ? null : node.id);
        });
      }
    };
    traverse(layerMgr.rootNode, null);

    // 2. Build Frames
    const frames = animMgr.frames.map(f => {
      const frameData: any = {
        duration: f.duration,
        transform: {}
      };

      // Convert Map to Object
      f.nodeTransforms.forEach((val, key) => {
        frameData.transform[key] = {
          x: Number(val.x.toFixed(2)),
          y: Number(val.y.toFixed(2)),
          r: Number(val.rotation.toFixed(4)), // Rotation in radians needed for engines
          sx: Number(val.scaleX.toFixed(2)),
          sy: Number(val.scaleY.toFixed(2)),
          // Pivot is crucial for skeletal animation recovery
          px: Number(val.pivotX.toFixed(2)),
          py: Number(val.pivotY.toFixed(2))
        };
      });
      return frameData;
    });

    const exportData = {
      meta: {
        app: "PixelNow",
        version: "1.0",
        fps: 10, // Should retrieve from AnimationManager
        resolution: { w: this.width, h: this.height }
      },
      hierarchy: hierarchy,
      animations: {
        default: frames
      }
    };

    // Download JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataStr;
    link.click();

    console.log(`[FileManager] Exported JSON ${filename}`);
  }
}

