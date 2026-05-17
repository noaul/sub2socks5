import { initLayout, LANGUAGE_CHANGE_EVENT, NODES_UPDATED_KEY, t, format, escapeHtml, escapeHtmlAttr } from './layout.js';
initLayout('nodes');

const statusEl = document.getElementById('node-status');
const groupsEl = document.getElementById('groups');
const chainsEl = document.getElementById('chains');
const availableNodeListEl = document.getElementById('available-node-list');
const groupsSectionBodyEl = document.getElementById('groups-section-body');
const chainsSectionBodyEl = document.getElementById('chains-section-body');
const toggleGroupsSectionButton = document.getElementById('toggle-groups-section');
const toggleChainsSectionButton = document.getElementById('toggle-chains-section');
const GROUP_TEST_URL_PRESETS = [
  'https://www.gstatic.com/generate_204',
  'https://www.google.com/generate_204',
  'https://cp.cloudflare.com/generate_204'
];

let state = {
  subscriptionNodes: [],
  manualNodes: [],
  groups: [],
  chains: [],
  availableOutbounds: [],
  fallbackStates: {}
};

let nodeDelayState = {};
const expandedGroups = new Set();
const expandedChains = new Set();
const CHECK_BATCH_SIZE = 5;
let groupsSectionCollapsed = false;
let chainsSectionCollapsed = false;

async function load() {
  const response = await fetch('/api/nodes');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || t('nodes.loadFailed'));
  }
  state = {
    ...data,
    chains: Array.isArray(data.chains) ? data.chains : []
  };
  render();
}

function render() {
  renderAvailableNodes();
  renderGroups();
  renderChains();
  renderSectionToggles();
}

function renderSectionToggles() {
  groupsSectionBodyEl.classList.toggle('is-hidden', groupsSectionCollapsed);
  chainsSectionBodyEl.classList.toggle('is-hidden', chainsSectionCollapsed);
  const groupsKey = groupsSectionCollapsed ? 'common.expand' : 'common.collapse';
  const chainsKey = chainsSectionCollapsed ? 'common.expand' : 'common.collapse';
  toggleGroupsSectionButton.textContent = t(groupsKey);
  toggleChainsSectionButton.textContent = t(chainsKey);
  toggleGroupsSectionButton.dataset.i18n = groupsKey;
  toggleChainsSectionButton.dataset.i18n = chainsKey;
}

function renderAvailableNodes() {
  const visibleNodes = getSelectableNodes();
  availableNodeListEl.innerHTML = '';

  if (!visibleNodes.length) {
    availableNodeListEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noNodes'))}</div></div>`;
    return;
  }

  for (const node of visibleNodes) {
    const delayState = nodeDelayState[node.tag];
    const delayText = delayState?.loading ? t('common.checking') : delayState?.text || t('common.check');
    const card = document.createElement('div');
    card.className = 'node-pill node-pill-checkable';
    card.innerHTML = `
      <div class="node-pill-main">
        <div class="node-pill-title">${escapeHtml(node.tag || '')}</div>
        <div class="node-pill-tags">
          <span class="node-pill-tag">${escapeHtml(node.type || '')}</span>
          <span class="node-pill-tag is-source">${escapeHtml(sourceLabel(node.source))}</span>
        </div>
      </div>
      <button type="button" class="node-check-button ${delayState?.loading ? 'is-loading' : ''}" data-check-node="${escapeHtmlAttr(node.tag)}" title="${escapeHtmlAttr(t('nodes.checkTitle'))}">${escapeHtml(delayText)}</button>
    `;
    availableNodeListEl.appendChild(card);
  }
}

function renderGroups() {
  groupsEl.innerHTML = '';
  if (!state.groups.length) {
    groupsEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noGroups'))}</div></div>`;
    return;
  }

  const selectableNodes = getSelectableNodesWithoutChains();
  for (const [index, group] of state.groups.entries()) {
    groupsEl.appendChild(buildGroupPanel(index, group, selectableNodes));
  }
}

