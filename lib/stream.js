const { spawn } = require('node:child_process');

let pipeline;
let current;

function resolveSource(camera, sources) {
  const source = camera.source === 'auto'
    ? sources.find((item) => item.ready && item.type === 'usb')
    : sources.find((item) => item.id === camera.source);
  if (!source) throw new Error('Nenhuma câmera USB pronta foi selecionada.');
  if (source.type !== 'usb') throw new Error('Nesta etapa, o streaming direto está disponível para câmeras USB/V4L2.');
  return source;
}

function start(camera, sources) {
  if (pipeline) return status();
  const source = resolveSource(camera, sources);
  const [width, height] = camera.resolution.split('x').map(Number);
  const encoder = process.env.LEAF_H264_ENCODER || 'v4l2h264enc';
  const args = [
    '-e', 'v4l2src', `device=${source.path}`, '!',
    'video/x-raw', `width=${width}`, `height=${height}`, `framerate=${camera.fps}/1`, '!',
    'videoconvert', '!', 'queue', '!', encoder, '!', 'h264parse', 'config-interval=1', '!',
    'rtspclientsink', 'location=rtsp://127.0.0.1:8554/rov', 'protocols=tcp',
  ];
  pipeline = spawn('gst-launch-1.0', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  current = { source, startedAt: new Date().toISOString(), error: null };
  pipeline.stderr.on('data', (chunk) => { current.error = chunk.toString().trim().slice(-500); });
  pipeline.on('error', (error) => { current.error = error.message; pipeline = undefined; });
  pipeline.on('exit', (code) => { if (code !== 0 && current) current.error ||= `Pipeline encerrado (código ${code}).`; pipeline = undefined; });
  return status();
}

function stop() {
  if (pipeline) pipeline.kill('SIGTERM');
  pipeline = undefined;
  current = undefined;
  return status();
}

function status() {
  return { running: Boolean(pipeline), streamPath: 'rov', webrtcPort: 8889, ...current };
}

module.exports = { start, status, stop };
