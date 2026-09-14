const $ = (selector) => document.querySelector(selector);
const dialog = $('#settings');
let state;
let sources = [];
let stream;

function setSources(nextSources) {
  sources = nextSources;
  const select = $('#cameraSource');
  select.innerHTML = '<option value="auto">Detectar automaticamente</option>' + sources.map((source) => `<option value="${source.id}">${source.name}</option>`).join('');
  select.value = state?.camera.source || 'auto';
}

function renderStream(nextStream) {
  stream = nextStream;
  $('#stream').textContent = stream.running ? 'PARAR VÍDEO' : 'INICIAR VÍDEO';
  const viewer = $('#webrtcViewer');
  if (stream.running) {
    viewer.src = `http://${window.location.hostname}:8889/${stream.streamPath}`;
    viewer.hidden = false;
  } else {
    viewer.removeAttribute('src');
    viewer.hidden = true;
  }
}

function render(data) {
  state = data;
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
  $('#cameraSource').value = data.camera.source;
  $('#cameraResolution').value = data.camera.resolution;
  $('#cameraFps').value = data.camera.fps;
  $('#cameraBitrate').value = data.camera.bitrate;
}

async function request(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error('Não foi possível comunicar com o Leaf OS.');
  return response.json();
}

$('#openSettings').addEventListener('click', () => dialog.showModal());
$('#armButton').addEventListener('click', async () => render(await request('/api/vehicle', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ armed: !state.armed }) })));
$('#depthHold').addEventListener('click', async () => render(await request('/api/vehicle', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({ mode: state.mode === 'ALT_HOLD' ? 'STABILIZE' : 'ALT_HOLD' }) })));
$('#stream').addEventListener('click', async () => {
  try { renderStream(await request(stream?.running ? '/api/video/stream/stop' : '/api/video/stream/start', { method: 'POST' })); }
  catch (error) { window.alert(error.message); }
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
