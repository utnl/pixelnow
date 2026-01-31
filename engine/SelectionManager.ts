import * as PIXI from 'pixi.js';
import { PixelEngine } from './PixelEngine';

export interface SelectionArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type HandleType = 'tl' | 'tc' | 'tr' | 'mr' | 'br' | 'bc' | 'bl' | 'ml' | 'rot' | 'none';

export class SelectionManager {
  private activeSelection: SelectionArea | null = null;
  private marqueeGraphics: PIXI.Graphics;
  private handleGraphics: PIXI.Graphics;
  private floatingPixels: Uint32Array | null = null;
  private clipboard: { data: Uint32Array, width: number, height: number } | null = null;
  private previewSprite: PIXI.Sprite | null = null;
  private dashOffset: number = 0;
  public rotation: number = 0;
  private originalSize: { w: number, h: number } | null = null;

  constructor(private engine: PixelEngine) {
    this.marqueeGraphics = new PIXI.Graphics();
    this.handleGraphics = new PIXI.Graphics();

    this.engine.container.addChild(this.marqueeGraphics);
    this.engine.container.addChild(this.handleGraphics);
  }

  public initTicker() {
    let frameCount = 0;
    this.engine.app?.ticker.add(() => {
      if (this.activeSelection) {
        // Optimization: Redraw marquee only every 4th frame to save CPU
        // The visual difference is negligible for the marching ants effect
        frameCount++;
        if (frameCount % 4 === 0) {
          this.dashOffset = (this.dashOffset + 0.5) % 8; // Adjust speed due to frame skip
          this.drawMarquee();
        }
      }
    });
  }

  private syncStore() {
    if (this.engine.onSelectionChanged) {
      this.engine.onSelectionChanged(this.activeSelection);
    }
  }

  public getGraphics() { return this.marqueeGraphics; }
  public getHandleGraphics() { return this.handleGraphics; }

  public getActiveSelection(): SelectionArea | null {
    return this.activeSelection;
  }

  public setSelection(x: number, y: number, width: number, height: number) {
    this.activeSelection = { x, y, width, height };
    this.rotation = 0;
    this.drawMarquee();
    this.syncStore();
  }

  public async clearSelection() {
    console.log('[ClearSelection] Starting...');
    if (this.floatingPixels) {
      await this.commitSelection();
    }
    this.activeSelection = null;
    this.rotation = 0;
    this.marqueeGraphics.clear();
    this.handleGraphics.clear();
    this.removePreview();
    this.syncStore();
    console.log('[ClearSelection] Done.');
  }



  private removePreview() {
    if (this.previewSprite) {
      if (this.previewSprite.texture) this.previewSprite.texture.destroy(true);
      this.engine.container.removeChild(this.previewSprite);
      this.previewSprite = null;
    }
  }

  public isMovingSelection(): boolean {
    return this.floatingPixels !== null;
  }

  public isPointInside(x: number, y: number): boolean {
    if (!this.activeSelection) return false;
    const { x: sx, y: sy, width: w, height: h } = this.activeSelection;
    return x >= sx && x < sx + w && y >= sy && y < sy + h;
  }