function buildGroupPanel(index, group, selectableNodes) {
  const fallbackState = state.fallbackStates?.[group.tag] || null;
  const expanded = expandedGroups.has(index);
  const selectedMembers = Array.isArray(group.members) ? group.members : [];
  const summaryCards = selectedMembers.map((memberTag) => {
    const node = selectableNodes.find((item) => item.tag === memberTag);
    return node ? renderNodePill(node) : '';
  }).join('');

  const statusHtml = group.strategy === 'fallback'
    ? `
      <div class="kv-grid">
        <div class="kv-item">
          <div class="key">${escapeHtml(t('nodes.currentActive'))}</div>
          <div class="value">${escapeHtml(fallbackState?.current || group.members?.[0] || '')}</div>
        </div>
        <div class="kv-item">
          <div class="key">${escapeHtml(t('nodes.lastSwitched'))}</div>
          <div class="value">${escapeHtml(fallbackState?.updatedAt || '')}</div>
        </div>
      </div>
    `
    : '';

  const item = document.createElement('div');
  item.className = 'timeline-item group-panel';
  item.innerHTML = `
    <div class="group-panel-header">
      <div>
        <div class="title">${escapeHtml(group.tag || format('nodes.groupName', { index: index + 1 }))}</div>
        <div class="node-pill-tags">
          <span class="node-pill-tag">${escapeHtml(group.strategy || 'urltest')}</span>
          <span class="node-pill-tag is-source">${escapeHtml(format('common.nodesCount', { count: selectedMembers.length }))}</span>
        </div>
      </div>
      <button type="button" class="group-toggle" data-toggle-group="${index}">${expanded ? escapeHtml(t('common.collapse')) : escapeHtml(t('common.expand'))}</button>
    </div>
    <div class="node-pill-grid group-summary">
      ${summaryCards || `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noMembers'))}</div></div>`}
    </div>
    <div class="group-panel-body ${expanded ? '' : 'is-hidden'}">
      <div class="form-grid">
        <label><span>tag</span><input data-kind="group" data-index="${index}" data-field="tag" value="${escapeHtmlAttr(group.tag || '')}" /></label>
        <label>
          <span>${escapeHtml(t('nodes.strategy'))}</span>
          <select data-kind="group" data-index="${index}" data-field="strategy">
            <option value="urltest" ${group.strategy === 'urltest' ? 'selected' : ''}>urltest</option>
            <option value="fallback" ${group.strategy === 'fallback' ? 'selected' : ''}>fallback</option>
          </select>
        </label>
        <label>
          <span>${escapeHtml(t('nodes.testUrl'))}</span>
          <select data-kind="group-preset" data-index="${index}">
            ${buildGroupUrlPresetOptions(group.url)}
          </select>
        </label>
        <label><span>${escapeHtml(t('nodes.interval'))}</span><input data-kind="group" data-index="${index}" data-field="interval" value="${escapeHtmlAttr(group.interval || '10m')}" /></label>
        <label><span>${escapeHtml(t('nodes.timeoutMs'))}</span><input data-kind="group" data-index="${index}" data-field="timeoutMs" type="number" value="${escapeHtmlAttr(String(group.timeoutMs || 5000))}" /></label>
        <label class="${GROUP_TEST_URL_PRESETS.includes(group.url) ? 'is-hidden' : ''}"><span>${escapeHtml(t('nodes.customTestUrl'))}</span><input data-kind="group" data-index="${index}" data-field="url" value="${escapeHtmlAttr(group.url || 'https://www.gstatic.com/generate_204')}" /></label>
      </div>
      ${statusHtml}
      <div class="member-selector">${renderGroupMembers(index, group, selectableNodes)}</div>
      <div class="section-heading-actions">
        <button type="button" data-remove-group="${index}">${escapeHtml(t('common.delete'))}</button>
      </div>
    </div>
  `;
  return item;
}

function renderChains() {
  chainsEl.innerHTML = '';
  if (!state.chains.length) {
    chainsEl.innerHTML = `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noChains'))}</div></div>`;
    return;
  }

  const selectableNodes = getSelectableNodesWithoutChains();
  for (const [index, chain] of state.chains.entries()) {
    const expanded = expandedChains.has(index);
    const selectedMembers = Array.isArray(chain.members) ? chain.members : [];
    const chainCards = selectedMembers.map((memberTag, memberIndex) => {
      const node = selectableNodes.find((item) => item.tag === memberTag);
      const card = node ? renderNodePill(node) : '';
      const arrow = memberIndex < selectedMembers.length - 1 ? '<div class="chain-arrow">→</div>' : '';
      return `<div class="chain-segment">${card}${arrow}</div>`;
    }).join('');

    const item = document.createElement('div');
    item.className = 'timeline-item group-panel';
    item.innerHTML = `
      <div class="group-panel-header">
        <div>
          <div class="title">${escapeHtml(chain.tag || format('nodes.chainName', { index: index + 1 }))}</div>
          <div class="node-pill-tags">
            <span class="node-pill-tag">chain</span>
            <span class="node-pill-tag is-source">${escapeHtml(format('common.nodesCount', { count: selectedMembers.length }))}</span>
          </div>
        </div>
        <button type="button" class="group-toggle" data-toggle-chain="${index}">${expanded ? escapeHtml(t('common.collapse')) : escapeHtml(t('common.expand'))}</button>
      </div>
      <div class="chain-summary">${chainCards || `<div class="timeline-item"><div class="title">${escapeHtml(t('common.noMembers'))}</div></div>`}</div>
      <div class="group-panel-body ${expanded ? '' : 'is-hidden'}">
        <div class="form-grid">
          <label><span>${escapeHtml(t('nodes.name'))}</span><input data-kind="chain" data-index="${index}" data-field="tag" value="${escapeHtmlAttr(chain.tag || '')}" /></label>
        </div>
        <div class="member-selector">${renderChainMembers(index, chain, selectableNodes)}</div>
        <div class="section-heading-actions">
          <button type="button" data-remove-chain="${index}">${escapeHtml(t('common.delete'))}</button>
        </div>
      </div>
    `;
    chainsEl.appendChild(item);
  }
}

