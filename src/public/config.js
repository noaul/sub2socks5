import {
  initLayout, loadConfig, setStatus, action, post, api,
  latestData, renderKeyValue, buildGeneratedSummary, buildOutboundOptionsHtml,
  escapeHtmlAttr, escapeHtml, refreshSidebarStatus,
  DNS_PRESET_URLS, inferDnsPreset, inferBootstrapPreset, normalizePorts,
  LANGUAGE_CHANGE_EVENT, t, format
} from './layout.js';

initLayout('config');

const editor = document.getElementById('config-editor');
const statusBar = document.getElementById('status-bar');
const editorStatus = document.getElementById('editor-status');
const formView = document.getElementById('form-view');
const jsonView = document.getElementById('json-view');
const switchFormButton = document.getElementById('switch-form');
const switchJsonButton = document.getElementById('switch-json');

const socksServicesEl = document.getElementById('socks-services');
const subscriptionUrlsEl = document.getElementById('subscription-urls');
const dnsRemoteUrlWrap = document.getElementById('field-dns-remote-url-wrap');
const dnsBootstrapWrap = document.getElementById('field-dns-bootstrap-wrap');

const fields = {
  appHost: document.getElementById('field-app-host'),
  appPort: document.getElementById('field-app-port'),
  appBinary: document.getElementById('field-app-binary'),
  appLogLevel: document.getElementById('field-app-log-level'),
  appAutoStart: document.getElementById('field-app-auto-start'),
  dnsStrategy: document.getElementById('field-dns-strategy'),
  dnsRemotePreset: document.getElementById('field-dns-remote-preset'),
  dnsRemoteUrl: document.getElementById('field-dns-remote-url'),
  dnsBootstrapPreset: document.getElementById('field-dns-bootstrap-preset'),
  dnsBootstrap: document.getElementById('field-dns-bootstrap'),
  routeFinal: document.getElementById('field-route-final')
};

const generatedInfoViews = setupInfoView('generated');

let lastSavedConfigText = '';
let currentView = 'form';
let formTouched = false;
let formPorts = [];
let formSubscriptionUrls = [];
let isFormInteracting = false;

// --- Info view toggle ---

function setupInfoView(name) {
  const formViewEl = document.getElementById(`${name}-form-view`);
  const jsonViewEl = document.getElementById(`${name}-json-view`);
  const formButton = document.getElementById(`switch-${name}-form`);
  const jsonButton = document.getElementById(`switch-${name}-json`);
  const state = { formViewEl, jsonViewEl, formButton, jsonButton };
  formButton?.addEventListener('click', () => setInfoView(name, 'form'));
  jsonButton?.addEventListener('click', () => setInfoView(name, 'json'));
  return state;
}

function setInfoView(name, mode) {
  const state = { generated: generatedInfoViews }[name];
  if (!state) return;
  state.formViewEl.classList.toggle('is-hidden', mode !== 'form');
  state.jsonViewEl.classList.toggle('is-hidden', mode !== 'json');
  state.formButton.classList.toggle('is-active', mode === 'form');
  state.jsonButton.classList.toggle('is-active', mode === 'json');
}

// --- Form rendering ---

function fillForm(config) {
  const urls = Array.isArray(config.subscription?.urls) && config.subscription.urls.length
    ? config.subscription.urls
    : (config.subscription?.url ? [config.subscription.url] : ['']);
  formSubscriptionUrls = urls.map((url) => ({ url }));
  fields.appHost.value = config.app?.host || '0.0.0.0';
  fields.appPort.value = config.app?.port || 18080;
  fields.appBinary.value = config.app?.singBoxBinary || '';
  fields.appLogLevel.value = config.app?.logLevel || 'info';
  fields.appAutoStart.checked = Boolean(config.app?.autoStart);
  fields.dnsStrategy.value = config.dns?.strategy || 'prefer_ipv4';
  fields.dnsRemotePreset.value = config.dns?.remotePreset || inferDnsPreset(config.dns?.remoteUrl);
  fields.dnsRemoteUrl.value = config.dns?.remoteUrl || DNS_PRESET_URLS.cloudflare;
  fields.dnsBootstrapPreset.value = inferBootstrapPreset(config.dns?.bootstrapServer);
  fields.dnsBootstrap.value = config.dns?.bootstrapServer || '1.1.1.1';
  formPorts = normalizePorts(config.ports || []);
  renderRouteFinalOptions();
  fields.routeFinal.value = config.routing?.routeFinal || 'proxy';
  renderDnsPresetUi();
}

