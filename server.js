const http = require('http');

const PORT = 5000;

// Központi rendszerállapot (a .NET starter állapotmodelljének megfelelően)
const systemState = {
  status: 'online', // 'online' | 'degraded'
  uptimeStart: Date.now(),
  checksCount: 0,
  services: {
    database: 'OK',
    aiEngine: 'READY'
  }
};

const server = http.createServer((req, res) => {
  // CORS fejlécek beállítása a Vite kliens számára
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight kérések azonnali kezelése
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health-check és közös állapot végpont
  if (req.url === '/api/health' && req.method === 'GET') {
    systemState.checksCount += 1;
    const uptimeSeconds = Math.floor((Date.now() - systemState.uptimeStart) / 1000);

    const payload = {
      status: systemState.status,
      uptime: uptimeSeconds,
      checksCount: systemState.checksCount,
      services: systemState.services,
      timestamp: new Date().toISOString()
    };

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(payload));
    return;
  }

  // Állapot váltása teszteléshez (pl. szimulált hiba / helyreállítás)
  if (req.url === '/api/toggle-status' && req.method === 'POST') {
    systemState.status = systemState.status === 'online' ? 'degraded' : 'online';
    systemState.services.aiEngine = systemState.status === 'online' ? 'READY' : 'BUSY';

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: systemState.status }));
    return;
  }

  // 404 válasz minden más útvonalra
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`Tiszta Node.js HTTP szerver fut: http://localhost:${PORT}`);
});
