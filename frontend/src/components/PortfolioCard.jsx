import React from "react";

const ASSET_NAMES = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
};

export default function PortfolioCard({
  portfolio,
  prices,
  onSelectToken,
}) {
  if (!portfolio) return null;

  const cash = portfolio.balance || 0;
  const holdings = portfolio.holdings || {};

  // Compute values
  let cryptoTotal = 0;
  const assetValues = {};

  Object.keys(holdings).forEach((sym) => {
    const qty = holdings[sym] || 0;
    const price = prices[sym] || 0;
    const val = qty * price;
    assetValues[sym] = val;
    cryptoTotal += val;
  });

  const totalNetWorth = cash + cryptoTotal;
  const initialCapital = 10000.0;
  const pnlDollar = totalNetWorth - initialCapital;
  const pnlPercent = (pnlDollar / initialCapital) * 100;
  const isProfitable = pnlDollar >= 0;

  // Percentage allocations for progress bar
  const cashPct = totalNetWorth > 0 ? (cash / totalNetWorth) * 100 : 100;
  const btcPct = totalNetWorth > 0 ? ((assetValues.BTC || 0) / totalNetWorth) * 100 : 0;
  const ethPct = totalNetWorth > 0 ? ((assetValues.ETH || 0) / totalNetWorth) * 100 : 0;
  const solPct = totalNetWorth > 0 ? ((assetValues.SOL || 0) / totalNetWorth) * 100 : 0;

  return (
    <div className="card" id="portfolio-card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span style={{ color: "var(--accent-cyan)" }}>💼</span> Portfolio Summary
          </div>
          <div className="card-subtitle">Real-time paper trading valuation & assets</div>
        </div>
      </div>

      <div className="card-body">
        {/* Key Metrics */}
        <div className="portfolio-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Total Net Worth</span>
            <span className="metric-value">
              ${totalNetWorth.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span
              className={`metric-change ${isProfitable ? "positive" : "negative"}`}
            >
              {isProfitable ? "▲ +" : "▼ "}
              ${Math.abs(pnlDollar).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              ({pnlPercent >= 0 ? "+" : ""}
              {pnlPercent.toFixed(2)}%)
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Cash Balance (USD)</span>
            <span className="metric-value font-mono">
              ${cash.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="metric-change" style={{ color: "var(--text-muted)" }}>
              Available purchasing power
            </span>
          </div>
        </div>

        {/* Portfolio Asset Allocation Bar */}
        <div className="allocation-section">
          <div className="allocation-header">
            <span>Asset Allocation</span>
            <span>
              Cash {cashPct.toFixed(0)}% • Crypto {(100 - cashPct).toFixed(0)}%
            </span>
          </div>
          <div className="allocation-bar" title={`Cash: ${cashPct.toFixed(1)}%`}>
            <div
              className="bar-segment segment-cash"
              style={{ width: `${cashPct}%` }}
              title={`Cash: ${cashPct.toFixed(1)}%`}
            />
            <div
              className="bar-segment segment-btc"
              style={{ width: `${btcPct}%` }}
              title={`BTC: ${btcPct.toFixed(1)}%`}
            />
            <div
              className="bar-segment segment-eth"
              style={{ width: `${ethPct}%` }}
              title={`ETH: ${ethPct.toFixed(1)}%`}
            />
            <div
              className="bar-segment segment-sol"
              style={{ width: `${solPct}%` }}
              title={`SOL: ${solPct.toFixed(1)}%`}
            />
          </div>
        </div>

        {/* Holdings Breakdown Table */}
        <table className="holdings-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Holding</th>
              <th>Market Price</th>
              <th>Value (USD)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(holdings).map((sym) => {
              const qty = holdings[sym] || 0;
              const price = prices[sym] || 0;
              const val = assetValues[sym] || 0;

              return (
                <tr key={sym}>
                  <td>
                    <div className="asset-cell">
                      <span className="asset-sym">{sym}</span>
                      <span className="asset-name">{ASSET_NAMES[sym]}</span>
                    </div>
                  </td>
                  <td className="font-mono">
                    {qty.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="font-mono">
                    ${price.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>
                    ${val.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="action-pill-btn"
                      onClick={() => onSelectToken(sym)}
                    >
                      Trade
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
