import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

async function readPublicFile(name) {
  return readFile(new URL(`../src/public/${name}`, import.meta.url), 'utf8');
}

test('home page redirects to the dashboard entry page', async () => {
  const html = await readPublicFile('index.html');

  assert.match(html, /http-equiv="refresh" content="0;url=\/dashboard\.html"/);
  assert.match(html, /href="\/dashboard\.html"/);
  assert.doesNotMatch(html, />\s*Dashboard\s*</);
});

test('status regions announce asynchronous updates accessibly', async () => {
  const dashboard = await readPublicFile('dashboard.html');
  const nodes = await readPublicFile('nodes.html');
  const edit = await readPublicFile('nodes-edit.html');

  assert.match(dashboard, /id="status-bar"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(nodes, /id="node-status"[^>]*role="status"[^>]*aria-live="polite"/);
  assert.match(edit, /id="edit-node-status"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('primary workflow is split across dedicated pages with shared menu shell', async () => {
  const pages = ['dashboard.html', 'kernel.html', 'config.html', 'logs.html', 'nodes.html', 'nodes-edit.html'];

  for (const page of pages) {
    const html = await readPublicFile(page);
    assert.match(html, /id="menu-bar"/, `${page} should include the shared menu bar`);
    assert.match(html, /id="sidebar"/, `${page} should include the shared sidebar`);
    assert.match(html, /class="page-content"/, `${page} should use the page layout`);
    assert.match(html, /src="\/layout\.js"/, `${page} should load the shared layout module`);
  }
});

test('shared layout defines a complete menu for all top-level pages', async () => {
  const js = await readPublicFile('layout.js');

  assert.match(js, /'nav.primary': '主菜单'/);
  assert.match(js, /data-i18n-aria-label="nav.primary"/);
  assert.match(js, /href: '\/dashboard\.html'/);
  assert.match(js, /href: '\/kernel\.html'/);
  assert.match(js, /href: '\/config\.html'/);
  assert.match(js, /href: '\/logs\.html'/);
  assert.match(js, /href: '\/nodes\.html'/);
  assert.match(js, /sidebar-link/);
});

test('shared layout exposes a persistent Chinese and English language switch', async () => {
  const js = await readPublicFile('layout.js');

  assert.match(js, /LANGUAGE_STORAGE_KEY/);
  assert.match(js, /id="language-toggle"/);
  assert.match(js, /data-language-toggle/);
  assert.match(js, /中文/);
  assert.match(js, /English/);
  assert.match(js, /sub2socks5:languagechange/);
});

test('all split pages expose translatable static headings and actions', async () => {
  const pageExpectations = {
    'dashboard.html': ['dashboard.title', 'dashboard.start', 'dashboard.stop', 'dashboard.refreshSubscription', 'dashboard.safetyTitle'],
    'kernel.html': ['kernel.title', 'kernel.detectArchitecture', 'kernel.download', 'kernel.releaseList'],
    'logs.html': ['logs.title', 'logs.runtimeLogs', 'logs.generatedConfig'],
    'nodes.html': ['nodes.title', 'nodes.save', 'nodes.groups', 'nodes.openEditor'],
    'nodes-edit.html': ['nodesEdit.title', 'nodesEdit.back', 'nodesEdit.importManual', 'nodesEdit.currentNodes']
  };

  for (const [page, keys] of Object.entries(pageExpectations)) {
    const html = await readPublicFile(page);
    for (const key of keys) {
      assert.match(html, new RegExp(`data-i18n="${key}"`), `${page} should expose ${key} for translation`);
    }
  }
});

test('Chinese UI fallback text is Chinese before scripts run', async () => {
  const forbiddenEnglishFallbacks = [
    />\s*Dashboard\s*</,
    />\s*Configuration\s*</,
    />\s*Kernel Management\s*</,
    />\s*Logs & Output\s*</,
    />\s*Node Management\s*</,
    />\s*Node Editor\s*</,
    />\s*Setup flow\s*</,
    />\s*Ready\s*</,
    />\s*Loading\.\.\.\s*</,
    />\s*Save Node Config\s*</,
    />\s*Back to Nodes\s*</,
    />\s*Import Manual Nodes\s*</,
    />\s*Current Nodes\s*</,
    />\s*Raw \/ JSON\s*</,
    />\s*Custom\s*</
  ];

  for (const page of ['dashboard.html', 'kernel.html', 'config.html', 'logs.html', 'nodes.html', 'nodes-edit.html']) {
    const html = await readPublicFile(page);
    for (const pattern of forbiddenEnglishFallbacks) {
      assert.doesNotMatch(html, pattern, `${page} should not show ${pattern} in Chinese fallback UI`);
    }
  }
});

test('shared layout translates navigation chrome and summary labels', async () => {
  const js = await readPublicFile('layout.js');

  assert.match(js, /return 'zh'/);
  assert.match(js, /eyebrowKey/);
  assert.match(js, /data-i18n="\$\{item\.eyebrowKey\}"/);
  assert.match(js, /SUMMARY_LABEL_KEYS/);
  assert.match(js, /'summary.nodeCount': '节点数量'/);
  assert.doesNotMatch(js, /eyebrow: 'Dashboard'/);
});

test('manual node editor dynamic field labels are translatable', async () => {
  const js = await readPublicFile('nodes-edit.js');

  assert.match(js, /labelKey: 'nodesEdit.field.password'/);
  assert.match(js, /t\(field\.labelKey\)/);
  assert.doesNotMatch(js, /label: 'Password'/);
  assert.doesNotMatch(js, /label: 'Security'/);
});

test('configuration page explains how to fill every primary setting', async () => {
  const html = await readPublicFile('config.html');
  const staticHelpIds = [
    'help-app-host',
    'help-app-port',
    'help-app-binary',
    'help-app-log-level',
    'help-app-auto-start',
    'help-dns-strategy',
    'help-dns-remote-preset',
    'help-dns-remote-url',
    'help-dns-bootstrap-preset',
    'help-dns-bootstrap',
    'help-route-final'
  ];

  for (const id of staticHelpIds) {
    assert.match(html, new RegExp(`id="${id}"[^>]*class="field-help"`), `${id} should explain the field`);
  }

  assert.match(html, /data-i18n="config.title"/);
  assert.match(html, /data-i18n="help.appHost"/);
  assert.match(html, /data-i18n="help.routeFinal"/);
});

test('dynamic configuration editors render translatable field help', async () => {
  const js = await readPublicFile('config.js');

  assert.match(js, /field-help/);
  assert.match(js, /help.subscriptionUrl/);
  assert.match(js, /help.socksTag/);
  assert.match(js, /help.socksListen/);
  assert.match(js, /help.socksPort/);
  assert.match(js, /help.socksTarget/);
});

test('dashboard presents a guided setup flow and VPS safety guidance', async () => {
  const html = await readPublicFile('dashboard.html');

  assert.match(html, /class="setup-steps"/);
  assert.match(html, /安装内核/);
  assert.match(html, /导入订阅/);
  assert.match(html, /配置 SOCKS5/);
  assert.match(html, /启动服务/);
  assert.match(html, /VPS 安全提示/);
  assert.match(html, /不要把无认证 SOCKS5 直接暴露到公网/);
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