function renderGroupMembers(index, group, selectableNodes) {
  const selected = Array.isArray(group.members) ? group.members : [];
  const rows = selected.map((memberTag, memberIndex) => `
    <div class="member-row">
      <select data-group-member-select="${index}" data-member-index="${memberIndex}">
        ${buildMemberOptions(selectableNodes, selected, memberTag)}
      </select>
      <button type="button" class="member-remove" data-remove-member="${index}" data-member-index="${memberIndex}">${escapeHtml(t('common.delete'))}</button>
    </div>
  `);
  const remaining = selectableNodes.filter((node) => !selected.includes(node.tag));
  rows.push(`<button type="button" class="member-add" data-add-member="${index}" ${remaining.length ? '' : 'disabled'}>${escapeHtml(t('nodes.addNode'))}</button>`);
  return rows.join('');
}

function renderChainMembers(index, chain, selectableNodes) {
  const selected = Array.isArray(chain.members) ? chain.members : [];
  const rows = selected.map((memberTag, memberIndex) => `
    <div class="member-row">
      <select data-chain-member-select="${index}" data-member-index="${memberIndex}">
        ${buildMemberOptions(selectableNodes, selected, memberTag)}
      </select>
      <button type="button" class="member-remove" data-remove-chain-member="${index}" data-member-index="${memberIndex}">${escapeHtml(t('common.delete'))}</button>
    </div>
  `);
  const remaining = selectableNodes.filter((node) => !selected.includes(node.tag));
  rows.push(`<button type="button" class="member-add" data-add-chain-member="${index}" ${remaining.length ? '' : 'disabled'}>${escapeHtml(t('nodes.addNode'))}</button>`);
  return rows.join('');
}

function buildMemberOptions(selectableNodes, selectedTags, currentTag) {
  return selectableNodes
    .filter((node) => node.tag === currentTag || !selectedTags.includes(node.tag))
    .map((node) => `<option value="${escapeHtmlAttr(node.tag)}" ${node.tag === currentTag ? 'selected' : ''}>${escapeHtml(node.label || node.tag)}</option>`)
    .join('');
}

function buildGroupUrlPresetOptions(currentUrl) {
  const preset = GROUP_TEST_URL_PRESETS.includes(currentUrl) ? currentUrl : 'custom';
  return [
    ...GROUP_TEST_URL_PRESETS.map((url) => `<option value="${escapeHtmlAttr(url)}" ${preset === url ? 'selected' : ''}>${escapeHtml(url)}</option>`),
    `<option value="custom" ${preset === 'custom' ? 'selected' : ''}>${escapeHtml(t('common.custom'))}</option>`
  ].join('');
}

