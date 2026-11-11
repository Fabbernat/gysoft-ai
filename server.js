const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Állapot lekérdező végpont
app.get('/api/status', (req, res) => {
  res.json({
    online: true,
    statusText: 'Rendszer aktív • AI motor kész',
    timestamp: new Date().toLocaleTimeString('hu-HU')
  });
});

app.listen(PORT, () => {
  console.log(`A backend szerver sikeresen fut: http://localhost:${PORT}`);
});
