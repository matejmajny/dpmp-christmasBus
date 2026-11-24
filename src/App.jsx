import { useEffect, useState } from "react";
import "./App.css";
import BusMap from "./BusMap";

const API_URL = "/api/dpmp.csv";
const VEHICLE_NUMBER = "725";
const REFRESH_MS = 30000;

// Snowflakes are generated once, with random position, size, speed and delay
const SNOWFLAKES = Array.from({ length: 45 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 4 + Math.random() * 8,
  duration: 8 + Math.random() * 12,
  delay: -Math.random() * 20,
  drift: -30 + Math.random() * 60,
  opacity: 0.4 + Math.random() * 0.6,
}));

// Clean up names like "Jeľšová  *" -> "Jeľšová"
const cleanName = (s) => s.replace("*", "").trim();

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(";");
    const row = {};
    headers.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

function App() {
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // The file is Windows-1250 encoded (Slovak diacritics), not UTF-8
        const buffer = await res.arrayBuffer();
        const text = new TextDecoder("windows-1250").decode(buffer);

        const rows = parseCsv(text);
        const found = rows.find((r) => r.VEHICLE_NUMBER === VEHICLE_NUMBER);

        if (!cancelled) {
          setBus(found || null);
          setError(null);
          setUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="app">
      {/* Decorations */}
      <div className="lights" aria-hidden="true" />
      <div className="partners">
        <img className="partner-logo" src="/dpmp.png" alt="DPMP" />
        <span className="partner-x" aria-hidden="true">
          ×
        </span>
        <img
          className="partner-logo"
          src="/presovonline.png"
          alt="Prešov Online"
        />
      </div>
      <div className="snow" aria-hidden="true">
        {SNOWFLAKES.map((f) => (
          <span
            key={f.id}
            className="flake"
            style={{
              left: `${f.left}%`,
              width: `${f.size}px`,
              height: `${f.size}px`,
              opacity: f.opacity,
              animationDuration: `${f.duration}s`,
              animationDelay: `${f.delay}s`,
              "--drift": `${f.drift}px`,
            }}
          />
        ))}
      </div>

      <h1 className="heading">
        <span aria-hidden="true">🎄</span> Sledovanie polohy vianočného autobusu{" "}
        <span aria-hidden="true">🎁</span>
      </h1>

      <div className="wrapper">
        <div className="card">
          <header className="card-header">
            <span className="vehicle-label">Vozidlo</span>
            <span className="vehicle-number">{VEHICLE_NUMBER}</span>
          </header>

          {loading && <p className="status">Načítava sa…</p>}

          {!loading && error && (
            <p className="status status-error">
              Nepodarilo sa načítať údaje: {error}
            </p>
          )}

          {!loading && !error && !bus && (
            <p className="status status-idle">
              <span className="sleepy" aria-hidden="true">
                😴
              </span>
              Vianočný autobus spinká. / Čaká sa na údaje
            </p>
          )}

          {!loading && !error && bus && (
            <div className="info">
              <div className="route">
                <span className="route-label">Číslo linky:</span>
                <span className="route-number">{bus.ROUTE_NUMBER}</span>
              </div>

              <div className="stops">
                <div className="stop stop-current">
                  <span className="stop-label">Posledná zastávka</span>
                  <span className="stop-name">
                    {cleanName(bus.BUS_STOP_NAME_1)}
                  </span>
                </div>
                <div className="stop-arrow" aria-hidden="true">
                  ↓
                </div>
                <div className="stop stop-next">
                  <span className="stop-label">Ďalšia zastávka</span>
                  <span className="stop-name">
                    {cleanName(bus.BUS_STOP_NAME_2)}
                  </span>
                </div>
              </div>
              {(() => {
                const lat = parseFloat(bus.LATITUDE);
                const lon = parseFloat(bus.LONGITUDE);
                return Number.isFinite(lat) && Number.isFinite(lon) ? (
                  <BusMap lat={lat} lon={lon} />
                ) : null;
              })()}
            </div>
          )}

          {updated && (
            <footer className="updated">
              Naposledy aktualizované o: {updated.toLocaleTimeString("sk-SK")}
            </footer>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
