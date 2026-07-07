// Renders a shareable, branded book-cover PNG on a canvas — used for the
// "Share" / "Download cover" actions on the finished storybook.

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderCoverPng(opts: {
  title: string;
  subtitle: string;
  sceneUrl: string | null;
}): Promise<string | null> {
  if (typeof document === "undefined") return null;
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // parchment base
  ctx.fillStyle = "#f4ead5";
  ctx.fillRect(0, 0, W, H);

  // faded hero art
  if (opts.sceneUrl) {
    try {
      const img = await loadImage(opts.sceneUrl);
      const scale = Math.max(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.globalAlpha = 0.22;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    } catch {
      /* no art — cream cover is fine */
    }
  }

  // soft inner frame
  ctx.strokeStyle = "rgba(224,203,160,0.9)";
  ctx.lineWidth = 6;
  const m = 60;
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(m, m, W - 2 * m, H - 2 * m, 40);
    ctx.stroke();
  }

  ctx.textAlign = "center";

  // eyebrow
  ctx.fillStyle = "#8a7455";
  ctx.font = "600 30px Geist, system-ui, sans-serif";
  ctx.fillText("A N   I N K L I N G   S A G A", W / 2, 300);

  // title
  ctx.fillStyle = "#c1541a";
  ctx.font = "700 92px Cinzel, Georgia, serif";
  const lines = wrapLines(ctx, opts.title, W - 220);
  const startY = H / 2 - ((lines.length - 1) * 108) / 2;
  lines.forEach((ln, i) => ctx.fillText(ln, W / 2, startY + i * 108));

  // subtitle
  ctx.fillStyle = "#2b2018";
  ctx.font = "500 34px Geist, system-ui, sans-serif";
  ctx.fillText(opts.subtitle, W / 2, H - 320);

  // sparkle
  ctx.font = "80px serif";
  ctx.fillText("✨", W / 2, H - 200);

  return canvas.toDataURL("image/png");
}

export function dataUrlToFile(dataUrl: string, name: string): File {
  const [head, body] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/png";
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new File([arr], name, { type: mime });
}