function getSelectableNodesWithoutChains() {
  return state.availableOutbounds.filter((item) => !['proxy', 'auto', 'block'].includes(item.tag) && item.source !== 'chain');
}

function getSelectableNodes() {
  return state.availableOutbounds.filter((item) => !['proxy', 'auto', 'block'].includes(item.tag));
}

function renderNodePill(node) {
  return `
    <div class="node-pill">
      <div class="node-pill-title">${escapeHtml(node.tag || '')}</div>
      <div class="node-pill-tags">
        <span class="node-pill-tag">${escapeHtml(node.type || '')}</span>
        <span class="node-pill-tag is-source">${escapeHtml(sourceLabel(node.source))}</span>
      </div>
    </div>
  `;
}

function sourceLabel(source) {
  if (source === 'subscription') return t('common.subscription');
  if (source === 'manual') return t('common.manual');
  if (source === 'group') return t('common.group');
  if (source === 'chain') return t('common.chain');
  if (source === 'builtin') return t('common.builtin');
  return source || '';
}

async function checkNode(tag) {
  nodeDelayState[tag] = { loading: true, text: t('common.checking') };
  renderAvailableNodes();
  try {
    const response = await fetch('/api/nodes/check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tags: [tag] })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || t('nodes.checkFailed'));
    }
    nodeDelayState[tag] = data.results?.[tag]?.ok
      ? {
          text: data.results[tag].text,
          checkedAt: data.results[tag].checkedAt,
          checkedTag: data.results[tag].checkedTag
        }
      : { text: t('common.failed'), error: data.results?.[tag]?.error || t('nodes.checkFailed') };
    setStatus(format('nodes.checkNodeDone', { tag }), 'success', 'nodes.checkNodeDone', { tag });
  } catch (error) {
    nodeDelayState[tag] = { text: t('common.failed'), error: error.message };
    setStatus(error.message, 'error');
  }
  renderAvailableNodes();
}

