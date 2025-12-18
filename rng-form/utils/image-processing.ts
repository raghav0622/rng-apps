export interface EditorFilters {
  brightness: number;
  contrast: number;
  saturation: number;
}

/**
 * Applies CSS filters to a canvas context directly.
 */
export async function applyFiltersAndSave(
  sourceCanvas: HTMLCanvasElement,
  filters: EditorFilters,
  fileName: string = 'image.jpg',
  quality: number = 0.9,
): Promise<File | null> {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Apply filters to context before drawing
  // This "bakes in" the CSS filters to the final image
  ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

  ctx.drawImage(sourceCanvas, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          resolve(file);
        } else {
          resolve(null);
        }
      },
      'image/jpeg',
      quality,
    );
  });
}
