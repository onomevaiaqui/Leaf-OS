const $ = (selector) => document.querySelector(selector);
const dialog = $('#settings');
const controlsDialog = $('#controlsDialog');
const preflightDialog = $('#preflightDialog');
let state;
let sources = [];
let stream;
let localStream;
let activeGamepad;
let telemetryRecording = false;
let telemetryLog = [];
let recordingOrigin;
let preDiveReleased = false;
const mappingKey = 'leaf-os-control-mapping';
const defaultControlMapping = { surge: 1, sway: 0, heave: 3, yaw: 2 };
let controlMapping = { ...defaultControlMapping };

try { controlMapping = { ...defaultControlMapping, ...JSON.parse(localStorage.getItem(mappingKey) || '{}') }; } catch { /* usa o padrão */ }

function populateMappingControls() {
  const options = Array.from({ length: 8 }, (_, axis) => `<option value="${axis}">Eixo ${axis + 1}</option>`).join('');
  [['mapSurge', 'surge'], ['mapSway', 'sway'], ['mapHeave', 'heave'], ['mapYaw', 'yaw']].forEach(([id, action]) => {
    $(`#${id}`).innerHTML = options;
    $(`#${id}`).value = controlMapping[action];
  });
}

function setSources(nextSources) {
  sources = nextSources;
  const select = $('#cameraSource');
  select.innerHTML = '<option value="auto">Detectar automaticamente</option><option value="browser:local">Webcam deste computador (teste)</option>' + sources.map((source) => `<option value="${source.id}">${source.name}</option>`).join('');
  select.value = state?.camera.source || 'auto';
}

function renderStream(nextStream) {
  stream = nextStream;
  $('#stream').textContent = stream.running ? 'PARAR VÍDEO' : 'INICIAR VÍDEO';
  const viewer = $('#webrtcViewer');
  if (stream.running) {
    stopLocalPreview();
    viewer.src = `http://${window.location.hostname}:8889/${stream.streamPath}`;
    viewer.hidden = false;
  } else {
    viewer.removeAttribute('src');
    viewer.hidden = true;
  }
}

async function startLocalPreview() {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('Este navegador não permite acesso à webcam.');
  localStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false });
  const viewer = $('#localViewer');
  viewer.srcObject = localStream;
  viewer.hidden = false;
  await viewer.play();
  $('#cameraLabel').textContent = 'WEBCAM LOCAL · ATIVA';
  $('#stream').textContent = 'PARAR WEBCAM';
}

function stopLocalPreview() {
  if (localStream) localStream.getTracks().forEach((track) => track.stop());
  localStream = undefined;
  const viewer = $('#localViewer');
  viewer.srcObject = null;
  viewer.hidden = true;
  $('#cameraLabel').textContent = 'CAM 01';
}

function renderHealth(health) {
  $('#healthItems').innerHTML = health.components.map((component) => `<div class="health-item ${component.ready ? 'ready' : ''}">${component.label}<small>${component.detail}</small></div>`).join('');
}

