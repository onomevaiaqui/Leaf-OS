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

module.exports = { getStatus };
