import { PixelEngine } from './PixelEngine';

export class FileManager {
  constructor(private engine: PixelEngine) {}

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
                this.engine.drawPixel(x, y, color, false);
              }
            }
          }
          
          this.engine.updateLayer(0);
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
}