  public startMoving() {
    console.log('[StartMoving] Called. activeSelection:', !!this.activeSelection, 'floatingPixels:', !!this.floatingPixels);

    if (!this.activeSelection) return;
    if (this.floatingPixels) return;

    const { x, y, width, height } = this.activeSelection;

    // Direct Active Layer Access Optimization
    const layer = this.engine.layerManager.activeNode as any; // Cast to access data if it's a layer
    if (!layer || !layer.data) return;

    this.floatingPixels = new Uint32Array(width * height);
    this.originalSize = { w: width, h: height };

    let pixelCount = 0;
    const layerData = layer.data;
    const layerW = this.engine.layerManager.width;

    // Batch Process
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const lx = x + dx;
        const ly = y + dy;
        const idx = ly * layerW + lx;

        // Bounds check
        if (lx >= 0 && lx < layerW && ly >= 0 && ly < this.engine.layerManager.height) {
          const color = layerData[idx];
          this.floatingPixels[dy * width + dx] = color;

          if ((color & 0xFF000000) !== 0) pixelCount++;

          // Clear source pixel (cut)
          layerData[idx] = 0;
        }
      }
    }

    // Single Update
    layer.updateTexture();
    this.createPreviewSprite();
    console.log('[StartMoving] Done! Lifted', pixelCount, 'pixels.');
  }



  private createPreviewSprite() {
    if (!this.activeSelection || !this.floatingPixels || !this.originalSize) return;
    const { width, height, x, y } = this.activeSelection;
    const { w: ow, h: oh } = this.originalSize;

    // Luôn tạo texture với kích thước GỐC
    if (!this.floatingPixels) return;
    const buffer = new Uint8ClampedArray(this.floatingPixels.buffer);
    const canvas = document.createElement('canvas');
    canvas.width = ow;
    canvas.height = oh;
    const ctx = canvas.getContext('2d')!;
    const imageData = new ImageData(buffer as any, ow, oh);
    ctx.putImageData(imageData, 0, 0);

    const texture = PIXI.Texture.from(canvas);
    texture.source.scaleMode = 'nearest';

    this.previewSprite = new PIXI.Sprite(texture);

    // Scale sprite để khớp với kích thước hiện tại
    this.previewSprite.scale.set(width / ow, height / oh);

    this.previewSprite.x = x;
    this.previewSprite.y = y;
    this.engine.container.addChild(this.previewSprite);
  }

  public async commitSelection() {
    if (!this.activeSelection || !this.floatingPixels || !this.originalSize) {
      this.floatingPixels = null;
      this.originalSize = null;
      return;
    }

    const { x, y, width, height } = this.activeSelection;
    const { w: ow, h: oh } = this.originalSize;

    // Tâm của vùng chọn hiện tại
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Scale factors
    const scaleX = width / ow;
    const scaleY = height / oh;

    // Tâm của hình gốc
    const ocx = ow / 2;
    const ocy = oh / 2;

    // Inverse rotation constants
    let rotation = -this.rotation;
    // Normalize angle
    const PI2 = Math.PI * 2;
    rotation = rotation % PI2;
    if (rotation < 0) rotation += PI2;

    // Snap to 90 degrees if very close (fix floating point errors)
    const snapThreshold = 0.01;
    if (Math.abs(rotation) < snapThreshold) rotation = 0;
    else if (Math.abs(rotation - Math.PI / 2) < snapThreshold) rotation = Math.PI / 2;
    else if (Math.abs(rotation - Math.PI) < snapThreshold) rotation = Math.PI;
    else if (Math.abs(rotation - 1.5 * Math.PI) < snapThreshold) rotation = 1.5 * Math.PI;

    let cosInv = Math.cos(rotation);
    let sinInv = Math.sin(rotation);

    // Force integer values for perfect 90-degree rotations
    if (Math.abs(cosInv) < 1e-10) cosInv = 0;
    if (Math.abs(sinInv) < 1e-10) sinInv = 0;
    if (Math.abs(Math.abs(cosInv) - 1) < 1e-10) cosInv = Math.sign(cosInv);
    if (Math.abs(Math.abs(sinInv) - 1) < 1e-10) sinInv = Math.sign(sinInv);

    // INVERSE MAPPING: Lặp qua từng pixel ĐÍCH và tìm pixel NGUỒN tương ứng
    // Đảm bảo mọi pixel đích đều có màu -> KHÔNG CÓ LỖ THỦNG
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        // Tọa độ world (tâm pixel)
        const worldX = x + dx;
        const worldY = y + dy;

        // Tọa độ tương đối so với tâm vùng chọn
        const relX = worldX + 0.5 - cx;
        const relY = worldY + 0.5 - cy;

        // Xoay ngược về hệ tọa độ gốc
        const unrotX = relX * cosInv - relY * sinInv;
        const unrotY = relX * sinInv + relY * cosInv;

        // Scale ngược về kích thước gốc và tìm tọa độ pixel nguồn gần nhất (Nearest Neighbor)
        // Sử dụng Math.round thay vì Math.floor để lấy mẫu chính xác hơn
        const srcX = Math.round(unrotX / scaleX + ocx - 0.5);
        const srcY = Math.round(unrotY / scaleY + ocy - 0.5);

        if (srcX >= 0 && srcX < ow && srcY >= 0 && srcY < oh) {
          const color = this.floatingPixels[srcY * ow + srcX];
          if ((color & 0xFF000000) !== 0) {
            this.engine.drawPixel(worldX, worldY, color, false);
          }
        }
      }
    }

    this.engine.updateLayer(-1);
    this.floatingPixels = null;
    this.originalSize = null;
    this.removePreview();
    this.engine.saveState();
  }






  public moveSelection(newX: number, newY: number) {
    if (!this.activeSelection) return;
    this.activeSelection.x = newX;
    this.activeSelection.y = newY;

    if (this.previewSprite) {
      if (this.rotation !== 0) {
        this.previewSprite.x = newX + this.activeSelection.width / 2;
        this.previewSprite.y = newY + this.activeSelection.height / 2;
      } else {
        this.previewSprite.x = newX;
        this.previewSprite.y = newY;
      }
    }

    this.drawMarquee();
    this.syncStore();
  }

  public resizeSelection(newX: number, newY: number, newW: number, newH: number) {
    if (!this.activeSelection) return;

    newW = Math.max(1, Math.round(newW));
    newH = Math.max(1, Math.round(newH));

    this.activeSelection = { x: newX, y: newY, width: newW, height: newH };

    if (this.previewSprite) {
      this.previewSprite.width = newW;
      this.previewSprite.height = newH;

      if (this.rotation !== 0) {
        this.previewSprite.x = newX + newW / 2;
        this.previewSprite.y = newY + newH / 2;
      } else {
        this.previewSprite.x = newX;
        this.previewSprite.y = newY;
      }
    }

    this.drawMarquee();
    this.syncStore();
  }

  public setRotation(radians: number) {
    this.rotation = radians;
    if (this.previewSprite && this.activeSelection) {
      this.previewSprite.rotation = radians;
      this.previewSprite.anchor.set(0.5);
      this.previewSprite.x = this.activeSelection.x + this.activeSelection.width / 2;
      this.previewSprite.y = this.activeSelection.y + this.activeSelection.height / 2;
    }
  }

  public copy() {
    if (!this.activeSelection) return;
    const { x, y, width, height } = this.activeSelection;

    const data = new Uint32Array(width * height);
    if (this.floatingPixels) {
      data.set(this.floatingPixels);
    } else {
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          data[dy * width + dx] = this.engine.getLayerPixel(-1, x + dx, y + dy);
        }
      }
    }

    this.clipboard = { data, width, height };
  }

  public paste() {
    if (!this.clipboard) return;

    this.commitSelection();

    const { data, width, height } = this.clipboard;
    this.activeSelection = { x: 0, y: 0, width, height };
    this.floatingPixels = new Uint32Array(data);
    this.originalSize = { w: width, h: height };

    this.createPreviewSprite();
    this.drawMarquee();
  }

  public deleteSelection() {
    if (!this.activeSelection) return;

    if (this.floatingPixels) {
      this.floatingPixels = null;
      this.removePreview();
    } else {
      const { x, y, width, height } = this.activeSelection;
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          this.engine.drawPixel(x + dx, y + dy, 0, false);
        }
      }
      this.engine.updateLayer(-1);
    }

    this.activeSelection = null;
    this.marqueeGraphics.clear();
    this.handleGraphics.clear();
    this.engine.saveState();
  }

  public flipHorizontal() {
    this.transformSelection((data, w, h) => {
      const newData = new Uint32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          newData[y * w + (w - 1 - x)] = data[y * w + x];
        }
      }
      return newData;
    });
  }

  public flipVertical() {
    this.transformSelection((data, w, h) => {
      const newData = new Uint32Array(w * h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          newData[(h - 1 - y) * w + x] = data[y * w + x];
        }
      }
      return newData;
    });
  }

  public rotate90() {
    if (!this.activeSelection) return;
    if (!this.floatingPixels) this.startMoving();
    if (!this.floatingPixels) return;

    const { width, height } = this.activeSelection;
    const newW = height;
    const newH = width;
    const rotatedData = new Uint32Array(newW * newH);

    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        const newX = height - 1 - dy;
        const newY = dx;
        rotatedData[newY * newW + newX] = this.floatingPixels[dy * width + dx];
      }
    }

    this.floatingPixels = rotatedData;
    this.activeSelection.width = newW;
    this.activeSelection.height = newH;
    this.originalSize = { w: newW, h: newH };

    this.removePreview();
    this.createPreviewSprite();
    this.drawMarquee();
  }

  private transformSelection(processor: (data: Uint32Array, w: number, h: number) => Uint32Array) {
    if (!this.activeSelection) return;
    if (!this.floatingPixels) this.startMoving();

    if (this.floatingPixels) {
      const { width, height } = this.activeSelection;
      this.floatingPixels = processor(this.floatingPixels, width, height);

      this.removePreview();
      this.createPreviewSprite();
      this.drawMarquee();
    }
  }

  private rotatePoint(px: number, py: number, cx: number, cy: number, angle: number) {
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    const x = px - cx;
    const y = py - cy;
    return {
      x: x * c - y * s + cx,
      y: x * s + y * c + cy
    };
  }

  private drawMarquee() {
    if (!this.activeSelection) return;

    const { x, y, width, height } = this.activeSelection;
    this.marqueeGraphics.clear();
    this.handleGraphics.clear();

    const scale = this.engine.container.scale.x;
    const invScale = 1 / scale;
    const offset = this.dashOffset * invScale;

    const cx = x + width / 2;
    const cy = y + height / 2;

    const tl = this.rotatePoint(x, y, cx, cy, this.rotation);
    const tr = this.rotatePoint(x + width, y, cx, cy, this.rotation);
    const br = this.rotatePoint(x + width, y + height, cx, cy, this.rotation);
    const bl = this.rotatePoint(x, y + height, cx, cy, this.rotation);

    const dashLength = 4 * invScale;
    const gapLength = 4 * invScale;

    // Vẽ khung nét đứt xoay
    this.drawDashedLine(tl.x, tl.y, tr.x, tr.y, dashLength, gapLength, offset);
    this.drawDashedLine(tr.x, tr.y, br.x, br.y, dashLength, gapLength, offset);
    this.drawDashedLine(br.x, br.y, bl.x, bl.y, dashLength, gapLength, offset);
    this.drawDashedLine(bl.x, bl.y, tl.x, tl.y, dashLength, gapLength, offset);
    this.marqueeGraphics.stroke({ width: 1.5 * invScale, color: 0xFFFFFF });

    // Vẽ 8 tay cầm co giãn (Handles)
    const handleSize = 7 * invScale;
    const midTop = this.rotatePoint(x + width / 2, y, cx, cy, this.rotation);
    const midRight = this.rotatePoint(x + width, y + height / 2, cx, cy, this.rotation);
    const midBottom = this.rotatePoint(x + width / 2, y + height, cx, cy, this.rotation);
    const midLeft = this.rotatePoint(x, y + height / 2, cx, cy, this.rotation);

    const handles = [tl, tr, br, bl, midTop, midRight, midBottom, midLeft];
    handles.forEach(p => this.drawHandle(p.x, p.y, handleSize));

    // Vẽ nút xoay (Rotation)
    this.drawRotationHandle(x, y, width, height, invScale, cx, cy);
  }

  private drawRotationHandle(x: number, y: number, w: number, h: number, invScale: number, cx: number, cy: number) {
    const rx = x + w / 2;
    const ry = y - 35 * invScale;

    const rotPos = this.rotatePoint(rx, ry, cx, cy, this.rotation);
    const midTop = this.rotatePoint(x + w / 2, y, cx, cy, this.rotation);

    // Đường nối mờ tinh tế
    this.handleGraphics.moveTo(midTop.x, midTop.y);
    this.handleGraphics.lineTo(rotPos.x, rotPos.y);
    this.handleGraphics.stroke({ color: 0xFFFFFF, width: 1 * invScale, alpha: 0.5 });

    // Vẽ icon xoay kiểu "Refresh" dày dặn hơn
    const radius = 10 * invScale;

    // Thân mũi tên (vòng cung dày)
    this.handleGraphics.arc(rotPos.x, rotPos.y, radius, -Math.PI / 4, Math.PI * 5 / 4);
    this.handleGraphics.stroke({ color: 0x00AAFF, width: 4 * invScale });

    // Đầu mũi tên to rõ
    const arrowX = rotPos.x + Math.cos(Math.PI * 5 / 4) * radius;
    const arrowY = rotPos.y + Math.sin(Math.PI * 5 / 4) * radius;

    this.handleGraphics.moveTo(arrowX, arrowY);
    this.handleGraphics.lineTo(arrowX + 8 * invScale, arrowY - 2 * invScale);
    this.handleGraphics.lineTo(arrowX - 2 * invScale, arrowY + 8 * invScale);
    this.handleGraphics.fill(0x00AAFF);

    // Viền trắng cho icon nổi bật trên nền tối
    this.handleGraphics.arc(rotPos.x, rotPos.y, radius + 2 * invScale, -Math.PI / 4, Math.PI * 5 / 4);
    this.handleGraphics.stroke({ color: 0xFFFFFF, width: 1 * invScale, alpha: 0.5 });

    // Hit area tàng hình siêu rộng
    this.handleGraphics.circle(rotPos.x, rotPos.y, 22 * invScale);
    this.handleGraphics.fill({ color: 0xFFFFFF, alpha: 0.001 });
  }

  private drawDashedLine(x1: number, y1: number, x2: number, y2: number, dashLength: number, gapLength: number, offset: number) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let currentLength = -offset;
    let isDash = true;

    while (currentLength < length) {
      const segmentLength = isDash ? dashLength : gapLength;
      const startDist = Math.max(0, currentLength);
      const endDist = Math.min(length, currentLength + segmentLength);

      if (isDash && endDist > startDist) {
        const sx = x1 + startDist * cos;
        const sy = y1 + startDist * sin;
        const ex = x1 + endDist * cos;
        const ey = y1 + endDist * sin;
        this.marqueeGraphics.moveTo(sx, sy);
        this.marqueeGraphics.lineTo(ex, ey);
      }

      currentLength += segmentLength;
      isDash = !isDash;
    }
  }

  private drawHandle(x: number, y: number, size: number) {
    // White border
    this.handleGraphics.rect(x - size / 2, y - size / 2, size, size);
    this.handleGraphics.fill(0xFFFFFF);

    // Blue center
    const innerSize = size - 2;
    this.handleGraphics.rect(x - innerSize / 2, y - innerSize / 2, innerSize, innerSize);
    this.handleGraphics.fill(0x00AAFF);
  }

  public getHandleAt(x: number, y: number): HandleType {
    if (!this.activeSelection) return 'none';

    const { x: sx, y: sy, width: sw, height: sh } = this.activeSelection;
    const scale = this.engine.container.scale.x;

    // Tọa độ tâm
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;

    // XOAY NGƯỢC tọa độ chuột về hệ quy chiếu chưa xoay để kiểm tra va chạm
    const localMouse = this.rotatePoint(x, y, cx, cy, -this.rotation);
    const lx = localMouse.x;
    const ly = localMouse.y;

    const threshold = 15 / scale;

    const check = (hx: number, hy: number) => {
      return Math.abs(lx - hx) <= threshold && Math.abs(ly - hy) <= threshold;
    };

    // Check rotation handle (Khớp chính xác với vị trí 35px đã vẽ)
    const rotX = sx + sw / 2;
    const rotY = sy - 35 / scale;
    const distRot = Math.sqrt(Math.pow(lx - rotX, 2) + Math.pow(ly - rotY, 2));

    // Tăng vùng nhận diện lên 30px để cực kỳ dễ nhấn
    if (distRot <= 30 / scale) {
      return 'rot';
    }

    // Check corners
    if (check(sx, sy)) return 'tl';
    if (check(sx + sw, sy)) return 'tr';
    if (check(sx + sw, sy + sh)) return 'br';
    if (check(sx, sy + sh)) return 'bl';

    // Then edges
    if (check(sx + sw / 2, sy)) return 'tc';
    if (check(sx + sw, sy + sh / 2)) return 'mr';
    if (check(sx + sw / 2, sy + sh)) return 'bc';
    if (check(sx, sy + sh / 2)) return 'ml';

    return 'none';
  }

  public isOverRotationHandle(x: number, y: number): boolean {
    return this.getHandleAt(x, y) === 'rot';
  }
}
