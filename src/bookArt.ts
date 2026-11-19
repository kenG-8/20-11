import { CanvasTexture, SRGBColorSpace } from 'three';
import { greetings } from './data';

export const BOOK_WIDTH = 2.47;
export const BOOK_HEIGHT = 2.99;
const serif = '"Cormorant Garamond Variable", Georgia, serif';
const sans = '"Be Vietnam Pro", sans-serif';

export function seeded(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function artwork(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width = 768, height = 932) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!, width, height);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function grain(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number, color: string) {
  const random = seeded(33);
  ctx.fillStyle = color;
  ctx.save();
  for (let index = 0; index < amount; index++) {
    ctx.globalAlpha = random() * .12;
    ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1 + random() * 3);
  }
  ctx.restore();
}

function diamond(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
}

function bookFrame(ctx: CanvasRenderingContext2D, width: number, height: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(49, 48, width - 98, height - 96);
  ctx.lineWidth = 1;
  ctx.strokeRect(61, 60, width - 122, height - 120);
  for (const x of [77, width - 77]) {
    for (const y of [76, height - 76]) {
      diamond(ctx, x, y, 13);
      ctx.stroke();
    }
  }
}

function trackedText(ctx: CanvasRenderingContext2D, value: string, center: number, y: number, gap: number) {
  const chars = [...value];
  const width = chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) + gap * (chars.length - 1);
  let cursor = center - width / 2;
  ctx.save();
  ctx.textAlign = 'left';
  for (const char of chars) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + gap;
  }
  ctx.restore();
}

function wrappedText(ctx: CanvasRenderingContext2D, content: string, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of content.split(' ')) {
    const nextLine = line ? line + ' ' + word : word;
    if (line && ctx.measureText(nextLine).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }
  return [...lines, line];
}

export function coverArt() {
  const texture = artwork((ctx, width, height) => {
    const base = ctx.createLinearGradient(0, height, width, 0);
    base.addColorStop(0, '#101a31');
    base.addColorStop(.58, '#263855');
    base.addColorStop(1, '#38506c');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, 14000, '#ffedbc');
    bookFrame(ctx, width, height, '#a9784b');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f8d494';
    ctx.font = '600 19px ' + sans;
    trackedText(ctx, 'NHÀ GIÁO VIỆT NAM', width / 2, 196, 7);
    ctx.font = '600 104px ' + serif;
    ctx.fillText('Sách Tri Ân', width / 2, 681);
    ctx.font = '400 25px ' + sans;
    trackedText(ctx, '20  /  11', width / 2, 762, 8);
    const random = seeded(88);
    ctx.fillStyle = '#c7a671';
    for (let index = 0; index < 92; index++) {
      const x = 100 + random() * (width - 200);
      const y = 240 + random() * 320;
      ctx.globalAlpha = .2 + random() * .7;
      ctx.fillRect(x, y, index % 7 === 0 ? 7 : 3, index % 7 === 0 ? 7 : 3);
    }
    ctx.globalAlpha = 1;
  });
  return texture;
}

export function paperArt(page: number, side: 'left' | 'right', mirrored = false) {
  const greeting = greetings[page];
  const texture = artwork((ctx, width, height) => {
    const base = ctx.createLinearGradient(0, 0, width, 0);
    base.addColorStop(0, side === 'right' ? '#b48e61' : '#e8d2a9');
    base.addColorStop(.11, '#f4e3c0');
    base.addColorStop(.86, '#f6e7c8');
    base.addColorStop(1, side === 'right' ? '#e8d2a9' : '#b48e61');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, width, height);
    grain(ctx, width, height, 9000, '#77522c');
    bookFrame(ctx, width, height, '#ac855b');
    ctx.textAlign = 'center';
    const center = width / 2;
    if (side === 'left') {
      ctx.fillStyle = '#986236';
      ctx.font = '600 21px ' + sans;
      trackedText(ctx, 'LỜI TRI ÂN', center, 255, 7);
      ctx.fillStyle = '#674221';
      ctx.font = '600 152px ' + serif;
      ctx.fillText(String(page + 1).padStart(2, '0'), center, 450);
      ctx.font = 'italic 600 62px ' + serif;
      ctx.fillText(greeting.title, center, 560);
      ctx.font = '400 22px ' + sans;
      trackedText(ctx, '20 THÁNG 11', center, 702, 6);
    } else {
      ctx.fillStyle = '#9d673b';
      diamond(ctx, center, 202, 18);
      ctx.fill();
      ctx.fillStyle = '#422d20';
      ctx.font = '600 51px ' + serif;
      const lines = wrappedText(ctx, greeting.message, 545);
      const start = 470 - ((lines.length - 1) * 62) / 2;
      lines.forEach((line, index) => ctx.fillText(line, center, start + index * 62));
      ctx.fillStyle = '#9d673b';
      ctx.font = '400 21px ' + sans;
      trackedText(ctx, 'KÍNH GỬI THẦY CÔ', center, 750, 5);
    }
  });
  if (mirrored) {
    texture.repeat.x = -1;
    texture.offset.x = 1;
  }
  return texture;
}
