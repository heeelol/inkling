export const CREAM = "#fffdf5";

/**
 * Where the child's drawing sits on the scene, in normalized coordinates:
 * (x, y) is the CENTER of the drawing as a fraction of the scene [0..1],
 * scale is its width as a fraction of the scene width [0..1] (drawings are square).
 */
export type Placement = { x: number; y: number; scale: number };

export const DEFAULT_PLACEMENT: Placement = { x: 0.5, y: 0.5, scale: 0.65 };

export function pickBackdrop(url: string | null): string {
  return url ?? "CREAM_FALLBACK";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}

export async function compositeScene(
  backdropUrl: string | null,
  drawingUrl: string | null,
  w: number,
  h: number,
  placement?: Placement | null
): Promise<string> {
  if (typeof document === "undefined") throw new Error("compositeScene must run in the browser");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d context");

  const backdrop = pickBackdrop(backdropUrl);
  if (backdrop === "CREAM_FALLBACK") {
    ctx.fillStyle = CREAM;
    ctx.fillRect(0, 0, w, h);
  } else {
    const img = await loadImage(backdrop);
    drawCover(ctx, img, w, h);
  }

  if (drawingUrl) {
    const drawing = await loadImage(drawingUrl);
    if (placement) {
      const size = placement.scale * w;
      ctx.drawImage(drawing, placement.x * w - size / 2, placement.y * h - size / 2, size, size);
    } else {
      ctx.drawImage(drawing, 0, 0, w, h);
    }
  }

  return canvas.toDataURL("image/png");
}
