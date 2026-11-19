import assert from 'node:assert/strict';
import { access, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseURL = process.env.BOOK_URL ?? 'http://localhost:5173';
const artifactDir = process.env.BOOK_ARTIFACT_DIR ?? 'artifacts';
const browsers = [
  process.env.BOOK_CHROMIUM,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
let executablePath;
for (const path of browsers) {
  try { await access(path); executablePath = path; break; } catch {}
}
const rendererArgs = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=document-user-activation-required'];
const browser = await chromium.launch({ executablePath, args: rendererArgs });
const errors = [];
const locale = 'vi-VN';
await mkdir(artifactDir, { recursive: true });

function monitor(page) {
  page.on('pageerror', error => errors.push(String(error)));
}

async function expectTitle(page, title) {
  await page.getByRole('heading', { level: 1, name: title }).waitFor();
  await page.waitForTimeout(420);
}

async function verifyPixels(page) {
  const canvas = page.locator('canvas');
  const png = await canvas.screenshot();
  const analysis = await page.evaluate(async (encoded) => {
    const image = new Image();
    image.src = 'data:image/png;base64,' + encoded;
    await image.decode();
    const sampler = document.createElement('canvas');
    sampler.width = 84;
    sampler.height = 84;
    const ctx = sampler.getContext('2d');
    ctx.drawImage(image, 0, 0, 84, 84);
    const { data } = ctx.getImageData(0, 0, 84, 84);
    let colorful = 0;
    let contrast = 0;
    for (let y = 30; y < 65; y++) {
      for (let x = 20; x < 64; x++) {
        const offset = (y * 84 + x) * 4;
        if (data[offset] > data[offset + 2] + 22 && data[offset] > 114) colorful++;
        contrast = Math.max(contrast, data[offset] + data[offset + 1] + data[offset + 2]);
      }
    }
    return { colorful, contrast };
  }, png.toString('base64'));
  assert.ok(analysis.colorful > 24 && analysis.contrast > 340, JSON.stringify(analysis));
}

async function verifyLayout(page, selectors) {
  const boxes = await Promise.all(selectors.map(selector => page.locator(selector).boundingBox()));
  const viewport = page.viewportSize();
  for (const [index, box] of boxes.entries()) {
    assert.ok(box && box.x >= -1 && box.x + box.width <= viewport.width + 1 && box.y >= 0 && box.y + box.height <= viewport.height + 1, selectors[index]);
    if (index > 0) {
      const previous = boxes[index - 1];
      assert.ok(previous.y + previous.height <= box.y, selectors[index - 1] + ' overlaps ' + selectors[index]);
    }
  }
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale });
  monitor(desktop);
  await desktop.goto(baseURL);
  await desktop.locator('[data-ready="true"]').waitFor();
  await desktop.locator('.loader').waitFor({ state: 'hidden' });
  await verifyLayout(desktop, ['.site-header', '.intro-title', '.intro-control', '.site-footer']);
  await verifyPixels(desktop);
  await desktop.screenshot({ path: artifactDir + '/desktop-intro.png' });
  const captureFrame = () => desktop.locator('canvas').screenshot();
  const first = await captureFrame();
  await desktop.mouse.move(760, 450);
  await desktop.waitForTimeout(280);
  assert.notDeepEqual(await captureFrame(), first, 'The canvas should update as the pointer moves');
  const sound = desktop.getByRole('button', { name: 'Bật âm thanh' });
  await sound.click();
  assert.equal(await desktop.getByRole('button', { name: 'Tắt âm thanh' }).getAttribute('aria-pressed'), 'true');
  await desktop.getByRole('button', { name: 'Tắt âm thanh' }).click();
  await desktop.mouse.click(720, 505);
  await expectTitle(desktop, 'Lời chúc đầu trang');
  await desktop.screenshot({ path: artifactDir + '/desktop-reading.png' });
  await desktop.mouse.click(880, 480);
  await expectTitle(desktop, 'Người dìu dắt');
  await desktop.mouse.click(560, 480);
  await expectTitle(desktop, 'Lời chúc đầu trang');
  await desktop.keyboard.press('ArrowRight');
  await expectTitle(desktop, 'Người dìu dắt');
  await desktop.getByRole('button', { name: 'Trang trước' }).click();
  await expectTitle(desktop, 'Lời chúc đầu trang');
  for (const name of ['Ngôi sao', 'Đóa hoa', 'Cánh bướm', 'Tinh thể', 'Máy bay giấy']) {
    await desktop.getByRole('button', { name, exact: true }).click();
    await desktop.getByRole('dialog').waitFor();
    await desktop.getByRole('button', { name: 'Đóng', exact: true }).click();
    await desktop.getByRole('dialog').waitFor({ state: 'hidden' });
  }
  assert.match(await desktop.locator('.keepsake-count').innerText(), /5 \/ 5/);
  for (const title of ['Người dìu dắt', 'Hạt giống niềm tin', 'Chắp cánh ước mơ', 'Ở lại trong tim']) {
    await desktop.getByRole('button', { name: 'Trang sau' }).click();
    await expectTitle(desktop, title);
  }
  await desktop.getByRole('button', { name: 'Đến lời kết' }).click();
  await desktop.frameLocator('.galaxy-frame').getByRole('heading', { level: 1, name: /Cuốn Sách Ngân Hà/ }).waitFor();
  await desktop.screenshot({ path: artifactDir + '/desktop-final.png' });
  await desktop.getByRole('button', { name: 'Đọc lại từ đầu' }).click();
  await expectTitle(desktop, /Tri ân người/);
  assert.match(await desktop.locator('.keepsake-count').innerText(), /0 \/ 5/);
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, locale, isMobile: true, hasTouch: true });
  monitor(mobile);
  await mobile.goto(baseURL);
  await mobile.locator('.loader').waitFor({ state: 'hidden' });
  await verifyPixels(mobile);
  await verifyLayout(mobile, ['.site-header', '.intro-title', '.intro-control', '.site-footer']);
  await mobile.screenshot({ path: artifactDir + '/mobile-intro.png' });
  await mobile.getByRole('button', { name: 'Mở sách tri ân' }).tap();
  await expectTitle(mobile, 'Lời chúc đầu trang');
  const touch = await mobile.context().newCDPSession(mobile);
  await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 291, y: 419 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 159, y: 420 }] });
  await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expectTitle(mobile, 'Người dìu dắt');
  await verifyLayout(mobile, ['.site-header', '.reading-title', '.mobile-greeting', '.page-controls', '.reading-hint', '.site-footer']);
  await mobile.screenshot({ path: artifactDir + '/mobile-reading.png' });
  await mobile.close();

  const fallback = await browser.newPage({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce', locale });
  monitor(fallback);
  await fallback.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (kind.startsWith('webgl')) return null;
      return getContext.call(this, kind, ...args);
    };
  });
  await fallback.goto(baseURL);
  await fallback.locator('.is-fallback[data-ready="true"]').waitFor();
  await fallback.getByRole('button', { name: 'Mở sách tri ân' }).click();
  await expectTitle(fallback, 'Lời chúc đầu trang');
  await fallback.getByRole('button', { name: 'Lật sang trang sau' }).click();
  await expectTitle(fallback, 'Người dìu dắt');
  await fallback.close();
  assert.deepEqual(errors, []);
  console.log('Passed: 3D rendering, cover, 5 pages, touch, 5 keepsakes, sound toggle, ending, replay and WebGL fallback.');
} finally {
  await browser.close();
}
