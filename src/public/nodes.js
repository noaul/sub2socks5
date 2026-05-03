const statusEl = document.getElementById('node-status');
const manualNodesEl = document.getElementById('manual-nodes');
const groupsEl = document.getElementById('groups');
const availableNodeListEl = document.getElementById('available-node-list');
const manualNodeInputEl = document.getElementById('manual-node-input');
const NODES_UPDATED_KEY = 'sub2socks5:nodes-updated-at';
const GROUP_TEST_URL_PRESETS = [
  'https://www.gstatic.com/generate_204',
  'https://www.google.com/generate_204',
  'https://cp.cloudflare.com/generate_204'
];

let state = {
  subscriptionNodes: [],
  manualNodes: [],
  groups: [],
  availableOutbounds: [],
  fallbackStates: {}
};

const expandedGroups = new Set();

async function load() {
  const response = await fetch('/api/nodes');
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || '加载节点失败');
  }
  state = data;
  render();
}

function render() {
  renderAvailableNodes();
  renderManualNodes();
  renderGroups();
}

function renderAvailableNodes() {
  const visibleNodes = state.availableOutbounds.filter((item) => !['proxy', 'auto', 'block'].includes(item.tag));
  availableNodeListEl.innerHTML = '';

  if (!visibleNodes.length) {
    availableNodeListEl.innerHTML = '<div class="timeline-item"><div class="title">暂无节点</div></div>';
    return;
  }

  for (const node of visibleNodes) {
    const card = document.createElement('div');
    card.className = 'node-pill';
    card.innerHTML = `
      <div class="node-pill-title">${escapeHtml(node.tag || '')}</div>
      <div class="node-pill-tags">
        <span class="node-pill-tag">${escapeHtml(node.type || '')}</span>
        <span class="node-pill-tag is-source">${escapeHtml(sourceLabel(node.source))}</span>
      </div>
    `;
    availableNodeListEl.appendChild(card);
  }
}

function renderManualNodes() {
  manualNodesEl.innerHTML = '';
  if (!state.manualNodes.length) {
    manualNodesEl.innerHTML = '<div class="timeline-item"><div class="title">暂无手动节点</div></div>';
    return;
  }

  for (const [index, node] of state.manualNodes.entries()) {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="title">手动节点 ${index + 1}</div>
      <div class="form-grid">
        <label><span>tag</span><input data-kind="manual" data-index="${index}" data-field="tag" value="${escapeHtmlAttr(node.tag || '')}" /></label>
        <label><span>type</span><input data-kind="manual" data-index="${index}" data-field="type" value="${escapeHtmlAttr(node.type || 'vless')}" /></label>
        <label><span>server</span><input data-kind="manual" data-index="${index}" data-field="server" value="${escapeHtmlAttr(node.server || '')}" /></label>
        <label><span>server_port</span><input data-kind="manual" data-index="${index}" data-field="server_port" type="number" value="${escapeHtmlAttr(String(node.server_port || 443))}" /></label>
        <label><span>uuid / username</span><input data-kind="manual" data-index="${index}" data-field="uuid" value="${escapeHtmlAttr(node.uuid || '')}" /></label>
        <label><span>password</span><input data-kind="manual" data-index="${index}" data-field="password" value="${escapeHtmlAttr(node.password || '')}" /></label>
      </div>
      <div class="section-heading-actions">
        <button type="button" data-remove-manual="${index}">删除</button>
      </div>
    `;
    manualNodesEl.appendChild(item);
  }
}

function renderGroups() {
  groupsEl.innerHTML = '';
  if (!state.groups.length) {
    groupsEl.innerHTML = '<div class="timeline-item"><div class="title">暂无节点组</div></div>';
    return;
  }

  const selectableNodes = getSelectableNodes();

  for (const [index, group] of state.groups.entries()) {
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
            <div class="key">当前活跃节点</div>
            <div class="value">${escapeHtml(fallbackState?.current || group.members?.[0] || '')}</div>
          </div>
          <div class="kv-item">
            <div class="key">最近切换时间</div>
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
          <div class="title">${escapeHtml(group.tag || `节点组 ${index + 1}`)}</div>
          <div class="node-pill-tags">
            <span class="node-pill-tag">${escapeHtml(group.strategy || 'urltest')}</span>
            <span class="node-pill-tag is-source">${selectedMembers.length} 个节点</span>
          </div>
        </div>
        <button type="button" class="group-toggle" data-toggle-group="${index}">${expanded ? '收起' : '展开'}</button>
      </div>
      <div class="node-pill-grid group-summary">
        ${summaryCards || '<div class="timeline-item"><div class="title">暂无成员</div></div>'}
      </div>
      <div class="group-panel-body ${expanded ? '' : 'is-hidden'}" data-group-body="${index}">
        <div class="form-grid">
          <label><span>tag</span><input data-kind="group" data-index="${index}" data-field="tag" value="${escapeHtmlAttr(group.tag || '')}" /></label>
          <label>
            <span>策略</span>
            <select data-kind="group" data-index="${index}" data-field="strategy">
              <option value="urltest" ${group.strategy === 'urltest' ? 'selected' : ''}>urltest</option>
              <option value="fallback" ${group.strategy === 'fallback' ? 'selected' : ''}>fallback</option>
            </select>
          </label>
          <label>
            <span>测试地址</span>
            <select data-kind="group-preset" data-index="${index}" data-field="urlPreset">
              ${buildGroupUrlPresetOptions(group.url)}
            </select>
          </label>
          <label>
            <span>测试间隔</span>
            <input data-kind="group" data-index="${index}" data-field="interval" value="${escapeHtmlAttr(group.interval || '10m')}" />
          </label>
          <label>
            <span>超时毫秒</span>
            <input data-kind="group" data-index="${index}" data-field="timeoutMs" type="number" min="1000" step="500" value="${escapeHtmlAttr(String(group.timeoutMs || 5000))}" />
          </label>
          <label class="${GROUP_TEST_URL_PRESETS.includes(group.url) ? 'is-hidden' : ''}">
            <span>自定义测试地址</span>
            <input data-kind="group" data-index="${index}" data-field="url" value="${escapeHtmlAttr(group.url || 'https://www.gstatic.com/generate_204')}" />
          </label>
        </div>
        ${statusHtml}
        <div class="member-selector" data-group-members="${index}">
          ${renderGroupMembers(index, group, selectableNodes)}
        </div>
        <div class="section-heading-actions">
          <button type="button" data-remove-group="${index}">删除</button>
        </div>
      </div>
    `;
    groupsEl.appendChild(item);
  }
}

