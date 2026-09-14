const $ = (selector) => document.querySelector(selector);
const dialog = $('#settings');
let state;

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
$('#saveCamera').addEventListener('click', async (event) => { event.preventDefault(); const camera = { source: $('#cameraSource').value, resolution: $('#cameraResolution').value, fps: Number($('#cameraFps').value), bitrate: Number($('#cameraBitrate').value) }; await request('/api/camera', { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify(camera) }); render(await request('/api/status')); dialog.close(); });
Promise.all([request('/api/status')]).then(([data]) => render(data)).catch(console.error);
