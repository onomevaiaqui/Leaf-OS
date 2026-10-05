const $ = (selector) => document.querySelector(selector);
const dialog = $('#settings');
let state;
let sources = [];
let stream;
let localStream;

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
  try { render(await request('/api/status')); } catch (error) { console.error(error); }
}

async function refreshHistory() {
  try { renderHistory(await request('/api/telemetry/history')); } catch (error) { console.error(error); }
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
  $('#armButton').textContent = data.armed ? 'DESARMAR VEÍCULO' : 'ARMAR VEÍCULO';
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
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Não foi possível comunicar com o Leaf OS.');
  return response.json();
}

$('#openSettings').addEventListener('click', () => { dialog.showModal(); refreshHealth(); });
$('#refreshHealth').addEventListener('click', refreshHealth);
$('#armButton').addEventListener('click', async () => render(await request('/api/vehicle', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ armed: !state.armed }) })));
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
Promise.all([request('/api/status'), request('/api/video/sources'), request('/api/video/stream')]).then(([data, video, activeStream]) => { render(data); setSources(video.sources); renderStream(activeStream); }).catch(console.error);
setInterval(refreshStatus, 1000);
setInterval(refreshHistory, 5000);
refreshHistory();
