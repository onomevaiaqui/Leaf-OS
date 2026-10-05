const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '..', 'data', 'logs');
const validName = /^leaf-os-[\d-]+\.jsonl$/;

function list() {
  try {
    return fs.readdirSync(directory)
      .filter((name) => validName.test(name))
      .map((name) => {
        const stats = fs.statSync(path.join(directory, name));
        return { name, size: stats.size, modifiedAt: stats.mtime.toISOString() };
      })
      .sort((left, right) => right.modifiedAt.localeCompare(left.modifiedAt));
  } catch { return []; }
}

function read(name) {
  if (!validName.test(name)) throw new Error('Nome de sessão inválido.');
  const filePath = path.join(directory, name);
  if (!fs.existsSync(filePath)) throw new Error('Sessão não encontrada.');
  const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n').filter(Boolean).slice(-200);
  const events = lines.flatMap((line) => { try { return [JSON.parse(line)]; } catch { return []; } });
  return { name, events };
}

module.exports = { list, read };
