import React from "react";

export default function TradeHistory({ trades }) {
  const hasTrades = trades && trades.length > 0;

  return (
    <div className="card history-card" id="trade-history-card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span style={{ color: "var(--accent-purple)" }}>📜</span> Trade Execution Log
          </div>
          <div className="card-subtitle">Complete audit trail of paper orders</div>
        </div>
        <span
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            fontWeight: 600,
          }}
        >
          {hasTrades ? `${trades.length} Orders Filled` : "0 Orders"}
        </span>
      </div>

      <div className="card-body" style={{ padding: hasTrades ? "0" : "24px" }}>
        {!hasTrades ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
              No orders placed yet
            </div>
            <div style={{ fontSize: "13px" }}>
              Select an asset and enter a quantity in the trading controls to place your first paper order.
            </div>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Asset</th>
                <th>Side</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id || `${trade.timestamp}-${trade.token}-${trade.quantity}`}>
                  <td className="font-mono" style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    {trade.timestamp}
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {trade.token}
                  </td>
                  <td>
                    <span
                      className={`side-badge ${
                        trade.side === "BUY" ? "buy" : "sell"
                      }`}
                    >
                      {trade.side}
                    </span>
                  </td>
                  <td className="font-mono">
                    {Number(trade.quantity).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="font-mono">
                    ${Number(trade.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="font-mono" style={{ fontWeight: 600 }}>
                    ${Number(trade.total).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
