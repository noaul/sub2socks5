import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

async function readStyle() {
  return readFile(new URL('../src/public/style.css', import.meta.url), 'utf8');
}

test('stylesheet defines a deliberate visual token system', async () => {
  const css = await readStyle();

  assert.match(css, /:root\s*{/);
  assert.match(css, /--bg:/);
  assert.match(css, /--panel:/);
  assert.match(css, /--accent:/);
  assert.match(css, /--success:/);
  assert.match(css, /--warning:/);
  assert.match(css, /--danger:/);
  assert.match(css, /--radius:\s*8px/);
});

test('cards and buttons use refined interaction states', async () => {
  const css = await readStyle();

  assert.match(css, /\.quick-action-card:hover/);
  assert.match(css, /\.setup-step:hover/);
  assert.match(css, /\.primary-button/);
  assert.match(css, /\.secondary-button/);
  assert.match(css, /box-shadow:\s*0 16px 48px/);
});

test('forms and status elements use semantic visual treatments', async () => {
  const css = await readStyle();

  assert.match(css, /textarea,\s*pre,\s*input,\s*select/);
  assert.match(css, /background:\s*var\(--field\)/);
  assert.match(css, /\.status-bar\.is-success/);
  assert.match(css, /\.status-bar\.is-error/);
  assert.match(css, /\.safety-callout/);
});
