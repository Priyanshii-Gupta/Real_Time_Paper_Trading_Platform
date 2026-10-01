/**
 * Dashboard.jsx — Main trading dashboard
 *
 * Props:
 *   user    — full user object from the API
 *   onLogout — callback to clear session
 *   toast   — { success, error, info } from useToast
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import Chart from './Chart.jsx';
import { executeTrade } from '../api.js';

BigNumber.config({ DECIMAL_PLACES: 8, ROUNDING_MODE: BigNumber.ROUND_DOWN });

const SYMBOLS = ['BTC', 'ETH', 'SOL'];
const COIN_META = {
  BTC: { label: 'Bitcoin', icon: '₿', color: '#f59e0b' },
  ETH: { label: 'Ethereum', icon: 'Ξ', color: '#8b5cf6' },
  SOL: { label: 'Solana', icon: '◎', color: '#06b6d4' },
};

function fmt(val, decimals = 2) {
  return new BigNumber(val).toFixed(decimals);
}

export default function Dashboard({ user: initialUser, onLogout, onUserUpdate, toast }) {
  const [user, setUser] = useState(initialUser);
  const [symbol, setSymbol] = useState('BTC');
  const [quantity, setQuantity] = useState('');
  const [livePrice, setLivePrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastPriceRef = useRef(null);

  const portfolio = user.portfolio;
  const identity = user.identity;
  const stats = portfolio.stats;

  const handlePrice = useCallback((price) => {
    lastPriceRef.current = price;
    setLivePrice(price);
  }, []);

  // Resilient live price stream (Coinbase WS & REST polling) inside Dashboard
  useEffect(() => {
    const pair = `${symbol}-USD`;
    let isSubscribed = true;

    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
        if (!res.ok) return;
        const data = await res.json();
        if (isSubscribed && data?.data?.amount) handlePrice(parseFloat(data.data.amount));
      } catch (e) { }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // fallback only
    return () => { isSubscribed = false; clearInterval(interval); };
  }, [symbol, handlePrice]);

  const handleTrade = async (side) => {
    const qty = quantity.trim();
    if (!qty || isNaN(qty) || parseFloat(qty) <= 0) {
      toast.error('Enter a valid positive quantity.');
      return;
    }
    // Check for WebSocket price first; if missing, fetch directly from Binance API as fallback
    let tradePrice = lastPriceRef.current;

    if (!tradePrice || tradePrice <= 0) {
      try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`);
        const data = await res.json();
        tradePrice = parseFloat(data.data.amount);
        lastPriceRef.current = tradePrice;
      } catch (err) {
        try {
          const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`);
          const data = await res.json();
          tradePrice = parseFloat(data.price);
          lastPriceRef.current = tradePrice;
        } catch (e) {
          toast.error('Unable to fetch market price. Check network connection.');
          return;
        }
      }
    }
    setLoading(true);
    try {
      const priceStr = new BigNumber(tradePrice).toFixed(2);
      const { data } = await executeTrade({
        user_id: identity.user_id,
        symbol,
        side,
        quantity: qty,
        current_price: priceStr,
      });

      const updatedUser = {
        ...user,
        portfolio: {
          ...user.portfolio,
          usd_balance: data.usd_balance,
          holdings: data.holdings,
          stats: data.stats,
        },
        order_history: [...(user.order_history || []), data.order],
      };

      setUser(updatedUser);
      if (onUserUpdate) {
        onUserUpdate(updatedUser);
      }

      toast.success(
        `${side} ${qty} ${symbol} @ $${priceStr} — order filled!`
      );
      setQuantity('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Trade failed. Check your balance/holdings.');
    } finally {
      setLoading(false);
    }
  };

  const usdBN = new BigNumber(portfolio.usd_balance);

  return (
    <div className="dashboard">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header className="dash-header">
        <div className="container flex items-center justify-between" style={{ height: '100%' }}>


          {/* Right: profile */}
          <div className="flex items-center gap-4">
            <div className="profile-chip" aria-label="User profile">
              <div className="avatar">{identity.name.charAt(0).toUpperCase()}</div>
              <div>
                <div className="profile-name">{identity.name}</div>
                <div className="profile-uid">ID #{identity.user_id}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────── */}
      <main className="container dash-body">

        {/* ── ROW 1: Stats bar ──────────────────────────────────── */}
        <div className="stats-bar">
          {/* USD Balance */}
          <div className="stat-card">
            <span className="stat-label">USD Balance</span>
            <span className="stat-value mono text-green">
              ${fmt(usdBN.toString(), 2)}
            </span>
          </div>

          {/* Reputation */}
          <div className="stat-card stat-card--gold">
            <span className="stat-value text-gold">
              {stats.total_profitable_trades}
            </span>
            <span className="badge badge-gold" style={{ marginTop: 4 }}>
              All-time wins
            </span>
          </div>

          {/* Live price */}
          <div className="stat-card">
            <span className="stat-value mono text-accent">
              {livePrice ? `$${new BigNumber(livePrice).toFormat(2)}` : '—'}
            </span>
          </div>

          {/* Holdings for selected */}
          {SYMBOLS.map((s) => (
            <div
              key={s}
              className={`stat-card stat-card--coin${s === symbol ? ' active' : ''}`}
              onClick={() => setSymbol(s)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${s}`}
              onKeyDown={(e) => e.key === 'Enter' && setSymbol(s)}
            >
              <span className="stat-label" style={{ color: COIN_META[s].color }}>
                {COIN_META[s].icon} {s}
              </span>
              <span className="stat-value mono" style={{ fontSize: 16 }}>
                {fmt(portfolio.holdings[s], 6)}
              </span>
              <span className="badge badge-blue" style={{ marginTop: 4 }}>
                {stats[s].profitable_trades} wins
              </span>
            </div>
          ))}
        </div>

        {/* ── ROW 2: Chart + Trading panel ──────────────────────── */}
        <div className="main-grid">

          {/* Chart */}
          <div className="card chart-card">
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                  {COIN_META[symbol].label} / USDT
                </h2>
              </div>
              {/* Symbol switcher tabs */}
              <div className="symbol-tabs">
                {SYMBOLS.map((s) => (
                  <button
                    key={s}
                    id={`chart-tab-${s.toLowerCase()}`}
                    className={`symbol-tab${s === symbol ? ' active' : ''}`}
                    onClick={() => setSymbol(s)}
                    style={{ '--tab-color': COIN_META[s].color }}
                  >
                    {COIN_META[s].icon} {s}
                  </button>
                ))}
              </div>
            </div>
            <Chart symbol={symbol} onPrice={handlePrice} />
          </div>

          {/* Trading panel */}
          <div className="card trade-card">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Place Order</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
              Paper trade at live market price
            </p>

            {/* Coin selector */}
            <div className="form-group">
              <label htmlFor="trade-coin-select" className="label">Asset</label>
              <select
                id="trade-coin-select"
                className="select"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              >
                {SYMBOLS.map((s) => (
                  <option key={s} value={s}>
                    {COIN_META[s].icon} {COIN_META[s].label} ({s})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="form-group mt-3">
              <label htmlFor="trade-qty-input" className="label">Quantity</label>
              <input
                id="trade-qty-input"
                type="number"
                className="input input-mono"
                placeholder="e.g. 0.01"
                value={quantity}
                min="0"
                step="any"
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {/* Cost estimate */}
            {livePrice && quantity && !isNaN(quantity) && parseFloat(quantity) > 0 && (
              <div className="cost-estimate mt-3">
                <span>Estimated cost</span>
                <span className="mono">
                  $
                  {new BigNumber(quantity)
                    .multipliedBy(livePrice)
                    .toFormat(2)}
                </span>
              </div>
            )}

            {/* Trade buttons */}
            <div className="flex gap-3 mt-4">
              <button
                id="buy-btn"
                className="btn btn-buy"
                style={{ flex: 1, fontSize: 15, padding: '13px' }}
                onClick={() => handleTrade('BUY')}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : '▲'} Buy
              </button>
              <button
                id="sell-btn"
                className="btn btn-sell"
                style={{ flex: 1, fontSize: 15, padding: '13px' }}
                onClick={() => handleTrade('SELL')}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : '▼'} Sell
              </button>
            </div>

            <div className="divider" />

            {/* Balance summary */}
            <div className="balance-summary">
              <div className="bal-row">
                <span className="text-muted" style={{ fontSize: 12 }}>Available USD</span>
                <span className="mono text-green" style={{ fontSize: 14, fontWeight: 600 }}>
                  ${fmt(usdBN.toString(), 2)}
                </span>
              </div>
              <div className="bal-row mt-2">
                <span className="text-muted" style={{ fontSize: 12 }}>{symbol} Holdings</span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: COIN_META[symbol].color }}>
                  {fmt(portfolio.holdings[symbol], 8)}
                </span>
              </div>
            </div>

            {/* Reputation breakdown */}
            <div className="rep-section mt-4">
              <div className="rep-header">
                <span className="badge badge-gold">{stats.total_profitable_trades} wins</span>
              </div>
              {SYMBOLS.map((s) => (
                <div key={s} className="rep-row">
                  <span style={{ color: COIN_META[s].color, fontWeight: 600, fontSize: 13 }}>
                    {COIN_META[s].icon} {s}
                  </span>
                  <div className="rep-bar-wrap">
                    <div
                      className="rep-bar"
                      style={{
                        '--pct': `${Math.min(100, stats[s].profitable_trades * 10)}%`,
                        '--col': COIN_META[s].color,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, minWidth: 36, textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {stats[s].profitable_trades}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 3: Order History ─────────────────────────────── */}
        <div className="card history-card">
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}> Order History</h2>
          {user.order_history.length === 0 ? (
            <p className="text-muted" style={{ fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
              No orders yet. Place your first trade above!
            </p>
          ) : (
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {[...user.order_history].reverse().map((o, i) => (
                    <tr key={i}>
                      <td className="text-muted">{user.order_history.length - i}</td>
                      <td style={{ color: COIN_META[o.symbol]?.color || '#fff', fontWeight: 600 }}>
                        {COIN_META[o.symbol]?.icon} {o.symbol}
                      </td>
                      <td>
                        <span className={`badge ${o.side === 'BUY' ? 'badge-green' : 'badge-sell'}`}>
                          {o.side}
                        </span>
                      </td>
                      <td className="mono">{fmt(o.quantity, 6)}</td>
                      <td className="mono">${fmt(o.price, 2)}</td>
                      <td className={`mono fw-600 ${o.side === 'BUY' ? 'text-red' : 'text-green'}`}>
                        {o.side === 'BUY' ? '-' : '+'}${fmt(o.total_cost, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <style>{`
       /* Header */
.dash-header {
  height: 56px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.profile-chip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
}
.avatar {
  width: 30px; height: 30px;
  background: var(--bg-surface);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px;
  color: var(--text-primary);
  flex-shrink: 0;
}
.profile-name { font-size: 13px; font-weight: 600; line-height: 1; }
.profile-uid  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

/* Body */
.dash-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 20px;
  padding-bottom: 40px;
}

/* Stats bar */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-card--coin { cursor: pointer; }
.stat-card--coin:hover { border-color: #3a4152; }
.stat-card.active { border-color: var(--accent); }
.stat-card--gold { border-top: 2px solid var(--gold); }
.stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.stat-value { font-size: 20px; font-weight: 700; line-height: 1.1; }

/* Main grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

.chart-card { padding: 20px; }

/* Symbol tabs */
.symbol-tabs { display: flex; border: 1px solid var(--border); }
.symbol-tab {
  background: none;
  border: none;
  border-right: 1px solid var(--border);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
}
.symbol-tab:last-child { border-right: none; }
.symbol-tab.active { background: var(--bg-elevated); color: var(--tab-color, var(--accent)); }
.symbol-tab:hover:not(.active) { color: var(--text-primary); }

/* Trade card */
.trade-card { padding: 20px; }
.form-group { display: flex; flex-direction: column; }
.cost-estimate {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  font-size: 13px;
  color: var(--text-secondary);
}
.cost-estimate .mono { color: var(--text-primary); font-weight: 600; }

/* Balance */
.balance-summary { display: flex; flex-direction: column; gap: 4px; }
.bal-row { display: flex; justify-content: space-between; align-items: center; }

/* Reputation */
.rep-section {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rep-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
}
.rep-row { display: flex; align-items: center; gap: 8px; }
.rep-bar-wrap { flex: 1; height: 4px; background: rgba(255,255,255,0.07); }
.rep-bar { height: 100%; width: var(--pct, 0%); background: var(--col, var(--accent)); }

/* Order history */
.history-card { padding: 20px; }
.history-table-wrap { overflow-x: auto; }
.history-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.history-table th {
  text-align: left;
  padding: 8px 14px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.history-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.history-table tr:hover td { background: rgba(255,255,255,0.02); }
.badge-sell {
  background: transparent;
  color: var(--red);
  border: 1px solid var(--red);
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
}
      `}</style>
    </div>
  );
}
