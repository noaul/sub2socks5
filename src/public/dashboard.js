import {
  initLayout, loadConfig, setStatus, syncStatusBarWithDownload, setBusy, action, post,
  latestData, renderKeyValue, flattenObject,
  buildSubscriptionSummary, buildRuntimeSummary, buildGeneratedSummary, escapeHtml,
  refreshSidebarStatus, LANGUAGE_CHANGE_EVENT, t, format
} from './layout.js';

initLayout('dashboard');

const statusBar = document.getElementById('status-bar');
const archBadge = document.getElementById('arch-badge');
const kernelBadge = document.getElementById('kernel-badge');
const subBadge = document.getElementById('sub-badge');
const runtimeBadge = document.getElementById('runtime-badge');

const forms = {
  architecture: document.getElementById('architecture-form'),
  kernel: document.getElementById('kernel-form'),
  subscription: document.getElementById('subscription-form'),
  runtime: document.getElementById('runtime-form'),
  socks: document.getElementById('socks-summary'),
  generated: document.getElementById('generated-form')
};

document.getElementById('start').onclick = () => action('dashboard.actionStart', async () => {
  await post('/api/runtime/start');
  await load();
});

document.getElementById('start-from-flow').onclick = () => action('dashboard.actionStart', async () => {
  await post('/api/runtime/start');
  await load();
});

document.getElementById('stop').onclick = () => action('dashboard.actionStop', async () => {
  await post('/api/runtime/stop');
  await load();
});

document.getElementById('refresh-sub').onclick = () => action('dashboard.actionRefresh', async () => {
  await post('/api/subscription/refresh');
  await load();
});

async function load() {
  await loadConfig();
  render();
  refreshSidebarStatus();
  if (!syncStatusBarWithDownload(latestData.download)) {
    const running = latestData.runtime?.running;
    setStatus(running ? t('status.runningText') : t('common.ready'), running ? 'success' : 'idle', running ? 'status.runningText' : 'common.ready');
  }
}

function render() {
  // Architecture
  const arch = latestData.architecture || {};
  archBadge.textContent = arch.assetSuffix || '--';
  renderKeyValue(forms.architecture, flattenObject({
    stored: Boolean(arch.detectedAt),
    platform: arch.platform || '',
    os: arch.os || '',
    archName: arch.archName || '',
    assetSuffix: arch.assetSuffix || '',
    executable: arch.executableName || ''
  }));

  // Kernel
  const kernel = latestData.kernel || {};
  const planned = latestData.plannedKernel;
  const installedVersion = kernel.releaseInfo?.version || kernel.releaseInfo?.tag_name || '';
  kernelBadge.textContent = installedVersion || t('dashboard.notInstalled');
  kernelBadge.className = `card-badge ${installedVersion ? 'is-ok' : 'is-warn'}`;
  renderKeyValue(forms.kernel, flattenObject({
    installed: kernel.installed || false,
    binaryPath: kernel.binaryPath || '',
    installedVersion,
    plannedVersion: planned?.version || '',
    releaseListCount: latestData.releaseList?.length || 0
  }));

  // Subscription
  const sub = buildSubscriptionSummary(latestData.subscription);
  subBadge.textContent = format('dashboard.nodesBadge', { count: sub.nodeCount });
  subBadge.className = `card-badge ${sub.nodeCount > 1 ? 'is-ok' : 'is-warn'}`;
  renderKeyValue(forms.subscription, sub);

  // Runtime
  const rt = buildRuntimeSummary(latestData.runtime);
  const running = latestData.runtime?.running;
  runtimeBadge.textContent = running ? t('status.running') : t('status.stopped');
  runtimeBadge.className = `card-badge ${running ? 'is-ok' : ''}`;
  renderKeyValue(forms.runtime, rt);

  // SOCKS5 services summary
  const ports = latestData.config?.ports || [];
  const socksEntries = {};
  if (ports.length) {
    for (const p of ports) {
      socksEntries[`${p.tag || 'unnamed'}`] = `${p.listen || '127.0.0.1'}:${p.port} -> ${p.target || 'proxy'}`;
    }
  } else {
    socksEntries.info = t('dashboard.noSocksServices');
  }
  renderKeyValue(forms.socks, socksEntries);

  // Generated config
  renderKeyValue(forms.generated, buildGeneratedSummary(latestData.generated));
}

window.addEventListener(LANGUAGE_CHANGE_EVENT, render);

load().catch((error) => setStatus(format('status.initFailed', { error: error.message }), 'error', 'status.initFailed', { error: error.message }));

setInterval(async () => {
  try {
    await load();
  } catch {}
}, 5000);
