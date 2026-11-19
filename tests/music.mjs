import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const baseURL = process.env.BOOK_URL ?? 'http://127.0.0.1:4173';
const candidates = [
  process.env.BOOK_CHROMIUM,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  try { await access(candidate); executablePath = candidate; break; } catch {}
}
const rendererArgs = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ executablePath, args: [...rendererArgs, '--autoplay-policy=document-user-activation-required'] });
const errors = [];

async function waitForPlayback(page) {
  await page.waitForFunction(() => {
    const track = document.querySelector('audio');
    return track && !track.paused && track.currentTime > .15 && track.readyState >= 2;
  });
}

async function ready(page) {
  page.on('pageerror', error => errors.push(String(error)));
  await page.goto(baseURL);
  await page.locator('[data-ready="true"]').waitFor();
  await page.locator('.loader').waitFor({ state: 'hidden' });
}

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', reducedMotion: 'reduce' });
  let mediaRequests = 0;
  desktop.on('request', request => { if (request.url().includes('/audio/')) mediaRequests++; });
  await ready(desktop);
  assert.equal(await desktop.locator('audio').evaluate(track => track.paused && track.currentTime === 0 && track.preload === 'none'), true);
  assert.equal(mediaRequests, 0, 'Do not download music before the visitor enables sound');
  assert.equal(await desktop.locator('.sound-error').count(), 0, 'Policy denial is not a media error');
  await desktop.getByRole('button', { name: 'Mở sách tri ân' }).click();
  await waitForPlayback(desktop);
  await desktop.locator('[data-phase="reading"]').waitFor();
  const playing = await desktop.locator('audio').evaluate(track => ({ loop: track.loop, volume: track.volume, duration: track.duration, source: track.currentSrc }));
  assert.equal(playing.loop, true);
  assert.equal(playing.volume, .35);
  assert.ok(playing.duration > 1 && playing.source.endsWith('/audio/nguoi-gieo-mam-xanh.mp3'));
  assert.equal(await desktop.getByRole('button', { name: 'Tắt âm thanh' }).getAttribute('aria-pressed'), 'true');

  await desktop.getByRole('button', { name: 'Tắt âm thanh' }).click();
  const pausedAt = await desktop.locator('audio').evaluate(track => { assertPaused(track); return track.currentTime; function assertPaused(audio) { if (!audio.paused) throw new Error('Music did not pause'); } });
  await desktop.waitForTimeout(220);
  assert.ok(Math.abs(await desktop.locator('audio').evaluate(track => track.currentTime) - pausedAt) < .03);
  await desktop.mouse.click(6, 6);
  assert.equal(await desktop.locator('audio').evaluate(track => track.paused), true, 'A regular click must respect mute');
  await desktop.getByRole('button', { name: 'Bật âm thanh' }).click();
  await desktop.waitForFunction(position => document.querySelector('audio').currentTime > position + .15, pausedAt);

  await desktop.locator('audio').evaluate(track => { track.currentTime = track.duration - .16; });
  await desktop.waitForFunction(() => {
    const track = document.querySelector('audio');
    return !track.paused && track.currentTime < 1.5;
  });
  for (let index = 0; index < 4; index++) {
    await desktop.getByRole('button', { name: 'Trang sau' }).click();
    await desktop.waitForFunction(number => document.querySelector('.reading-title .eyebrow')?.textContent?.includes('0' + number + ' /'), index + 2);
  }
  await desktop.getByRole('button', { name: 'Đến lời kết' }).click();
  await desktop.getByRole('button', { name: 'Đọc lại từ đầu' }).click();
  await desktop.locator('[data-phase="intro"]').waitFor();
  await waitForPlayback(desktop);
  const beforeRapidToggle = await desktop.locator('audio').evaluate(track => track.currentTime);
  await desktop.getByRole('button', { name: 'Tắt âm thanh' }).click();
  for (let index = 0; index < 3; index++) {
    await desktop.getByRole('button', { name: 'Bật âm thanh' }).click();
    await desktop.getByRole('button', { name: 'Tắt âm thanh' }).click();
  }
  await desktop.getByRole('button', { name: 'Bật âm thanh' }).click();
  await desktop.waitForFunction(position => document.querySelector('audio').currentTime > position, beforeRapidToggle);
  assert.equal(await desktop.locator('.sound-error').count(), 0);
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'vi-VN', isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  await ready(mobile);
  await mobile.getByRole('button', { name: 'Mở sách tri ân' }).tap();
  await waitForPlayback(mobile);
  await mobile.getByRole('button', { name: 'Tắt âm thanh' }).tap();
  await mobile.getByRole('button', { name: 'Bật âm thanh' }).tap();
  await waitForPlayback(mobile);
  await mobile.getByRole('button', { name: 'Tắt âm thanh' }).tap();
  assert.equal(await mobile.locator('audio').evaluate(track => track.paused), true);
  await mobile.close();

  const allowingAutoplay = await chromium.launch({ executablePath, args: [...rendererArgs, '--autoplay-policy=no-user-gesture-required'] });
  try {
    const page = await allowingAutoplay.newPage({ reducedMotion: 'reduce' });
    await ready(page);
    await waitForPlayback(page);
    await page.getByRole('button', { name: 'Tắt âm thanh' }).click();
    await page.reload();
    await page.locator('.loader').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('audio').evaluate(track => track.paused), true, 'Reload must respect an explicit mute');
  } finally {
    await allowingAutoplay.close();
  }

  const unavailable = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await unavailable.route('**/audio/*.mp3', route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not found' }));
  await ready(unavailable);
  await unavailable.getByRole('button', { name: 'Bật âm thanh' }).click();
  await unavailable.getByRole('status').filter({ hasText: 'Chưa phát được nhạc' }).waitFor();
  assert.equal(await unavailable.getByRole('button', { name: 'Bật âm thanh' }).getAttribute('aria-pressed'), 'false');
  await unavailable.unroute('**/audio/*.mp3');
  await unavailable.getByRole('button', { name: 'Bật âm thanh' }).click();
  await waitForPlayback(unavailable);
  await unavailable.close();

  assert.deepEqual(errors, []);
  console.log('Passed: autoplay when permitted; opening the book starts blocked playback; mute and reload; looping; page turns and replay; rapid toggles; mobile touch; missing-file recovery.');
} finally {
  await browser.close();
}
