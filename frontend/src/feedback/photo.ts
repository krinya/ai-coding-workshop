// Photo helpers: resize to at most 640px and the photo-booth filters.
// The filters work on raw pixels (red, green, blue, alpha — four numbers per pixel), so they
// behave the same in every browser.

export const MAX_SIDE = 640

export type Filter = 'normal' | 'bw' | 'sepia' | 'comic'

export const FILTERS: { id: Filter; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'bw', label: 'Black & white' },
  { id: 'sepia', label: 'Sepia' },
  { id: 'comic', label: 'Comic' },
]

export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function applyFilter(pixels: Uint8ClampedArray, filter: Filter): Uint8ClampedArray {
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!
    const g = pixels[i + 1]!
    const b = pixels[i + 2]!
    if (filter === 'bw') {
      const grey = 0.299 * r + 0.587 * g + 0.114 * b
      pixels.set([grey, grey, grey], i)
    } else if (filter === 'sepia') {
      pixels.set(
        [
          0.393 * r + 0.769 * g + 0.189 * b,
          0.349 * r + 0.686 * g + 0.168 * b,
          0.272 * r + 0.534 * g + 0.131 * b,
        ],
        i,
      )
    } else if (filter === 'comic') {
      // Posterise: round each colour to one of 4 levels, like a printed comic
      pixels.set([posterise(r), posterise(g), posterise(b)], i)
    }
  }
  return pixels
}

function posterise(value: number): number {
  const step = 255 / 3
  return Math.round(value / step) * step
}

// Draws any picture (a video frame, an uploaded image) onto a canvas of at most 640px
export function toCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  mirror = false,
): HTMLCanvasElement {
  const size = fitWithin(width, height, MAX_SIDE)
  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')!
  if (mirror) {
    // A selfie preview is mirrored; keep the photo the way the person saw it
    context.translate(size.width, 0)
    context.scale(-1, 1)
  }
  context.drawImage(source, 0, 0, size.width, size.height)
  return canvas
}

// A JPEG data URL of the picture with the filter applied
export function filtered(canvas: HTMLCanvasElement, filter: Filter): string {
  const copy = document.createElement('canvas')
  copy.width = canvas.width
  copy.height = canvas.height
  const context = copy.getContext('2d')!
  context.drawImage(canvas, 0, 0)
  const image = context.getImageData(0, 0, copy.width, copy.height)
  applyFilter(image.data, filter)
  context.putImageData(image, 0, 0)
  return copy.toDataURL('image/jpeg', 0.85)
}

export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  // createImageBitmap also turns phone photos the right way up
  const bitmap = await createImageBitmap(file)
  const canvas = toCanvas(bitmap, bitmap.width, bitmap.height)
  bitmap.close()
  return canvas
}