function renderHistory(history) {
  const samples = history.samples.filter((sample) => Number.isFinite(sample.telemetry?.voltage));
  $('#historyState').textContent = samples.length ? `${samples.length} amostras` : 'Aguardando telemetria';
  if (samples.length < 2) { $('#voltageLine').setAttribute('points', ''); return; }
  const values = samples.map((sample) => sample.telemetry.voltage);
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  if (maximum - minimum < 0.05) { minimum -= 0.05; maximum += 0.05; }
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${100 - ((value - minimum) / (maximum - minimum)) * 100}`).join(' ');
  $('#voltageLine').setAttribute('points', points);
}

async function refreshStatus() {
  try {
    const status = await request('/api/status');
    render(status);
    handleMissionRecording(status);
    if (telemetryRecording) telemetryLog.push({ timestamp: new Date().toISOString(), ...status });
  } catch (error) { console.error(error); }
}

async function refreshHistory() {
  try { renderHistory(await request('/api/telemetry/history')); } catch (error) { console.error(error); }
}

function formatAxis(value) {
  const deadzone = Math.abs(value) < 0.08 ? 0 : value;
  return deadzone.toFixed(2);
}

function updateGamepad() {
  const pads = navigator.getGamepads?.() || [];
  activeGamepad = [...pads].find((pad) => pad?.connected);
  const button = $('#gamepadButton');
  const readout = $('#gamepadReadout');
  if (!activeGamepad) {
    button.textContent = 'CONTROLE: DESCONECTADO';
    readout.textContent = 'Conecte um controle USB ou Bluetooth e pressione qualquer botão.';
    readout.className = 'gamepad-readout';
    renderControlSimulation();
    updatePreflight();
    return;
  }
  const name = activeGamepad.id.replace(/^.*\((.*)\).*$/, '$1').slice(0, 22) || 'CONECTADO';
  const axes = activeGamepad.axes.slice(0, 4).map(formatAxis).join(' · ');
  const pressed = activeGamepad.buttons.reduce((total, item) => total + (item.pressed ? 1 : 0), 0);
  button.textContent = 'CONTROLE: CONECTADO';
  readout.textContent = `${name} · Eixos: ${axes || '—'} · Botões pressionados: ${pressed}`;
  readout.className = 'gamepad-readout connected';
  renderControlSimulation(activeGamepad);
  updatePreflight();
}

function updatePreflight() {
  if (!state) return;
  const checks = [
    ['Comunicação MAVLink com a Pixhawk', state.mavlink?.connected === true],
    ['Telemetria de bateria disponível', Number.isFinite(state.telemetry?.voltage)],
    ['Joystick conectado', Boolean(activeGamepad)],
  ];
  $('#preflightAutomatic').innerHTML = checks.map(([label, ready]) => `<div class="preflight-item ${ready ? 'ready' : ''}">${label}: ${ready ? 'pronto' : 'pendente'}</div>`).join('');
  const manualReady = $('#checkTether').checked && $('#checkSafety').checked;
  const ready = checks.every(([, itemReady]) => itemReady) && manualReady;
  if (!ready) preDiveReleased = false;
  $('#confirmPreflight').disabled = !ready;
  $('#preflightMessage').textContent = preDiveReleased ? 'Pre-Dive confirmado. Retorne à tela principal para armar.' : ready ? 'Todos os itens estão prontos para liberar o armamento.' : 'Conclua os itens pendentes para liberar o armamento.';
}

function updateArmButton() {
  if (!state) return;
  $('#armButton').textContent = state.armed ? 'DESARMAR VEÍCULO' : preDiveReleased ? 'ARMAR VEÍCULO' : 'ARMAR · PRE-DIVE';
  $('#armButton').classList.toggle('ready', preDiveReleased && !state.armed);
}

function mappedAxis(gamepad, action) {
  if (!gamepad) return 0;
  const value = gamepad.axes[controlMapping[action]] || 0;
  return Math.abs(value) < 0.08 ? 0 : value;
}

function renderControlSimulation(gamepad) {
  [['surge', 'surgeValue', 'surgeBar'], ['sway', 'swayValue', 'swayBar'], ['heave', 'heaveValue', 'heaveBar'], ['yaw', 'yawValue', 'yawBar']].forEach(([action, valueId, barId]) => {
    const value = mappedAxis(gamepad, action);
    $(`#${valueId}`).textContent = value.toFixed(2);
    $(`#${barId}`).style.width = `${Math.abs(value) * 100}%`;
    $(`#${barId}`).style.background = value < 0 ? '#8fbc64' : '#3a8263';
  });
}