function renderGroupMembers(index, group, selectableNodes) {
  const selected = Array.isArray(group.members) ? group.members : [];
  const rows = selected.map((memberTag, memberIndex) => {
    const options = buildMemberOptions(selectableNodes, selected, memberTag);
    return `
      <div class="member-row">
        <select data-group-member-select="${index}" data-member-index="${memberIndex}">
          ${options}
        </select>
        <button type="button" class="member-remove" data-remove-member="${index}" data-member-index="${memberIndex}">删除</button>
      </div>
    `;
  });

  const remaining = selectableNodes.filter((node) => !selected.includes(node.tag));
  rows.push(`
    <button type="button" class="member-add" data-add-member="${index}" ${remaining.length ? '' : 'disabled'}>+ 添加节点</button>
  `);
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
    `<option value="custom" ${preset === 'custom' ? 'selected' : ''}>自定义</option>`
  ].join('');
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
  if (source === 'subscription') return '订阅';
  if (source === 'manual') return '手动';
  if (source === 'group') return '节点组';
  if (source === 'builtin') return '内置';
  return source || '';
}

function setStatus(message, kind = 'idle') {
  statusEl.textContent = message;
  statusEl.className = `status-bar is-${kind}`;
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

document.getElementById('back-home').addEventListener('click', () => {
  window.location.href = '/';
});

document.getElementById('import-manual-nodes').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/nodes/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ raw: manualNodeInputEl.value })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || '导入失败');
    }
    state.manualNodes.push(...(data.nodes || []));
    manualNodeInputEl.value = '';
    renderManualNodes();
    renderAvailableNodes();
    setStatus(`成功导入 ${data.nodes?.length || 0} 个节点`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.getElementById('add-group').addEventListener('click', () => {
  state.groups.push({
    tag: '',
    strategy: 'urltest',
    url: 'https://www.gstatic.com/generate_204',
    interval: '10m',
    timeoutMs: 5000,
    members: []
  });
  expandedGroups.add(state.groups.length - 1);
  renderGroups();
});

document.getElementById('save-nodes').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        manualNodes: state.manualNodes,
        groups: state.groups
      })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || '保存失败');
    }
    localStorage.setItem(NODES_UPDATED_KEY, String(Date.now()));
    setStatus('节点配置已保存', 'success');
    await load();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

document.addEventListener('input', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  if (target.dataset.kind === 'manual') {
    const index = Number(target.dataset.index);
    const field = target.dataset.field;
    state.manualNodes[index][field] = field === 'server_port' ? Number(target.value || 0) : target.value;
  }

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

  if (target.dataset.groupMemberSelect) {
    const groupIndex = Number(target.dataset.groupMemberSelect);
    const memberIndex = Number(target.dataset.memberIndex);
    state.groups[groupIndex].members[memberIndex] = target.value;
    renderGroups();
  }
});

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.toggleGroup) {
    const groupIndex = Number(target.dataset.toggleGroup);
    if (expandedGroups.has(groupIndex)) {
      expandedGroups.delete(groupIndex);
    } else {
      expandedGroups.add(groupIndex);
    }
    renderGroups();
  }

  if (target.dataset.removeManual) {
    state.manualNodes.splice(Number(target.dataset.removeManual), 1);
    renderManualNodes();
    renderAvailableNodes();
  }

  if (target.dataset.removeGroup) {
    const index = Number(target.dataset.removeGroup);
    state.groups.splice(index, 1);
    expandedGroups.delete(index);
    const next = [...expandedGroups].map((item) => (item > index ? item - 1 : item));
    expandedGroups.clear();
    for (const itemIndex of next) expandedGroups.add(itemIndex);
    renderGroups();
  }

  if (target.dataset.addMember) {
    const groupIndex = Number(target.dataset.addMember);
    const selectableNodes = getSelectableNodes();
    const selected = new Set(state.groups[groupIndex].members || []);
    const nextNode = selectableNodes.find((node) => !selected.has(node.tag));
    if (nextNode) {
      state.groups[groupIndex].members.push(nextNode.tag);
      renderGroups();
    }
  }

  if (target.dataset.removeMember) {
    const groupIndex = Number(target.dataset.removeMember);
    const memberIndex = Number(target.dataset.memberIndex);
    state.groups[groupIndex].members.splice(memberIndex, 1);
    renderGroups();
  }
});

load().catch((error) => setStatus(error.message, 'error'));
