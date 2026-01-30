export class ColorUtils {
  /**
   * Converts R, G, B, A (0-255) to a 32-bit integer in AABBGGRR format (Little Endian).
   */
  static rgbaToUint32(r: number, g: number, b: number, a: number = 255): number {
    return ((a << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }

  /**
   * Converts a 32-bit AABBGGRR integer to CSS rgba string.
   */
  static uint32ToCss(color: number): string {
    const r = color & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = (color >> 16) & 0xFF;
    const a = (color >>> 24) / 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /**
   * Converts a 32-bit AABBGGRR integer to Hex string (#RRGGBB).
   */
  static uint32ToHex(color: number): string {
    const r = color & 0xFF;
    const g = (color >> 8) & 0xFF;
    const b = (color >> 16) & 0xFF;
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0').toUpperCase()}`;
  }

  /**
   * Converts Hex string (#RRGGBB) to 32-bit AABBGGRR integer.
   */
  static hexToUint32(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return this.rgbaToUint32(r, g, b, 255);
  }
}