function renderRouteFinalOptions() {
  const selectedTag = latestData.config?.routing?.routeFinal || fields.routeFinal.value || 'proxy';
  fields.routeFinal.innerHTML = buildOutboundOptionsHtml(selectedTag);
  fields.routeFinal.value = selectedTag;
}

function renderDnsPresetUi() {
  const preset = fields.dnsRemotePreset.value || 'cloudflare';
  dnsRemoteUrlWrap.classList.toggle('is-hidden', preset !== 'custom');
  fields.dnsRemoteUrl.disabled = preset !== 'custom';
  const bootstrapPreset = fields.dnsBootstrapPreset.value || '1.1.1.1';
  dnsBootstrapWrap.classList.toggle('is-hidden', bootstrapPreset !== 'custom');
  fields.dnsBootstrap.disabled = bootstrapPreset !== 'custom';
}

function renderSubscriptionUrls() {
  subscriptionUrlsEl.innerHTML = '';
  if (!formSubscriptionUrls.length) {
    subscriptionUrlsEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('config.subscriptionUrls'))}</div></div>`;
    return;
  }
  for (const [index, item] of formSubscriptionUrls.entries()) {
    const block = document.createElement('div');
    block.className = 'timeline-item';
    block.innerHTML = `
      <div class="form-grid">
        <label class="inline-field-wrap">
          <span>${escapeHtml(t('label.subscriptionUrl'))} ${index + 1}</span>
          <div class="inline-field">
            <input data-subscription-index="${index}" data-subscription-field="url" value="${escapeHtmlAttr(item.url || '')}" />
            ${formSubscriptionUrls.length > 1 ? `<button type="button" class="secondary-button" data-remove-subscription="${index}">${escapeHtml(t('action.remove'))}</button>` : ''}
          </div>
          <small class="field-help" data-i18n="help.subscriptionUrl">${escapeHtml(t('help.subscriptionUrl'))}</small>
        </label>
      </div>
    `;
    subscriptionUrlsEl.appendChild(block);
  }
}

function renderSocksServices() {
  socksServicesEl.innerHTML = '';
  if (!formPorts.length) {
    socksServicesEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('config.socksServices'))}</div></div>`;
    return;
  }
  for (const [index, portItem] of formPorts.entries()) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="title">${escapeHtml(portItem.tag || `socks-${index + 1}`)}</div>
      <div class="form-grid">
        <label>
          <span>${escapeHtml(t('label.socksTag'))}</span>
          <input data-port-index="${index}" data-port-field="tag" value="${escapeHtmlAttr(portItem.tag || '')}" />
          <small class="field-help" data-i18n="help.socksTag">${escapeHtml(t('help.socksTag'))}</small>
        </label>
        <label>
          <span>${escapeHtml(t('label.socksListen'))}</span>
          <input data-port-index="${index}" data-port-field="listen" value="${escapeHtmlAttr(portItem.listen || '127.0.0.1')}" />
          <small class="field-help" data-i18n="help.socksListen">${escapeHtml(t('help.socksListen'))}</small>
        </label>
        <label>
          <span>${escapeHtml(t('label.socksPort'))}</span>
          <input data-port-index="${index}" data-port-field="port" type="number" min="1" step="1" value="${escapeHtmlAttr(String(portItem.port || ''))}" />
          <small class="field-help" data-i18n="help.socksPort">${escapeHtml(t('help.socksPort'))}</small>
        </label>
        <label>
          <span>${escapeHtml(t('label.socksTarget'))}</span>
          <select data-port-index="${index}" data-port-field="target">
            ${buildOutboundOptionsHtml(portItem.target)}
          </select>
          <small class="field-help" data-i18n="help.socksTarget">${escapeHtml(t('help.socksTarget'))}</small>
        </label>
      </div>
      <div class="section-heading-actions">
        ${formPorts.length > 1 ? `<button type="button" class="secondary-button" data-remove-port="${index}">${escapeHtml(t('action.remove'))}</button>` : ''}
      </div>
    `;
    socksServicesEl.appendChild(item);
  }
}

// --- Config parsing ---

function parseJsonEditor() {
  try {
    const value = JSON.parse(editor.value || '{}');
    return { ok: true, value, text: JSON.stringify(value, null, 2) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function parseFormConfig(validateRequired = false) {
  try {
    const parsedJson = parseJsonEditor();
    const base = parsedJson.ok ? parsedJson.value : JSON.parse(lastSavedConfigText || '{}');
    const next = structuredClone(base);
    next.subscription ||= {};
    next.app ||= {};
    next.dns ||= {};
    next.routing ||= {};
    next.nodeRegistry ||= { manualNodes: [], groups: [] };

    next.subscription.urls = formSubscriptionUrls.map((item) => item.url.trim()).filter(Boolean);
    next.subscription.url = next.subscription.urls[0] || '';
    next.subscription.format = next.subscription.format || 'raw';
    next.app.host = fields.appHost.value.trim();
    next.app.port = Number(fields.appPort.value || 0);
    next.app.singBoxBinary = fields.appBinary.value.trim();
    next.app.logLevel = fields.appLogLevel.value;
    next.app.autoStart = fields.appAutoStart.checked;
    next.dns.strategy = fields.dnsStrategy.value;
    next.dns.remotePreset = fields.dnsRemotePreset.value;
    next.dns.remoteUrl = fields.dnsRemotePreset.value === 'custom'
      ? fields.dnsRemoteUrl.value.trim()
      : DNS_PRESET_URLS[fields.dnsRemotePreset.value] || DNS_PRESET_URLS.cloudflare;
    next.dns.bootstrapServer = fields.dnsBootstrapPreset.value === 'custom'
      ? fields.dnsBootstrap.value.trim()
      : fields.dnsBootstrapPreset.value;
    next.routing.routeFinal = fields.routeFinal.value || next.routing.routeFinal || 'proxy';

    next.ports = formPorts.map((item, index) => ({
      tag: item.tag?.trim() || `socks-${index + 1}`,
      listen: item.listen?.trim() || '127.0.0.1',
      port: Number(item.port || 0),
      target: item.target || next.routing.routeFinal || 'proxy',
      sniff: true
    }));

    if (validateRequired) {
      if (!next.app.host) throw new Error(t('help.appHost'));
      if (!Number.isInteger(next.app.port) || next.app.port <= 0) throw new Error(t('help.appPort'));
      if (!next.app.singBoxBinary) throw new Error(t('help.appBinary'));
      if (!next.routing.routeFinal) throw new Error(t('help.routeFinal'));
      if (!next.ports.length) throw new Error(t('config.socksServices'));
      const seenTags = new Set();
      const seenPorts = new Set();
      for (const p of next.ports) {
        if (!p.tag) throw new Error(t('help.socksTag'));
        if (seenTags.has(p.tag)) throw new Error(`Duplicate tag: ${p.tag}`);
        seenTags.add(p.tag);
        if (!p.listen) throw new Error(`${p.tag}: ${t('help.socksListen')}`);
        if (!Number.isInteger(p.port) || p.port <= 0) throw new Error(`${p.tag}: ${t('help.socksPort')}`);
        const addr = `${p.listen}:${p.port}`;
        if (seenPorts.has(addr)) throw new Error(`Duplicate listen: ${addr}`);
        seenPorts.add(addr);
        if (!p.target) throw new Error(`${p.tag}: ${t('help.socksTarget')}`);
      }
    }
    return { ok: true, value: next, text: JSON.stringify(next, null, 2) };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function isEditorDirty() {
  return editor.value !== lastSavedConfigText;
}

function isFormDirty() {
  const parsed = parseFormConfig(false);
  return parsed.ok ? parsed.text !== lastSavedConfigText : true;
}

function updateEditorState() {
  const validation = currentView === 'json' ? parseJsonEditor() : parseFormConfig(false);
  if (!validation.ok) {
    editor.classList.add('is-invalid');
    editorStatus.textContent = format('config.invalid', { error: validation.error });
    editorStatus.className = 'editor-status is-invalid';
    editorStatus.dataset.statusI18n = 'config.invalid';
    editorStatus.dataset.statusI18nArgs = JSON.stringify({ error: validation.error });
    return;
  }
  editor.classList.remove('is-invalid');
  if (validation.text === lastSavedConfigText) {
    editorStatus.textContent = t('config.saved');
    editorStatus.className = 'editor-status is-saved';
    editorStatus.dataset.statusI18n = 'config.saved';
    editorStatus.dataset.statusI18nArgs = '{}';
    return;
  }
  editorStatus.textContent = t('config.unsaved');
  editorStatus.className = 'editor-status is-dirty';
  editorStatus.dataset.statusI18n = 'config.unsaved';
  editorStatus.dataset.statusI18nArgs = '{}';
}

function syncFormToJson() {
  const parsed = parseFormConfig(false);
  if (parsed.ok) editor.value = parsed.text;
  updateEditorState();
  return parsed;
}

function syncJsonToForm() {
  const parsed = parseJsonEditor();
  if (parsed.ok) {
    fillForm(parsed.value);
    formTouched = false;
    renderSubscriptionUrls();
    renderSocksServices();
  }
  updateEditorState();
  return parsed;
}

function switchView(view) {
  if (view === currentView) return;
  if (view === 'json') {
    const parsed = syncFormToJson();
    if (!parsed.ok) return setStatus(format('config.switchFailed', { error: parsed.error }), 'error', 'config.switchFailed', { error: parsed.error });
  } else {
    const parsed = syncJsonToForm();
    if (!parsed.ok) return setStatus(format('config.switchFailed', { error: parsed.error }), 'error', 'config.switchFailed', { error: parsed.error });
  }
  currentView = view;
  formView.classList.toggle('is-hidden', view !== 'form');
  jsonView.classList.toggle('is-hidden', view !== 'json');
  switchFormButton.classList.toggle('is-active', view === 'form');
  switchJsonButton.classList.toggle('is-active', view === 'json');
  updateEditorState();
}

function markFormInteraction(active) {
  isFormInteracting = active;
}

// --- Port auto-assignment ---

function createDefaultPort() {
  return {
    tag: `socks-${formPorts.length + 1 || 1}`,
    listen: '127.0.0.1',
    port: '',
    target: fields.routeFinal?.value || latestData.config?.routing?.routeFinal || 'proxy',
    sniff: true
  };
}

async function resolveNextPort(host, start, exclude = []) {
  const data = await post('/api/ports/next', { host, start, exclude });
  return Number(data.port || start);
}

async function assignMissingSuggestedPorts() {
  const host = '127.0.0.1';
  const used = new Set(
    formPorts.map((item) => Number(item.port)).filter((v) => Number.isInteger(v) && v > 0)
  );
  let changed = false;
  for (let i = 0; i < formPorts.length; i++) {
    if (Number(formPorts[i].port) > 0) continue;
    const start = i === 0
      ? Number(fields.appPort.value || 18080) + 1
      : Number(formPorts[i - 1].port || 0) + 1;
    const nextPort = await resolveNextPort(host, start, [...used]);
    formPorts[i].port = nextPort;
    used.add(nextPort);
    changed = true;
  }
  return changed;
}

// --- Data loading ---

async function load() {
  await loadConfig();
  const formattedConfig = JSON.stringify(latestData.config, null, 2);
  const shouldReplaceEditor = !isEditorDirty() || editor.value.trim() === '' || editor.value === lastSavedConfigText;
  if (shouldReplaceEditor) {
    editor.value = formattedConfig;
  }
  if (!isFormInteracting && !formTouched && (!isFormDirty() || shouldReplaceEditor)) {
    fillForm(latestData.config);
  }
  lastSavedConfigText = formattedConfig;
  updateEditorState();

  renderKeyValue(document.getElementById('generated-form'), buildGeneratedSummary(latestData.generated));
  document.getElementById('generated-json').textContent = JSON.stringify(latestData.generated, null, 2);

  renderRouteFinalOptions();
  renderDnsPresetUi();
  if ((!formTouched && !isFormInteracting) || currentView !== 'form') {
    renderSubscriptionUrls();
    renderSocksServices();
  }
  refreshSidebarStatus();
  setStatus(t('common.ready'), 'idle', 'common.ready');
}

// --- Event handlers ---

document.getElementById('save-config').onclick = () => action('config.save', async () => {
  const validation = currentView === 'json' ? parseJsonEditor() : parseFormConfig(true);
  if (!validation.ok) {
    updateEditorState();
    throw new Error(validation.error);
  }
  editor.value = validation.text;
  await post('/api/config', validation.value);
  lastSavedConfigText = validation.text;
  formTouched = false;
  fillForm(validation.value);
  renderSubscriptionUrls();
  renderSocksServices();
  updateEditorState();
  setStatus(t('status.configSaved'), 'success', 'status.configSaved');
});

window.addEventListener(LANGUAGE_CHANGE_EVENT, () => {
  renderSubscriptionUrls();
  renderSocksServices();
  renderRouteFinalOptions();
  updateEditorState();
});

switchFormButton.addEventListener('click', () => switchView('form'));
switchJsonButton.addEventListener('click', () => switchView('json'));
editor.addEventListener('input', updateEditorState);

document.getElementById('add-subscription-url')?.addEventListener('click', () => {
  formSubscriptionUrls.push({ url: '' });
  renderSubscriptionUrls();
  formTouched = true;
  updateEditorState();
});

document.getElementById('add-socks-service')?.addEventListener('click', () => {
  action('action.addService', async () => {
    formPorts.push(createDefaultPort());
    const changed = await assignMissingSuggestedPorts();
    renderSocksServices();
    if (changed) updateEditorState();
    formTouched = true;
    updateEditorState();
  });
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target.dataset.portIndex !== undefined) {
    const index = Number(target.dataset.portIndex);
    formPorts[index][target.dataset.portField] = target.value;
    formTouched = true;
    markFormInteraction(true);
    updateEditorState();
  }
  if (target.dataset.subscriptionIndex !== undefined) {
    const index = Number(target.dataset.subscriptionIndex);
    formSubscriptionUrls[index].url = target.value;
    formTouched = true;
    markFormInteraction(true);
    updateEditorState();
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
  if (target.dataset.portIndex !== undefined) {
    const index = Number(target.dataset.portIndex);
    formPorts[index][target.dataset.portField] = target.value;
    formTouched = true;
    markFormInteraction(true);
    updateEditorState();
  }
});

document.addEventListener('focusin', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) {
    markFormInteraction(true);
  }
});

document.addEventListener('focusout', () => {
  setTimeout(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLInputElement) && !(active instanceof HTMLSelectElement) && !(active instanceof HTMLTextAreaElement)) {
      markFormInteraction(false);
    }
  }, 0);
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.dataset.removePort !== undefined) {
    const index = Number(target.dataset.removePort);
    if (formPorts.length > 1) {
      formPorts.splice(index, 1);
      renderSocksServices();
      formTouched = true;
      updateEditorState();
    }
  }
  if (target.dataset.removeSubscription !== undefined) {
    const index = Number(target.dataset.removeSubscription);
    if (formSubscriptionUrls.length > 1) {
      formSubscriptionUrls.splice(index, 1);
      renderSubscriptionUrls();
      formTouched = true;
      updateEditorState();
    }
  }
});

fields.dnsRemotePreset.addEventListener('change', () => {
  if (fields.dnsRemotePreset.value !== 'custom') {
    fields.dnsRemoteUrl.value = DNS_PRESET_URLS[fields.dnsRemotePreset.value] || DNS_PRESET_URLS.cloudflare;
  }
  renderDnsPresetUi();
  formTouched = true;
  updateEditorState();
});

fields.dnsBootstrapPreset.addEventListener('change', () => {
  if (fields.dnsBootstrapPreset.value !== 'custom') {
    fields.dnsBootstrap.value = fields.dnsBootstrapPreset.value;
  }
  renderDnsPresetUi();
  formTouched = true;
  updateEditorState();
});

for (const element of Object.values(fields)) {
  element?.addEventListener('input', () => { formTouched = true; markFormInteraction(true); updateEditorState(); });
  element?.addEventListener('change', () => { formTouched = true; markFormInteraction(true); updateEditorState(); });
}

load().catch((error) => setStatus(format('status.initFailed', { error: error.message }), 'error', 'status.initFailed', { error: error.message }));
