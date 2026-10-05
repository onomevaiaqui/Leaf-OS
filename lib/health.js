const fs = require('node:fs');
const net = require('node:net');
const { spawnSync } = require('node:child_process');
const { listSources } = require('./video');
const mavlink = require('./mavlink-client');

function executableAvailable(command) {
  const result = spawnSync(command, ['--version'], { stdio: 'ignore', timeout: 500 });
  return !result.error;
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const done = (open) => { socket.destroy(); resolve(open); };
    socket.setTimeout(300);
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

async function inspect() {
  const [rtsp, webrtc, vehicle] = await Promise.all([portOpen(8554), portOpen(8889), mavlink.getStatus()]);
  const sources = listSources();
  return {
    checkedAt: new Date().toISOString(),
    components: [
      { id: 'pixhawk', label: 'Pixhawk / MAVLink', ready: vehicle.connected === true, detail: vehicle.connected ? 'Heartbeat recebido' : 'Aguardando heartbeat' },
      { id: 'camera', label: 'Câmera USB', ready: sources.some((source) => source.type === 'usb' && source.ready), detail: `${sources.filter((source) => source.type === 'usb').length} fonte(s) V4L2` },
      { id: 'gstreamer', label: 'GStreamer', ready: executableAvailable('gst-launch-1.0'), detail: 'Captura e codificação' },
      { id: 'mediamtx-rtsp', label: 'MediaMTX RTSP', ready: rtsp, detail: 'Porta local 8554' },
      { id: 'mediamtx-webrtc', label: 'MediaMTX WebRTC', ready: webrtc, detail: 'Porta local 8889' },
      { id: 'storage', label: 'Armazenamento', ready: fs.existsSync(__dirname), detail: 'Serviços Leaf OS disponíveis' },
    ],
  };
}

module.exports = { inspect };
