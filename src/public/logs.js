import {
  initLayout, loadConfig, setStatus, renderKeyValue, renderLogTimeline,
  buildGeneratedSummary, refreshSidebarStatus, LANGUAGE_CHANGE_EVENT, t, format
} from './layout.js';

initLayout('logs');

const infoViews = {
  logs: setupInfoView('logs'),
  generated: setupInfoView('generated')
};

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
  const state = infoViews[name];
  if (!state) return;
  state.formViewEl.classList.toggle('is-hidden', mode !== 'form');
  state.jsonViewEl.classList.toggle('is-hidden', mode !== 'json');
  state.formButton.classList.toggle('is-active', mode === 'form');
  state.jsonButton.classList.toggle('is-active', mode === 'json');
}

async function load() {
  const data = await loadConfig();
  render(data);
}

function render(data = latestLogsData) {
  if (!data) return;
  // Runtime logs
  renderLogTimeline(document.getElementById('logs-form'), data.logs?.logs || []);
  document.getElementById('logs-json').textContent = (data.runtime?.logs || []).join('\n') || t('common.noLogs');

  // Generated config
  renderKeyValue(document.getElementById('generated-form'), buildGeneratedSummary(data.generated));
  document.getElementById('generated-json').textContent = JSON.stringify(data.generated, null, 2);

  refreshSidebarStatus();
  const running = data.runtime?.running;
  setStatus(running ? t('status.runningText') : t('common.ready'), running ? 'success' : 'idle', running ? 'status.runningText' : 'common.ready');
}

let latestLogsData = null;

async function loadAndStore() {
  latestLogsData = await loadConfig();
  render(latestLogsData);
}

window.addEventListener(LANGUAGE_CHANGE_EVENT, () => render(latestLogsData));

loadAndStore().catch((error) => setStatus(format('status.initFailed', { error: error.message }), 'error', 'status.initFailed', { error: error.message }));

setInterval(async () => {
  try { await loadAndStore(); } catch {}
}, 3000);
