import {
  initLayout, loadConfig, setStatus, syncStatusBarWithDownload, action, post, api,
  latestData, renderKeyValue, renderTimeline, flattenObject, refreshSidebarStatus,
  LANGUAGE_CHANGE_EVENT, t, format
} from './layout.js';

initLayout('kernel');

const kernelVersionSelect = document.getElementById('kernel-version-select');
const kernelSelectVersionButton = document.getElementById('kernel-select-version');
const kernelArchSelect = document.getElementById('kernel-arch-select');

let selectedKernelArch = 'windows-amd64';
let selectedKernelVersion = '';
let kernelArchManuallySelected = false;
let downloadInFlight = false;

const infoViews = {
  architecture: setupInfoView('architecture'),
  kernel: setupInfoView('kernel')
};

// --- Info view toggle ---

function setupInfoView(name) {
  const formViewEl = document.getElementById(`${name}-form-view`);
  const jsonViewEl = document.getElementById(`${name}-json-view`);
  const formButton = document.getElementById(`switch-${name}-form`);
  const jsonButton = document.getElementById(`switch-${name}-json`);
  const state = { formViewEl, jsonViewEl, formButton, jsonButton };
  formButton.addEventListener('click', () => setInfoView(name, 'form'));
  jsonButton.addEventListener('click', () => setInfoView(name, 'json'));
  return state;
}

function setInfoView(name, mode) {
  const state = infoViews[name];
  state.formViewEl.classList.toggle('is-hidden', mode !== 'form');
  state.jsonViewEl.classList.toggle('is-hidden', mode !== 'json');
  state.formButton.classList.toggle('is-active', mode === 'form');
  state.jsonButton.classList.toggle('is-active', mode === 'json');
}

// --- Architecture selector ---

function renderArchitectureSelector() {
  const detected = latestData.architecture?.assetSuffix;
  if (detected && !kernelArchManuallySelected) {
    selectedKernelArch = detected;
  }
  kernelArchSelect.value = selectedKernelArch || detected || 'windows-amd64';
}

function renderKernelVersionOptions() {
  const releases = latestData.releaseList || [];
  const selectedVersion = selectedKernelVersion || latestData.plannedKernel?.version || '';
  kernelVersionSelect.innerHTML = '';

  if (!releases.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = t('kernel.detectFirst');
    kernelVersionSelect.appendChild(option);
    kernelVersionSelect.disabled = true;
    kernelSelectVersionButton.disabled = true;
    return;
  }

  for (const release of releases) {
    const option = document.createElement('option');
    option.value = release.version;
    option.textContent = release.version;
    option.selected = release.version === selectedVersion;
    kernelVersionSelect.appendChild(option);
  }

  if (!kernelVersionSelect.value && releases[0]) {
    kernelVersionSelect.value = releases[0].version;
  }
  selectedKernelVersion = kernelVersionSelect.value;
  kernelVersionSelect.disabled = false;
  kernelSelectVersionButton.disabled = false;
}

// --- Data loading and rendering ---

async function load() {
  await loadConfig();
  render();
  refreshSidebarStatus();
  if (!syncStatusBarWithDownload(latestData.download)) {
    setStatus(t('common.ready'), 'idle', 'common.ready');
  }
}

function render() {
  const arch = latestData.architecture || {};
  renderKeyValue(document.getElementById('architecture-form'), flattenObject({
    stored: Boolean(arch.detectedAt),
    ...arch,
    plannedVersion: latestData.plannedKernel?.version || ''
  }));
  document.getElementById('architecture-json').textContent = JSON.stringify(arch, null, 2);

  const kernel = latestData.kernel || {};
  renderKeyValue(document.getElementById('kernel-form'), flattenObject({
    installed: kernel.installed,
    binaryPath: kernel.binaryPath,
    installedVersion: kernel.releaseInfo?.version || kernel.releaseInfo?.tag_name || '',
    plannedVersion: latestData.plannedKernel?.version || '',
    plannedAsset: latestData.plannedKernel?.assetName || '',
    releaseListCount: latestData.releaseList?.length || 0
  }));
  document.getElementById('kernel-json').textContent = JSON.stringify({
    ...kernel,
    plannedKernel: latestData.plannedKernel,
    releaseListCount: latestData.releaseList?.length || 0
  }, null, 2);

  renderArchitectureSelector();
  renderKernelVersionOptions();

  // Release list
  const releaseList = latestData.releaseList || [];
  renderTimeline(document.getElementById('release-list'), releaseList.map((r) => ({
    time: r.version,
    title: r.tagName || r.version,
    details: format('kernel.releaseAsset', { asset: r.assetName || '--' })
  })));
}

// --- Architecture functions ---

async function detectArchitectureAndLoadReleases() {
  kernelArchManuallySelected = false;
  await post('/api/kernel/architecture', {});
  await api('/api/kernel/releases');
  selectedKernelVersion = '';
}

async function applySelectedArchitectureAndLoadReleases() {
  await post('/api/kernel/architecture', { assetSuffix: selectedKernelArch || kernelArchSelect.value });
  await api('/api/kernel/releases');
}

async function startDownloadFlow() {
  downloadInFlight = true;
  try {
    await applySelectedArchitectureAndLoadReleases();
    if (kernelVersionSelect.value) {
      await post('/api/kernel/plan', {
        version: kernelVersionSelect.value,
        assetSuffix: selectedKernelArch || kernelArchSelect.value
      });
    }
    await post('/api/kernel/download');
    await load();
    syncStatusBarWithDownload(latestData.download);
  } finally {
    downloadInFlight = false;
  }
}

// --- Event handlers ---

document.getElementById('kernel-architecture-detect').onclick = () => action('kernel.actionDetect', async () => {
  await detectArchitectureAndLoadReleases();
  await load();
});

document.getElementById('kernel-check').onclick = () => action('kernel.actionCheck', async () => {
  await Promise.all([api('/api/kernel/status'), api('/api/kernel/releases')]);
  await load();
});

document.getElementById('kernel-check-updates').onclick = () => action('kernel.actionUpdates', async () => {
  await post('/api/kernel/releases/update');
  await load();
});

kernelSelectVersionButton.onclick = () => action('kernel.actionPlan', async () => {
  await applySelectedArchitectureAndLoadReleases();
  if (!kernelVersionSelect.value) throw new Error(t('kernel.selectVersionFirst'));
  selectedKernelVersion = kernelVersionSelect.value;
  kernelArchManuallySelected = false;
  await post('/api/kernel/plan', {
    version: kernelVersionSelect.value,
    assetSuffix: selectedKernelArch || kernelArchSelect.value
  });
  await load();
});

document.getElementById('kernel-download').onclick = async () => {
  try {
    setStatus(t('kernel.downloading'), 'loading', 'kernel.downloading');
    await startDownloadFlow();
  } catch (error) {
    setStatus(format('kernel.downloadFailed', { error: error.message }), 'error', 'kernel.downloadFailed', { error: error.message });
  }
};

kernelArchSelect.addEventListener('change', () => {
  kernelArchManuallySelected = true;
  selectedKernelArch = kernelArchSelect.value;
});

kernelVersionSelect.addEventListener('change', () => {
  selectedKernelVersion = kernelVersionSelect.value;
});

window.addEventListener(LANGUAGE_CHANGE_EVENT, render);

load().catch((error) => setStatus(format('status.initFailed', { error: error.message }), 'error', 'status.initFailed', { error: error.message }));

setInterval(async () => {
  if (downloadInFlight) return;
  try { await load(); } catch {}
}, 5000);
