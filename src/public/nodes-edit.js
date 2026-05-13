import { initLayout, LANGUAGE_CHANGE_EVENT, t, format } from './layout.js';
initLayout('nodes');

const statusEl = document.getElementById('edit-node-status');
const inputEl = document.getElementById('edit-manual-node-input');
const importResultEl = document.getElementById('edit-manual-import-result');
const nodeListEl = document.getElementById('edit-node-list');
const formTypeEl = document.getElementById('manual-form-type');
const formTagEl = document.getElementById('manual-form-tag');
const formServerEl = document.getElementById('manual-form-server');
const formPortEl = document.getElementById('manual-form-port');
const formFieldsEl = document.getElementById('manual-form-fields');
const NODES_UPDATED_KEY = 'sub2socks5:nodes-updated-at';

const FORM_PROTOCOLS = {
  vless: [
    { key: 'uuid', label: 'UUID' },
    { key: 'flow', label: 'Flow' },
    { key: 'tlsServerName', label: 'SNI' }
  ],
  vmess: [
    { key: 'uuid', label: 'UUID' },
    { key: 'security', label: 'Security', defaultValue: 'auto' },
    { key: 'alter_id', label: 'Alter ID', defaultValue: '0' }
  ],
  trojan: [
    { key: 'password', label: 'Password' },
    { key: 'tlsServerName', label: 'SNI' }
  ],
  shadowsocks: [
    { key: 'method', label: 'Method' },
    { key: 'password', label: 'Password' }
  ],
  socks: [
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password' }
  ],
  hysteria2: [
    { key: 'password', label: 'Password' },
    { key: 'tlsServerName', label: 'SNI' }
  ],
  tuic: [
    { key: 'uuid', label: 'UUID' },
    { key: 'password', label: 'Password' }
  ]
};

let state = {
  subscriptionNodes: [],
  disabledSubscriptionTags: [],
  manualNodes: [],
  groups: [],
  availableOutbounds: [],
  fallbackStates: {}
};

async function load() {
  const response = await fetch('/api/nodes');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || t('nodesEdit.loadFailed'));
  }
  state = data;
  render();
}

function render() {
  renderImportTabs();
  renderFormFields();
  renderNodeList();
}

function renderImportTabs() {
  setTab('form');
  if (!formTypeEl.options.length) {
    for (const key of Object.keys(FORM_PROTOCOLS)) {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = key;
      formTypeEl.appendChild(option);
    }
    formTypeEl.value = 'vless';
    formPortEl.value = '443';
  }
}

function setTab(tab) {
  const isForm = tab === 'form';
  document.getElementById('node-import-tab-form').classList.toggle('is-active', isForm);
  document.getElementById('node-import-tab-raw').classList.toggle('is-active', !isForm);
  document.getElementById('node-import-form-panel').classList.toggle('is-hidden', !isForm);
  document.getElementById('node-import-form-panel').classList.toggle('is-active', isForm);
  document.getElementById('node-import-raw-panel').classList.toggle('is-hidden', isForm);
  document.getElementById('node-import-raw-panel').classList.toggle('is-active', !isForm);
}

function renderFormFields() {
  const type = formTypeEl.value || 'vless';
  const fields = FORM_PROTOCOLS[type] || [];
  formFieldsEl.innerHTML = fields.map((field) => `
    <label>
      <span>${escapeHtml(field.label)}</span>
      <input data-manual-field="${escapeHtml(field.key)}" value="${escapeHtml(field.defaultValue || '')}" />
    </label>
  `).join('');
  formPortEl.value = type === 'socks' ? '1080' : (formPortEl.value || '443');
}

function renderNodeList() {
  nodeListEl.innerHTML = '';
  const nodes = [
    ...state.subscriptionNodes.filter((node) => node.tag !== 'direct').map((node) => ({ ...node, source: 'subscription' })),
    ...state.manualNodes.map((node) => ({ ...node, source: 'manual' }))
  ];
  if (!nodes.length) {
    nodeListEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noNodes'))}</div></div>`;
    return;
  }

  for (const node of nodes) {
    const isDisabled = node.source === 'subscription'
      ? state.disabledSubscriptionTags.includes(node.tag)
      : false;
    const card = document.createElement('div');
    card.className = 'node-edit-card';
    const actionAttr = node.source === 'manual'
      ? `data-delete-manual-node="${escapeHtmlAttr(node.tag)}"`
      : isDisabled
        ? `data-enable-subscription-node="${escapeHtmlAttr(node.tag)}"`
        : `data-delete-subscription-node="${escapeHtmlAttr(node.tag)}"`;
    const actionClass = node.source === 'manual'
      ? 'danger-icon-button'
      : isDisabled
        ? 'success-text-button'
        : 'danger-icon-button';
    const actionText = node.source === 'manual'
      ? '🗑'
      : isDisabled
        ? t('common.enable')
        : '🗑';
    const titleClass = isDisabled ? 'node-pill-title is-disabled' : 'node-pill-title';
    card.innerHTML = `
      <div class="node-pill">
        <div class="${titleClass}">${escapeHtml(node.tag || '')}</div>
        <div class="node-pill-tags">
          <span class="node-pill-tag">${escapeHtml(node.type || '')}</span>
          <span class="node-pill-tag is-source">${escapeHtml(node.source === 'manual' ? t('common.manual') : t('common.subscription'))}</span>
        </div>
      </div>
      <button type="button" class="${actionClass}" ${actionAttr} title="${escapeHtmlAttr(node.source === 'manual' ? t('nodesEdit.deleteNode') : (isDisabled ? t('nodesEdit.enableNode') : t('nodesEdit.disableNode')))}">${escapeHtml(actionText)}</button>
    `;
    nodeListEl.appendChild(card);
  }
}

