const fs = require('node:fs');
const path = require('node:path');

const configDirectory = path.join(__dirname, '..', 'data');
const configPath = path.join(configDirectory, 'video-sources.json');

function readCustomSources() {
  try {
    const sources = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return Array.isArray(sources) ? sources : [];
  } catch { return []; }
}

function writeCustomSources(sources) {
  fs.mkdirSync(configDirectory, { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify(sources, null, 2)}\n`);
}

function listUsbCameras() {
  if (process.platform !== 'linux') return [];
  try {
    return fs.readdirSync('/dev')
      .filter((name) => /^video\d+$/.test(name))
      .map((name) => ({ id: `v4l2:${name}`, name: `/dev/${name}`, type: 'usb', path: `/dev/${name}`, ready: true }));
  } catch { return []; }
}

function listSources() {
  return [
    ...listUsbCameras(),
    { id: 'csi:camera0', name: 'Câmera CSI do Raspberry Pi', type: 'csi', ready: process.platform === 'linux' },
    ...readCustomSources(),
  ];
}

function addRtspSource({ name, url }) {
  if (typeof url !== 'string' || !/^rtsps?:\/\//i.test(url)) throw new Error('A URL deve iniciar com rtsp:// ou rtsps://.');
  const source = { id: `rtsp:${Date.now()}`, name: typeof name === 'string' && name.trim() ? name.trim() : 'Câmera IP', type: 'rtsp', url: url.trim(), ready: true };
  const sources = readCustomSources();
  sources.push(source);
  writeCustomSources(sources);
  return source;
}

module.exports = { addRtspSource, listSources };
