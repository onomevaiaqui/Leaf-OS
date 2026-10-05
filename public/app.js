const $ = (selector) => document.querySelector(selector);
const dialog = $('#settings');
const controlsDialog = $('#controlsDialog');
const preflightDialog = $('#preflightDialog');
const equipmentLogDialog = $('#equipmentLogDialog');
let state;
let sources = [];
let stream;
let localStream;
let activeGamepad;
let preDiveReleased = false;
const profileKey = 'leaf-os-vehicle-profile';
let vehicleProfile = { name: 'Leaf ROV · Unidade 01', minimumVoltage: 0, maximumEscTemperature: 0, waterDensity: 1025 };
try { vehicleProfile = { ...vehicleProfile, ...JSON.parse(localStorage.getItem(profileKey) || '{}') }; } catch { /* usa o padrão */ }
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

function escapeHtml(value) {
  return String(value ?? '—').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function renderEquipmentLog(data) {
  const mavlink = data.mavlink || {};
  const equipment = mavlink.equipment || {};
  const battery = equipment.battery || {};
  const logging = mavlink.logging || {};
  const number = (value, suffix = '') => Number.isFinite(value) ? `${value}${suffix}` : '—';
  $('#equipmentSummary').innerHTML = [
    ['BATERIA', number(data.telemetry?.voltage, ' V')],
    ['CORRENTE', number(data.telemetry?.current, ' A')],
    ['LINK', number(data.telemetry?.link, '%')],
    ['CARGA', number(battery.remaining, '%')],
    ['LOG', `${logging.entries ?? 0} eventos`],
  ].map(([label, value]) => `<div class="equipment-card"><span>${label}</span><strong>${value}</strong></div>`).join('');
  const controller = equipment.flightController || {};
  const controllerItems = [
    ['Carga', number(controller.load, '%')],
    ['Perda de comunicação', number(controller.dropRate, '%')],
    ['Erros de comunicação', number(controller.communicationErrors)],
    ['Saúde dos sensores', controller.sensorHealth || '—'],
  ];
  $('#flightControllerLog').innerHTML = controller.sensorHealth ? controllerItems.map(([label, value]) => `<div class="equipment-item"><strong>${label}</strong>${escapeHtml(value)}</div>`).join('') : 'Aguardando estado da Pixhawk.';
  const motors = equipment.motors || [];
  $('#motorLog').innerHTML = motors.length ? motors.map((motor) => `<div class="equipment-item"><strong>Saída ${motor.channel}</strong>${escapeHtml(motor.pwm)} µs</div>`).join('') : 'Aguardando saídas PWM da Pixhawk.';
  const escs = equipment.esc || [];
  $('#escLog').innerHTML = escs.length ? escs.map((esc) => `<div class="equipment-item"><strong>ESC ${esc.index}</strong>${number(esc.rpm, ' RPM')}<br>${number(esc.temperature, ' °C')} · ${number(esc.current, ' A')} · ${number(esc.voltage, ' V')}</div>`).join('') : 'Aguardando dados de ESC.';
  const pressure = equipment.pressure || {};
  const pressureItems = [['Sensor interno', pressure.internal], ['Sensor externo', pressure.external]].filter(([, value]) => value);
  $('#pressureLog').innerHTML = pressureItems.length ? pressureItems.map(([label, sensor]) => `<div class="equipment-item"><strong>${label}</strong>${number(sensor.absolute, ' hPa')}<br>${number(sensor.temperature, ' °C')}</div>`).join('') : 'Aguardando dados do sensor de pressão.';
  const calibration = equipment.depthCalibration || {};
  $('#depthStatus').textContent = calibration.calibratedAt ? `Referência calibrada · Profundidade: ${number(data.telemetry?.depth, ' m')}` : 'Profundidade ainda não calibrada';
  const messages = equipment.messages || [];
  $('#messageLog').innerHTML = messages.length ? messages.slice().reverse().map((message) => `<div class="message-entry">[${escapeHtml(message.severity)}] ${escapeHtml(message.text)}</div>`).join('') : 'Nenhuma mensagem recebida.';
  const alerts = [];
  if (!mavlink.connected) alerts.push(['danger', 'Pixhawk desconectada: não há heartbeat MAVLink válido.']);
  if (vehicleProfile.minimumVoltage > 0 && Number.isFinite(data.telemetry?.voltage) && data.telemetry.voltage < vehicleProfile.minimumVoltage) alerts.push(['danger', `Bateria abaixo do limite configurado (${vehicleProfile.minimumVoltage} V).`]);
  const hotEsc = escs.filter((esc) => vehicleProfile.maximumEscTemperature > 0 && Number.isFinite(esc.temperature) && esc.temperature > vehicleProfile.maximumEscTemperature);
  if (hotEsc.length) alerts.push(['danger', `Temperatura acima do limite em: ${hotEsc.map((esc) => `ESC ${esc.index}`).join(', ')}.`]);
  if (!alerts.length) alerts.push(['ok', 'Nenhum alerta ativo com os limites atualmente configurados.']);
  $('#equipmentAlerts').innerHTML = alerts.map(([level, text]) => `<div class="equipment-alert ${level === 'ok' ? '' : level}">${escapeHtml(text)}</div>`).join('');
}

async function refreshSessionLogs() {
  const { sessions } = await request('/api/logs');
  const select = $('#sessionLogSelect');
  select.innerHTML = sessions.length ? sessions.map((session) => `<option value="${escapeHtml(session.name)}">${escapeHtml(session.name)} · ${Math.ceil(session.size / 1024)} KB</option>`).join('') : '<option value="">Nenhuma sessão encontrada</option>';
}

async function openSessionLog() {
  const name = $('#sessionLogSelect').value;
  if (!name) return;
  try {
    const session = await request(`/api/logs/${encodeURIComponent(name)}`);
    $('#sessionLogEntries').innerHTML = session.events.length ? session.events.slice().reverse().map((event) => {
      const timestamp = event.timestamp ? new Date(event.timestamp * 1000).toLocaleString('pt-BR') : '—';
      const detail = event.type === 'telemetry' ? `Tensão: ${event.telemetry?.voltage ?? '—'} V · Corrente: ${event.telemetry?.current ?? '—'} A` : event.text || event.event || JSON.stringify(event);
      return `<div class="message-entry">${escapeHtml(timestamp)} · <strong>${escapeHtml(event.type || 'evento')}</strong> · ${escapeHtml(detail)}</div>`;
    }).join('') : 'Esta sessão não possui eventos.';
  } catch (error) { $('#sessionLogEntries').textContent = error.message; }
}

async function refreshStatus() {
  try {
    const status = await request('/api/status');
    render(status);
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
    ['Limite mínimo de bateria configurado', vehicleProfile.minimumVoltage > 0],
    [`Bateria segura (mínimo ${vehicleProfile.minimumVoltage || '—'} V)`, Number.isFinite(state.telemetry?.voltage) && vehicleProfile.minimumVoltage > 0 && state.telemetry.voltage >= vehicleProfile.minimumVoltage],
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
  $('#vehicleName').textContent = vehicleProfile.name;
  renderEquipmentLog(data);
  // A telemetria atualiza a cada segundo. Não sobrescreva uma escolha que o
  // operador ainda está fazendo dentro do painel de configurações.
  if (!dialog.open) {
    $('#cameraSource').value = data.camera.source;
    $('#cameraResolution').value = data.camera.resolution;
    $('#cameraFps').value = data.camera.fps;
    $('#cameraBitrate').value = data.camera.bitrate;
    $('#profileName').value = vehicleProfile.name;
    $('#minimumVoltage').value = vehicleProfile.minimumVoltage || '';
    $('#maximumEscTemperature').value = vehicleProfile.maximumEscTemperature || '';
    $('#waterDensity').value = vehicleProfile.waterDensity || 1025;
  }
  updatePreflight();
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Não foi possível comunicar com o Leaf OS.');
  }
  return response.json();
}

$('#openSettings').addEventListener('click', () => { dialog.showModal(); refreshHealth(); });
$('#refreshHealth').addEventListener('click', refreshHealth);
$('#openEquipmentLog').addEventListener('click', () => { equipmentLogDialog.showModal(); refreshHistory(); refreshSessionLogs().catch(() => {}); });
$('#openSessionLog').addEventListener('click', openSessionLog);
$('#downloadSessionLog').addEventListener('click', () => {
  const name = $('#sessionLogSelect').value;
  if (!name) return;
  const link = document.createElement('a');
  link.href = `/api/logs/${encodeURIComponent(name)}/download`;
  link.click();
});
$('#zeroDepth').addEventListener('click', async () => {
  try {
    await request('/api/mavlink/calibrate-depth', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ waterDensity: vehicleProfile.waterDensity }) });
    await refreshStatus();
  } catch (error) { window.alert(`Não foi possível zerar a profundidade: ${error.message}`); }
});
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
$('#saveCamera').addEventListener('click', async (event) => {
  event.preventDefault();
  const camera = { source: $('#cameraSource').value, resolution: $('#cameraResolution').value, fps: Number($('#cameraFps').value), bitrate: Number($('#cameraBitrate').value) };
  vehicleProfile = { name: $('#profileName').value.trim() || 'Leaf ROV · Unidade 01', minimumVoltage: Number($('#minimumVoltage').value) || 0, maximumEscTemperature: Number($('#maximumEscTemperature').value) || 0, waterDensity: Number($('#waterDensity').value) || 1025 };
  localStorage.setItem(profileKey, JSON.stringify(vehicleProfile));
  await request('/api/camera', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(camera) });
  render(await request('/api/status'));
  dialog.close();
});
$('#addRtsp').addEventListener('click', async () => {
  const url = $('#rtspUrl').value.trim();
  if (!url) return;
  const source = await request('/api/video/sources/rtsp', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ name: $('#rtspName').value, url }) });
  setSources([...sources, source]);
  $('#cameraSource').value = source.id;
  $('#rtspName').value = '';
  $('#rtspUrl').value = '';
});
Promise.all([request('/api/status'), request('/api/video/sources'), request('/api/video/stream')]).then(([data, video, activeStream]) => { render(data); setSources(video.sources); renderStream(activeStream); }).catch(console.error);
setInterval(refreshStatus, 1000);
setInterval(refreshHistory, 5000);
setInterval(updateGamepad, 100);
window.addEventListener('gamepadconnected', updateGamepad);
window.addEventListener('gamepaddisconnected', updateGamepad);
refreshHistory();
updateGamepad();
