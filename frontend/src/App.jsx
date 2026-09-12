import { useEffect, useState, useCallback } from "react";
import TradingControls from "./components/TradingControls";
import PortfolioCard from "./components/PortfolioCard";
import TradeHistory from "./components/TradeHistory";
import Toast from "./components/Toast";
import "./App.css";

const API_BASE_URL = "http://127.0.0.1:8000";

function App() {
  const [prices, setPrices] = useState({ BTC: 105000, ETH: 4300, SOL: 210 });
  const [portfolio, setPortfolio] = useState(null);
  const [trades, setTrades] = useState([]);
  const [selectedToken, setSelectedToken] = useState("BTC");
  const [isExecuting, setIsExecuting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [backendOnline, setBackendOnline] = useState(true);

  // Toast Management
  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch Prices
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/prices`);
      if (res.ok) {
        const data = await res.json();
        setPrices(data);
        setBackendOnline(true);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  // Fetch Portfolio
  const fetchPortfolio = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/portfolio`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data);
      }
    } catch {
      // Backend might be booting
    }
  }, []);

  // Fetch Trade History
  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/trades`);
      if (res.ok) {
        const data = await res.json();
        setTrades(data);
      }
    } catch {
      // Ignore initial errors
    }
  }, []);

  // Initial Load & Polling
  useEffect(() => {
    fetchPrices();
    fetchPortfolio();
    fetchTrades();

    // Poll live prices every 3 seconds
    const intervalId = setInterval(() => {
      fetchPrices();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchPrices, fetchPortfolio, fetchTrades]);

  // Execute Trade Handler
  const handleTrade = async (side, token, quantity) => {
    setIsExecuting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/trade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          side: side,
          quantity: quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        addToast("error", "Order Rejected", data.error || "Trade execution failed");
        return false;
      }

      // Success
      addToast(
        "success",
        `${side} Order Filled!`,
        `Executed ${quantity} ${token} at $${Number(data.trade.price).toLocaleString(
          undefined,
          { minimumFractionDigits: 2 }
        )}`
      );

      if (data.portfolio) {
        setPortfolio(data.portfolio);
      }
      if (data.trade) {
        setTrades((prev) => [data.trade, ...prev]);
      }
      return true;
    } catch (err) {
      addToast(
        "error",
        "Connection Error",
        "Could not connect to backend at " + API_BASE_URL
      );
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  // Reset Portfolio Handler
  const handleResetPortfolio = async () => {
    if (
      !window.confirm("Are you sure you want to reset your portfolio back to $10,000?")
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
        setTrades([]);
        addToast(
          "info",
          "Portfolio Reset",
          "Your cash balance has been reset to $10,000.00 and history cleared."
        );
      }
    } catch {
      addToast("error", "Error", "Failed to reset portfolio on server");
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo-badge">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="brand-title">NovaTrade</span>
              <span className="mode-badge">PAPER TRADING</span>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <div className="live-indicator">
            <div
              className="pulse-dot"
              style={{
                backgroundColor: backendOnline ? "var(--buy-green)" : "var(--sell-red)",
              }}
            ></div>
            <span>{backendOnline ? "Live Simulated Market" : "Backend Offline"}</span>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetPortfolio}
            title="Reset paper trading capital to $10,000"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            Reset $10,000
          </button>
        </div>
      </header>

      {/* Live Market Ticker */}
      <div className="ticker-bar">
        <span className="ticker-label">Markets:</span>
        <div className="ticker-items">
          {["BTC", "ETH", "SOL"].map((sym) => {
            const price = prices[sym] || 0;
            const isSelected = selectedToken === sym;

            return (
              <div
                key={sym}
                className={`ticker-item ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedToken(sym)}
                title={`Click to trade ${sym}`}
              >
                <span className="ticker-coin-symbol">{sym}/USD</span>
                <span className="ticker-coin-price">
                  ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <main className="dashboard-content">
        <div className="dashboard-grid">
          {/* Left Column: Interactive Trading Controls */}
          <section aria-label="Trading Controls">
            <TradingControls
              prices={prices}
              portfolio={
                portfolio || {
                  balance: 10000.0,
                  holdings: { BTC: 0.0, ETH: 0.0, SOL: 0.0 },
                }
              }
              selectedToken={selectedToken}
              setSelectedToken={setSelectedToken}
              onTrade={handleTrade}
              isExecuting={isExecuting}
            />
          </section>

          {/* Right Column: Portfolio Breakdown & History */}
          <section
            aria-label="Portfolio and History"
            style={{ display: "flex", flexDirection: "column", gap: "28px" }}
          >
            <PortfolioCard
              portfolio={
                portfolio || {
                  balance: 10000.0,
                  holdings: { BTC: 0.0, ETH: 0.0, SOL: 0.0 },
                }
              }
              prices={prices}
              onSelectToken={(sym) => setSelectedToken(sym)}
            />

            <TradeHistory trades={trades} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;