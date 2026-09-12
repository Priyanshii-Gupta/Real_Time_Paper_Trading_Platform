import React, { useState } from "react";

const TOKEN_DETAILS = {
  BTC: { name: "Bitcoin", symbol: "BTC", icon: "₿", colorClass: "token-icon-btc" },
  ETH: { name: "Ethereum", symbol: "ETH", icon: "Ξ", colorClass: "token-icon-eth" },
  SOL: { name: "Solana", symbol: "SOL", icon: "◎", colorClass: "token-icon-sol" },
};

export default function TradingControls({
  prices,
  portfolio,
  selectedToken,
  setSelectedToken,
  onTrade,
  isExecuting,
}) {
  const [side, setSide] = useState("BUY"); // "BUY" or "SELL"
  const [quantity, setQuantity] = useState("");
  const [activePct, setActivePct] = useState(null);

  const currentPrice = prices[selectedToken] || 0;
  const cashBalance = portfolio?.balance || 0;
  const tokenHolding = portfolio?.holdings?.[selectedToken] || 0;
  const numQuantity = parseFloat(quantity) || 0;
  const totalValue = numQuantity * currentPrice;

  // Calculate max allowable quantity
  const maxBuyQuantity = currentPrice > 0 ? cashBalance / currentPrice : 0;
  const maxSellQuantity = tokenHolding;
  const maxAvailable = side === "BUY" ? maxBuyQuantity : maxSellQuantity;

  // Handle Percentage Quick Selection
  const handleQuickPercent = (pct) => {
    setActivePct(pct);
    let qty = 0;
    if (side === "BUY") {
      qty = (maxBuyQuantity * pct) / 100;
    } else {
      qty = (maxSellQuantity * pct) / 100;
    }

    if (qty <= 0) {
      setQuantity("0");
    } else {
      // Precision formatting depending on asset
      const precision = selectedToken === "SOL" ? 4 : 6;
      setQuantity(qty.toFixed(precision));
    }
  };

  const handleQuantityChange = (val) => {
    setActivePct(null);
    setQuantity(val);
  };

  // Validation
  let validationError = null;
  if (numQuantity < 0) {
    validationError = "Quantity cannot be negative";
  } else if (numQuantity > 0) {
    if (side === "BUY" && totalValue > cashBalance) {
      validationError = `Insufficient cash. Need $${totalValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}, have $${cashBalance.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    } else if (side === "SELL" && numQuantity > tokenHolding) {
      validationError = `Insufficient ${selectedToken}. You hold ${tokenHolding.toFixed(4)}, tried to sell ${numQuantity}`;
    }
  }

  const isFormValid =
    numQuantity > 0 && !validationError && !isExecuting && currentPrice > 0;

  const handleSubmitTrade = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    onTrade(side, selectedToken, numQuantity).then((success) => {
      if (success) {
        setQuantity("");
        setActivePct(null);
      }
    });
  };

  // Est balances after trade
  const postCashBalance =
    side === "BUY" ? cashBalance - totalValue : cashBalance + totalValue;
  const postTokenHolding =
    side === "BUY" ? tokenHolding + numQuantity : tokenHolding - numQuantity;

  return (
    <div className="card trading-card" id="trading-controls-card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <span style={{ color: "var(--accent-indigo)" }}>⚡</span> Quick Trade
          </div>
          <div className="card-subtitle">Instant paper execution at market price</div>
        </div>
        <span className="order-type-badge">MARKET ORDER</span>
      </div>

      <div className="card-body">
        {/* BUY / SELL Tabs */}
        <div className="side-tabs">
          <button
            type="button"
            className={`side-tab-btn ${side === "BUY" ? "buy-active" : ""}`}
            onClick={() => {
              setSide("BUY");
              setActivePct(null);
            }}
            id="tab-buy"
          >
            BUY {selectedToken}
          </button>
          <button
            type="button"
            className={`side-tab-btn ${side === "SELL" ? "sell-active" : ""}`}
            onClick={() => {
              setSide("SELL");
              setActivePct(null);
            }}
            id="tab-sell"
          >
            SELL {selectedToken}
          </button>
        </div>

        {/* Asset Selector */}
        <div className="control-group">
          <div className="control-label-row">
            <span>Select Asset</span>
            <span>Market Price</span>
          </div>
          <div className="token-selector-grid">
            {Object.keys(TOKEN_DETAILS).map((sym) => {
              const info = TOKEN_DETAILS[sym];
              const price = prices[sym] || 0;
              const isSelected = selectedToken === sym;

              return (
                <button
                  key={sym}
                  type="button"
                  className={`token-btn ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    setSelectedToken(sym);
                    setActivePct(null);
                  }}
                  id={`token-select-${sym.toLowerCase()}`}
                >
                  <div className={`token-icon-wrapper ${info.colorClass}`}>
                    {info.icon}
                  </div>
                  <span className="token-btn-symbol">{sym}</span>
                  <span className="token-btn-price">
                    ${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Input Form */}
        <form onSubmit={handleSubmitTrade}>
          <div className="control-group">
            <div className="control-label-row">
              <span>Order Quantity</span>
              <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                {side === "BUY" ? (
                  <>Avail: ${cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                ) : (
                  <>Holdings: {tokenHolding.toFixed(4)} {selectedToken}</>
                )}
              </span>
            </div>

            <div className={`input-wrapper ${validationError ? "error" : ""}`}>
              <input
                id="trade-quantity-input"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                className="input-field font-mono"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                disabled={isExecuting}
              />
              <span className="input-suffix">{selectedToken}</span>
            </div>

            {/* Quick Percentage Chips */}
            <div className="quick-pct-row">
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  className={`pct-chip ${activePct === pct ? "active" : ""}`}
                  onClick={() => handleQuickPercent(pct)}
                >
                  {pct === 100 ? "MAX" : `${pct}%`}
                </button>
              ))}
            </div>

            {/* Validation Error Message */}
            {validationError && (
              <div className="validation-hint" id="validation-hint">
                <span>⚠</span> {validationError}
              </div>
            )}
          </div>

          {/* Order Calculations Breakdown Box */}
          <div className="order-summary-box">
            <div className="summary-row">
              <span className="summary-label">Execution Price</span>
              <span className="summary-val">
                ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Estimated Value</span>
              <span className="summary-val">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Trading Fee</span>
              <span className="summary-val" style={{ color: "var(--buy-green)" }}>
                $0.00 (Paper Free)
              </span>
            </div>
            <div className="summary-row summary-total">
              <span className="summary-label">
                {side === "BUY" ? "Est. Cash Remaining" : "Est. Cash After Sale"}
              </span>
              <span className="summary-val">
                ${Math.max(0, postCashBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Dynamic Submit Button */}
          <button
            id="trade-submit-button"
            type="submit"
            disabled={!isFormValid}
            className={`trade-action-btn ${side === "BUY" ? "btn-buy" : "btn-sell"}`}
          >
            {isExecuting ? (
              <>
                <span className="spinner"></span>
                <span>Executing Order...</span>
              </>
            ) : (
              <>
                <span>{side === "BUY" ? "BUY" : "SELL"} {selectedToken}</span>
                {numQuantity > 0 && (
                  <span style={{ opacity: 0.8, fontSize: "14px", fontWeight: "normal" }}>
                    (${(totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                  </span>
                )}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