async function checkAllNodes() {
  const tags = getSelectableNodes().map((item) => item.tag);
  if (!tags.length) {
    setStatus(t('nodes.noCheckableNodes'), 'idle', 'nodes.noCheckableNodes');
    return;
  }

  setStatus(t('nodes.checkAllProgress'), 'loading', 'nodes.checkAllProgress');
  for (let index = 0; index < tags.length; index += CHECK_BATCH_SIZE) {
    const batch = tags.slice(index, index + CHECK_BATCH_SIZE);
    for (const tag of batch) {
      nodeDelayState[tag] = { loading: true, text: t('common.checking') };
    }
    renderAvailableNodes();

    try {
      const response = await fetch('/api/nodes/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tags: batch })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || t('nodes.batchCheckFailed'));
      }
      for (const tag of batch) {
        const result = data.results?.[tag];
        nodeDelayState[tag] = result?.ok
          ? { text: result.text, checkedAt: result.checkedAt, checkedTag: result.checkedTag }
          : { text: t('common.failed'), error: result?.error || t('nodes.checkFailed') };
      }
      renderAvailableNodes();
    } catch (error) {
      for (const tag of batch) {
        nodeDelayState[tag] = { text: t('common.failed'), error: error.message };
      }
      renderAvailableNodes();
      setStatus(error.message, 'error');
      return;
    }
  }

  setStatus(t('nodes.checkAllDone'), 'success', 'nodes.checkAllDone');
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


document.getElementById('open-node-editor').addEventListener('click', () => {
  window.location.href = '/nodes-edit.html';
});

document.getElementById('check-all-nodes').addEventListener('click', () => {
  checkAllNodes().catch((error) => setStatus(error.message, 'error'));
});

document.getElementById('add-group').addEventListener('click', () => {
  state.groups.push({ tag: '', strategy: 'urltest', url: 'https://www.gstatic.com/generate_204', interval: '10m', timeoutMs: 5000, members: [] });
  expandedGroups.add(state.groups.length - 1);
  renderGroups();
});

document.getElementById('add-chain').addEventListener('click', () => {
  state.chains.push({ tag: '', members: [] });
  expandedChains.add(state.chains.length - 1);
  renderChains();
});

toggleGroupsSectionButton.addEventListener('click', () => {
  groupsSectionCollapsed = !groupsSectionCollapsed;
  renderSectionToggles();
});

toggleChainsSectionButton.addEventListener('click', () => {
  chainsSectionCollapsed = !chainsSectionCollapsed;
  renderSectionToggles();
});

document.getElementById('save-nodes').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        manualNodes: state.manualNodes,
        groups: state.groups,
        chains: state.chains,
        disabledSubscriptionTags: state.disabledSubscriptionTags || []
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || t('nodes.saveFailed'));
    }
    localStorage.setItem(NODES_UPDATED_KEY, String(Date.now()));
    setStatus(t('nodes.saved'), 'success', 'nodes.saved');
    await load();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  if (target.dataset.kind === 'group') {
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    state.groups[index][field] = field === 'timeoutMs' ? Number(target.value || 0) : target.value;
  }

  if (target.dataset.kind === 'group-preset') {
    const index = Number(target.dataset.index);
    if (target.value !== 'custom') {
      state.groups[index].url = target.value;
    }
    renderGroups();
  }

  if (target.dataset.kind === 'chain') {
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    state.chains[index][field] = target.value;
  }

  if (target.dataset.groupMemberSelect) {
    const groupIndex = Number(target.dataset.groupMemberSelect);
    const memberIndex = Number(target.dataset.memberIndex);
    state.groups[groupIndex].members[memberIndex] = target.value;
    renderGroups();
  }

  if (target.dataset.chainMemberSelect) {
    const chainIndex = Number(target.dataset.chainMemberSelect);
    const memberIndex = Number(target.dataset.memberIndex);
    state.chains[chainIndex].members[memberIndex] = target.value;
    renderChains();
  }
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.toggleGroup) {
    const groupIndex = Number(target.dataset.toggleGroup);
    expandedGroups.has(groupIndex) ? expandedGroups.delete(groupIndex) : expandedGroups.add(groupIndex);
    renderGroups();
  }

  if (target.dataset.toggleChain) {
    const chainIndex = Number(target.dataset.toggleChain);
    expandedChains.has(chainIndex) ? expandedChains.delete(chainIndex) : expandedChains.add(chainIndex);
    renderChains();
  }

  if (target.dataset.removeGroup) {
    const index = Number(target.dataset.removeGroup);
    state.groups.splice(index, 1);
    renderGroups();
  }

  if (target.dataset.removeChain) {
    const index = Number(target.dataset.removeChain);
    state.chains.splice(index, 1);
    renderChains();
  }

  if (target.dataset.addMember) {
    const groupIndex = Number(target.dataset.addMember);
    const selectableNodes = getSelectableNodesWithoutChains();
    const selected = new Set(state.groups[groupIndex].members || []);
    const nextNode = selectableNodes.find((node) => !selected.has(node.tag));
    if (nextNode) {
      state.groups[groupIndex].members.push(nextNode.tag);
      renderGroups();
    }
  }

  if (target.dataset.addChainMember) {
    const chainIndex = Number(target.dataset.addChainMember);
    const selectableNodes = getSelectableNodesWithoutChains();
    const selected = new Set(state.chains[chainIndex].members || []);
    const nextNode = selectableNodes.find((node) => !selected.has(node.tag));
    if (nextNode) {
      state.chains[chainIndex].members.push(nextNode.tag);
      renderChains();
    }
  }

  if (target.dataset.removeMember) {
    const groupIndex = Number(target.dataset.removeMember);
    const memberIndex = Number(target.dataset.memberIndex);
    state.groups[groupIndex].members.splice(memberIndex, 1);
    renderGroups();
  }

  if (target.dataset.removeChainMember) {
    const chainIndex = Number(target.dataset.removeChainMember);
    const memberIndex = Number(target.dataset.memberIndex);
    state.chains[chainIndex].members.splice(memberIndex, 1);
    renderChains();
  }

  if (target.dataset.checkNode) {
    checkNode(target.dataset.checkNode).catch((error) => setStatus(error.message, 'error'));
  }
});

window.addEventListener(LANGUAGE_CHANGE_EVENT, render);

load().catch((error) => setStatus(error.message, 'error'));
