import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Többnyelvű szótár (Magyar, Angol, Német)
const translations = {
  hu: {
    title: 'AI Starter Webalkalmazás',
    subtitle: '.NET Starter mintára épülő Node.js HTTP + React Vite architektúra',
    forceCheck: 'Azonnali ellenőrzés',
    toggleBackend: 'Szerver állapot váltása (Teszt)',
    uptime: 'Üzemidő',
    checks: 'Ellenőrzések',
    lastSync: 'Utolsó szinkron',
    status: {
      connecting: 'Kapcsolódás a szerverhez...',
      connected: 'Kapcsolódva • Rendszer naprakész',
      degraded: 'Korlátozott működés • AI motor terhelt',
      disconnected: 'Kapcsolat megszakadt • Újrapróbálkozás...'
    }
  },
  en: {
    title: 'AI Starter Web Application',
    subtitle: 'Node.js HTTP + React Vite architecture adapted from .NET Starter',
    forceCheck: 'Check Now',
    toggleBackend: 'Toggle Server State (Test)',
    uptime: 'Uptime',
    checks: 'Checks',
    lastSync: 'Last sync',
    status: {
      connecting: 'Connecting to server...',
      connected: 'Connected • System healthy',
      degraded: 'Degraded • AI engine busy',
      disconnected: 'Disconnected • Retrying...'
    }
  },
  de: {
    title: 'AI Starter Webanwendung',
    subtitle: 'Node.js HTTP + React Vite Architektur nach .NET Starter Vorbild',
    forceCheck: 'Jetzt prüfen',
    toggleBackend: 'Serverstatus umschalten (Test)',
    uptime: 'Betriebszeit',
    checks: 'Prüfungen',
    lastSync: 'Letzte Synchronisierung',
    status: {
      connecting: 'Verbindung zum Server...',
      connected: 'Verbunden • System bereit',
      degraded: 'Eingeschränkt • KI-Engine ausgelastet',
      disconnected: 'Verbindung getrennt • Neuer Versuch...'
    }
  }
};

// 2. Közös Kapcsolatállapot Context
const AppStateContext = createContext(null);

function AppStateProvider({ children }) {
  const [lang, setLang] = useState('hu');
  const [connectionState, setConnectionState] = useState('connecting'); // 'connecting' | 'connected' | 'degraded' | 'disconnected'
  const [serverData, setServerData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const checkHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch('http://localhost:5000/api/health', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error('HTTP error');

      const data = await response.json();
      setServerData(data);
      setConnectionState(data.status === 'degraded' ? 'degraded' : 'connected');
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      clearTimeout(timeoutId);
      setConnectionState('disconnected');
      setServerData(null);
    }
  }, []);

  // Automatikus háttér-ellenőrzés 3 másodpercenként
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const toggleServerState = async () => {
    try {
      await fetch('http://localhost:5000/api/toggle-status', { method: 'POST' });
      await checkHealth();
    } catch {
      setConnectionState('disconnected');
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        connectionState,
        serverData,
        lastUpdated,
        checkHealth,
        toggleServerState
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

// 3. Fő vezérlőpult komponens (a közös állapotot fogyasztja)
function Dashboard() {
  const { lang, setLang, t, connectionState, serverData, checkHealth, toggleServerState } = useContext(AppStateContext);

  return (
    <div style={{ maxWidth: '720px', margin: '60px auto', padding: '0 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>{t.title}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['hu', 'en', 'de'].map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              style={{
                padding: '6px 12px',
                cursor: 'pointer',
                fontWeight: lang === code ? 'bold' : 'normal',
                backgroundColor: lang === code ? '#2563eb' : '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                borderRadius: '6px'
              }}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <p style={{ color: '#94a3b8', marginBottom: '32px' }}>{t.subtitle}</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={checkHealth}
          style={{ padding: '10px 16px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer' }}
        >
          {t.forceCheck}
        </button>
        <button
          onClick={toggleServerState}
          disabled={connectionState === 'disconnected'}
          style={{
            padding: '10px 16px',
            backgroundColor: connectionState === 'disconnected' ? '#334155' : '#475569',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: connectionState === 'disconnected' ? 'not-allowed' : 'pointer'
          }}
        >
          {t.toggleBackend}
        </button>
      </div>

      {serverData && (
        <div style={{ padding: '16px', backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', display: 'flex', gap: '24px' }}>
          <div><strong>{t.uptime}:</strong> {serverData.uptime}s</div>
          <div><strong>{t.checks}:</strong> {serverData.checksCount}</div>
          <div><strong>AI Engine:</strong> {serverData.services.aiEngine}</div>
        </div>
      )}
    </div>
  );
}

// 4. Állapotsor komponens (szintén a közös állapotból dolgozik)
function StatusBar() {
  const { t, connectionState, lastUpdated } = useContext(AppStateContext);

  const indicatorColors = {
    connecting: '#eab308',
    connected: '#10b981',
    degraded: '#f97316',
    disconnected: '#ef4444'
  };

  return (
    <footer
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#09090b',
        borderTop: '1px solid #27272a',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#e4e4e7'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: indicatorColors[connectionState],
            display: 'inline-block'
          }}
        />
        <span>{t.status[connectionState]}</span>
      </div>
      <div style={{ color: '#a1a1aa', fontSize: '12px' }}>
        {lastUpdated ? `${t.lastSync}: ${lastUpdated}` : '---'}
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', paddingBottom: '60px' }}>
      <AppStateProvider>
        <Dashboard />
        <StatusBar />
      </AppStateProvider>
    </div>
  );
}
