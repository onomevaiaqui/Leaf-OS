const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { addRtspSource, listSources } = require('./lib/video');

const port = Number(process.env.PORT || 8080);
const publicDirectory = path.join(__dirname, 'public');

const rov = {
  armed: false,
  mode: 'STABILIZE',
  camera: { source: 'auto', resolution: '1280x720', fps: 30, bitrate: 3500 },
  telemetry: { depth: 0, heading: 0, voltage: 16.4, current: 0.4, link: 100 },
};

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = '';
    request.on('data', (chunk) => { data += chunk; });
    request.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('JSON inválido')); }
    });
    request.on('error', reject);
  });
}

function serveStatic(response, pathname) {
  const requested = pathname === '/' ? 'index.html' : pathname.slice(1);
  const filePath = path.resolve(publicDirectory, requested);
  if (!filePath.startsWith(publicDirectory)) return json(response, 403, { error: 'Acesso negado' });
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8' };
  fs.readFile(filePath, (error, data) => {
    if (error) return json(response, 404, { error: 'Não encontrado' });
    response.writeHead(200, { 'content-type': types[path.extname(filePath)] || 'application/octet-stream' });
    response.end(data);
  });
}

http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (request.method === 'GET' && url.pathname === '/api/status') return json(response, 200, rov);
  if (request.method === 'GET' && url.pathname === '/api/video/sources') return json(response, 200, { sources: listSources() });
  if (request.method === 'POST' && url.pathname === '/api/video/sources/rtsp') {
    try { return json(response, 201, addRtspSource(await readBody(request))); }
    catch (error) { return json(response, 400, { error: error.message }); }
  }
  if (request.method === 'POST' && url.pathname === '/api/vehicle') {
    try {
      const patch = await readBody(request);
      if (typeof patch.armed === 'boolean') rov.armed = patch.armed;
      if (typeof patch.mode === 'string') rov.mode = patch.mode;
      return json(response, 200, rov);
    } catch (error) { return json(response, 400, { error: error.message }); }
  }
  if (request.method === 'POST' && url.pathname === '/api/camera') {
    try {
      const camera = await readBody(request);
      if (camera.source !== undefined && typeof camera.source !== 'string') throw new Error('Fonte de câmera inválida.');
      if (camera.fps !== undefined && (!Number.isInteger(camera.fps) || camera.fps < 1 || camera.fps > 120)) throw new Error('FPS deve estar entre 1 e 120.');
      if (camera.bitrate !== undefined && (!Number.isInteger(camera.bitrate) || camera.bitrate < 250 || camera.bitrate > 50000)) throw new Error('Bitrate deve estar entre 250 e 50000 kbps.');
      for (const field of ['source', 'resolution', 'fps', 'bitrate']) if (camera[field] !== undefined) rov.camera[field] = camera[field];
      return json(response, 200, rov.camera);
    } catch (error) { return json(response, 400, { error: error.message }); }
  }
  return serveStatic(response, url.pathname);
}).listen(port, '0.0.0.0', () => console.log(`Leaf OS disponível em http://localhost:${port}`));
