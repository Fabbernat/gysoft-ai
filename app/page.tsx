'use client';

import { useState, useEffect } from 'react';

interface ServerStatus {
  online: boolean;
  statusText: string;
  timestamp: string;
}

export default function Home() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [error, setError] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/status');
      if (!response.ok) throw new Error('Szerver hiba');
      const data = await response.json();
      setStatus(data);
      setError(false);
    } catch {
      setError(true);
      setStatus(null);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-zinc-950 text-zinc-100 font-sans">
      {/* Fő tartalom */}
      <div className="p-8 max-w-2xl mx-auto mt-20 text-center">
        <h1 className="text-3xl font-bold mb-4">AI Webalkalmazás</h1>
        <p className="text-zinc-400">
          Az alsó állapotsor élőben figyeli a Node.js backend működését.
        </p>
      </div>

      {/* Állapotsor (Status Bar) */}
      <footer className="w-full bg-zinc-900 border-t border-zinc-800 px-6 py-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span
            className={`h-3 w-3 rounded-full ${
              error
                ? 'bg-red-500'
                : status?.online
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-yellow-500'
            }`}
          />
          <span className="font-medium">
            {error
              ? 'Offline • A Node.js backend nem elérhető'
              : status
              ? status.statusText
              : 'Kapcsolódás a szerverhez...'}
          </span>
        </div>

        <div className="text-zinc-400 text-xs">
          {status?.timestamp ? `Utolsó frissítés: ${status.timestamp}` : 'Várakozás...'}
        </div>
      </footer>
    </main>
  );
}
