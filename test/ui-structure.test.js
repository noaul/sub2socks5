import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

async function readPublicFile(name) {
  return readFile(new URL(`../src/public/${name}`, import.meta.url), 'utf8');
}

test('home page presents a guided setup flow and VPS safety guidance', async () => {
  const html = await readPublicFile('index.html');

  assert.match(html, /class="setup-steps"/);
  assert.match(html, /安装内核/);
  assert.match(html, /导入订阅/);
  assert.match(html, /配置 SOCKS5/);
  assert.match(html, /启动服务/);
  assert.match(html, /VPS 安全提示/);
  assert.match(html, /不要把无认证 SOCKS5 直接暴露到公网/);
});

test('status regions announce asynchronous updates accessibly', async () => {
  const home = await readPublicFile('index.html');
  const nodes = await readPublicFile('nodes.html');
  const edit = await readPublicFile('nodes-edit.html');

  assert.match(home, /id="status-bar"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(nodes, /id="node-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(edit, /id="edit-node-status"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('node management exposes clear primary actions and accessible icon buttons', async () => {
  const html = await readPublicFile('nodes.html');

  assert.match(html, /class="page-subtitle"/);
  assert.match(html, /先导入节点，再组装策略/);
  assert.match(html, /aria-label="刷新所有节点测速"/);
  assert.match(html, /管理手动节点/);
});

test('main stylesheet includes focus and reduced-motion affordances', async () => {
  const css = await readPublicFile('style.css');

  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /color-scheme:\s*dark/);
  assert.match(css, /setup-steps/);
});