function renderImportResult(result) {
  if (!result) {
    importResultEl.innerHTML = '';
    return;
  }

  const warnings = Array.isArray(result.warnings) ? result.warnings : [];
  const items = [];
  if (result.nodes?.length) {
    items.push(`<div class="timeline-item"><div class="title">${escapeHtml(format('nodesEdit.parseSuccess', { count: result.nodes.length }))}</div></div>`);
  }
  for (const warning of warnings) {
    items.push(`<div class="timeline-item"><div class="title">${escapeHtml(t('nodesEdit.notice'))}</div><div class="details">${escapeHtml(warning)}</div></div>`);
  }
  importResultEl.innerHTML = items.join('') || `<div class="timeline-item"><div class="title">${escapeHtml(t('nodesEdit.noImportableNodes'))}</div></div>`;
}

function buildFormNode() {
  const type = formTypeEl.value;
  const node = {
    type,
    tag: formTagEl.value.trim(),
    server: formServerEl.value.trim(),
    server_port: Number(formPortEl.value || 0)
  };

  for (const fieldEl of formFieldsEl.querySelectorAll('[data-manual-field]')) {
    const key = fieldEl.dataset.manualField;
    const value = fieldEl.value.trim();
    if (!value) continue;
    if (key === 'tlsServerName') {
      node.tls = {
        enabled: true,
        server_name: value,
        insecure: false
      };
      continue;
    }
    node[key] = key === 'alter_id' ? Number(value) : value;
  }

  if (!node.tag || !node.server || !node.server_port) {
    throw new Error(t('nodesEdit.requiredFields'));
  }

  return node;
}

function setStatus(message, kind = 'idle', i18nKey = null, replacements = {}) {
  statusEl.textContent = message;
  statusEl.className = `status-bar is-${kind}`;
  if (i18nKey) {
    statusEl.dataset.statusI18n = i18nKey;
    statusEl.dataset.statusI18nArgs = JSON.stringify(replacements);
  } else {
    delete statusEl.dataset.statusI18n;
    delete statusEl.dataset.statusI18nArgs;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttr(value) {
  return escapeHtml(value);
}


document.getElementById('node-import-tab-form').addEventListener('click', () => setTab('form'));
document.getElementById('node-import-tab-raw').addEventListener('click', () => setTab('raw'));
formTypeEl.addEventListener('change', () => renderFormFields());

document.getElementById('add-manual-form-node').addEventListener('click', () => {
  try {
    const node = buildFormNode();
    state.manualNodes.push(node);
    renderNodeList();
    setStatus(format('nodesEdit.addedManual', { tag: node.tag }), 'success', 'nodesEdit.addedManual', { tag: node.tag });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('import-edit-manual-nodes').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/nodes/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw: inputEl.value })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || t('nodesEdit.importFailed'));
    }
    state.manualNodes.push(...(data.nodes || []));
    inputEl.value = '';
    renderImportResult(data);
    renderNodeList();
    setStatus(format('nodesEdit.importSuccess', { count: data.nodes?.length || 0 }), 'success', 'nodesEdit.importSuccess', { count: data.nodes?.length || 0 });
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('save-edit-nodes').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        manualNodes: state.manualNodes,
        groups: state.groups,
        disabledSubscriptionTags: state.disabledSubscriptionTags
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || t('nodesEdit.saveFailed'));
    }
    localStorage.setItem(NODES_UPDATED_KEY, String(Date.now()));
    setStatus(t('nodesEdit.saved'), 'success', 'nodesEdit.saved');
    await load();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.deleteManualNode) {
    state.manualNodes = state.manualNodes.filter((node) => node.tag !== target.dataset.deleteManualNode);
    renderNodeList();
    setStatus(t('nodesEdit.removedManual'), 'idle', 'nodesEdit.removedManual');
  }

  if (target.dataset.deleteSubscriptionNode) {
    if (!state.disabledSubscriptionTags.includes(target.dataset.deleteSubscriptionNode)) {
      state.disabledSubscriptionTags.push(target.dataset.deleteSubscriptionNode);
    }
    renderNodeList();
    setStatus(t('nodesEdit.disabledSubscription'), 'idle', 'nodesEdit.disabledSubscription');
  }

  if (target.dataset.enableSubscriptionNode) {
    state.disabledSubscriptionTags = state.disabledSubscriptionTags.filter((tag) => tag !== target.dataset.enableSubscriptionNode);
    renderNodeList();
    setStatus(t('nodesEdit.enabledSubscription'), 'success', 'nodesEdit.enabledSubscription');
  }
});

window.addEventListener(LANGUAGE_CHANGE_EVENT, render);

load().catch((error) => setStatus(error.message, 'error'));