function downloadTelemetryLog() {
  const heading = ['timestamp', 'pixhawk_connected', 'armed', 'mode', 'depth_m', 'heading_deg', 'voltage_v', 'current_a', 'link_percent'];
  const rows = telemetryLog.map((entry) => [
    entry.timestamp,
    entry.mavlink?.connected === true,
    entry.armed,
    entry.mode,
    entry.telemetry.depth,
    entry.telemetry.heading,
    entry.telemetry.voltage,
    entry.telemetry.current,
    entry.telemetry.link,
  ].map((value) => JSON.stringify(value ?? '')).join(','));
  const file = new Blob([[heading.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);
  link.download = `leaf-os-telemetria-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function startTelemetryRecording(origin) {
  telemetryLog = [];
  telemetryRecording = true;
  recordingOrigin = origin;
  $('#record').textContent = origin === 'auto' ? '● MISSÃO EM REGISTRO' : '■ PARAR E EXPORTAR';
}

function stopTelemetryRecording() {
  telemetryRecording = false;
  recordingOrigin = undefined;
  $('#record').textContent = '● GRAVAR TELEMETRIA';
  if (telemetryLog.length) downloadTelemetryLog();
}

function handleMissionRecording(status) {
  const armed = status.mavlink?.connected === true && status.armed === true;
  if (armed && !telemetryRecording) startTelemetryRecording('auto');
  if (!armed && telemetryRecording && recordingOrigin === 'auto') stopTelemetryRecording();
}

async function refreshHealth() {
  try { renderHealth(await request('/api/health')); }
  catch { $('#healthItems').textContent = 'Diagnóstico indisponível.'; }
}

function render(data) {
  state = data;
  const mavlinkOnline = data.mavlink?.connected === true;
  $('#connectionLabel').textContent = mavlinkOnline ? 'PIXHAWK CONECTADA' : 'PIXHAWK DESCONECTADA';
  $('#mavlinkConnection').classList.toggle('offline', !mavlinkOnline);
  $('#armStatus').textContent = data.armed ? 'ARMADO' : 'DESARMADO';
  $('#armStatus').classList.toggle('armed', data.armed);
  $('#modeStatus').textContent = data.mode;
  updateArmButton();
  $('#depth').innerHTML = `${data.telemetry.depth.toFixed(1)} <em>m</em>`;
  $('#heading').innerHTML = `${String(Math.round(data.telemetry.heading)).padStart(3, '0')}<em>°</em>`;
  $('#needle').style.transform = `rotate(${data.telemetry.heading}deg)`;
  $('#voltage').innerHTML = `${data.telemetry.voltage.toFixed(1)} <em>V</em>`;
  $('#current').innerHTML = `${data.telemetry.current.toFixed(1)} <em>A</em>`;
  $('#link').innerHTML = `${data.telemetry.link} <em>%</em>`;
  $('#resolution').textContent = `${data.camera.resolution.replace('x', '×')} · ${data.camera.fps} FPS`;
  // A telemetria atualiza a cada segundo. Não sobrescreva uma escolha que o
  // operador ainda está fazendo dentro do painel de configurações.
  if (!dialog.open) {
    $('#cameraSource').value = data.camera.source;
    $('#cameraResolution').value = data.camera.resolution;
    $('#cameraFps').value = data.camera.fps;
    $('#cameraBitrate').value = data.camera.bitrate;
  }
  updatePreflight();
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Não foi possível comunicar com o Leaf OS.');
  return response.json();
}

$('#openSettings').addEventListener('click', () => { dialog.showModal(); refreshHealth(); });
$('#refreshHealth').addEventListener('click', refreshHealth);
$('#checkTether').addEventListener('change', () => { preDiveReleased = false; updatePreflight(); updateArmButton(); });
$('#checkSafety').addEventListener('change', () => { preDiveReleased = false; updatePreflight(); updateArmButton(); });
$('#confirmPreflight').addEventListener('click', (event) => { event.preventDefault(); preDiveReleased = true; updatePreflight(); updateArmButton(); preflightDialog.close(); });
$('#openControls').addEventListener('click', () => { populateMappingControls(); controlsDialog.showModal(); });
$('#saveControls').addEventListener('click', (event) => {
  event.preventDefault();
  controlMapping = { surge: Number($('#mapSurge').value), sway: Number($('#mapSway').value), heave: Number($('#mapHeave').value), yaw: Number($('#mapYaw').value) };
  localStorage.setItem(mappingKey, JSON.stringify(controlMapping));
  controlsDialog.close();
  renderControlSimulation(activeGamepad);
});
$('#armButton').addEventListener('click', async () => {
  if (!state.armed && !preDiveReleased) { preflightDialog.showModal(); updatePreflight(); return; }
  window.alert('Pre-Dive liberado. O comando físico de armar/desarmar continua bloqueado nesta fase de validação MAVLink.');
});
$('#depthHold').addEventListener('click', async () => render(await request('/api/vehicle', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ mode: state.mode === 'ALT_HOLD' ? 'STABILIZE' : 'ALT_HOLD' }) })));
$('#record').addEventListener('click', () => {
  if (telemetryRecording && recordingOrigin === 'auto') {
    window.alert('O registro desta missão é automático e será exportado quando a Pixhawk desarmar.');
    return;
  }
  if (telemetryRecording) {
    stopTelemetryRecording();
    return;
  }
  startTelemetryRecording('manual');
});
$('#stream').addEventListener('click', async () => {
  try {
    if (state.camera.source === 'browser:local') {
      if (localStream) stopLocalPreview(); else await startLocalPreview();
      if (!localStream) $('#stream').textContent = 'INICIAR VÍDEO';
      return;
    }
    renderStream(await request(stream?.running ? '/api/video/stream/stop' : '/api/video/stream/start', { method: 'POST' }));
  }
  catch (error) {
    stopLocalPreview();
    window.alert(`Não foi possível abrir a webcam: ${error.message}`);
  }
});
$('#saveCamera').addEventListener('click', async (event) => { event.preventDefault(); const camera = { source: $('#cameraSource').value, resolution: $('#cameraResolution').value, fps: Number($('#cameraFps').value), bitrate: Number($('#cameraBitrate').value) }; await request('/api/camera', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(camera) }); render(await request('/api/status')); dialog.close(); });
$('#addRtsp').addEventListener('click', async () => {
  const url = $('#rtspUrl').value.trim();
  if (!url) return;
  const source = await request('/api/video/sources/rtsp', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ name: $('#rtspName').value, url }) });
  setSources([...sources, source]);
  $('#cameraSource').value = source.id;
  $('#rtspName').value = '';
  $('#rtspUrl').value = '';
});
Promise.all([request('/api/status'), request('/api/video/sources'), request('/api/video/stream')]).then(([data, video, activeStream]) => { render(data); handleMissionRecording(data); setSources(video.sources); renderStream(activeStream); }).catch(console.error);
setInterval(refreshStatus, 1000);
setInterval(refreshHistory, 5000);
setInterval(updateGamepad, 100);
window.addEventListener('gamepadconnected', updateGamepad);
window.addEventListener('gamepaddisconnected', updateGamepad);
refreshHistory();
updateGamepad();
