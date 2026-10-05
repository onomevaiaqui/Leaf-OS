const bridgeUrl = process.env.LEAF_MAVLINK_URL || 'http://127.0.0.1:8090';

async function getStatus() {
  try {
    const response = await fetch(`${bridgeUrl}/status`, { signal: AbortSignal.timeout(350) });
    if (!response.ok) return { connected: false, error: `HTTP ${response.status}` };
    return await response.json();
  } catch (error) {
    return { connected: false, error: error.message };
  }
}

async function getHistory() {
  try {
    const response = await fetch(`${bridgeUrl}/history`, { signal: AbortSignal.timeout(350) });
    if (!response.ok) return { samples: [] };
    return await response.json();
  } catch { return { samples: [] }; }
}

async function calibrateDepth(waterDensity) {
  try {
    const response = await fetch(`${bridgeUrl}/calibrate/depth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ waterDensity }),
      signal: AbortSignal.timeout(1000),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || 'Não foi possível calibrar a profundidade.');
    return body;
  } catch (error) { throw new Error(error.message); }
}

module.exports = { getStatus, getHistory, calibrateDepth };
