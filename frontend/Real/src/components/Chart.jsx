import React, { useState, useEffect, useRef, memo } from 'react';

const SYMBOL_MAP = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
};

function TradingViewWidget({ symbol }) {
  const container = useRef(null);

  useEffect(() => {
    container.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = 'calc(100% - 32px)';
    widgetDiv.style.width = '100%';
    container.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      allow_symbol_change: false,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: true,
      hide_legend: true,
      hide_volume: false,
      hotlist: false,
      interval: 'D',
      locale: 'en',
      save_image: false,
      style: '1',
      symbol,
      theme: 'light',
      timezone: 'Etc/UTC',
      backgroundColor: '#ffffff',
      gridColor: 'rgba(46, 46, 46, 0.2)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      support_host: 'https://www.tradingview.com',
      studies: [],
      autosize: true,
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    />
  );
}

const MemoTradingViewWidget = memo(TradingViewWidget);

export default function CryptoChart({ onPriceUpdate }) {
  const [coin, setCoin] = useState('BTC');

  // Poll price separately since the embed widget doesn't expose prices
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const pair = `${coin}USDT`;
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
        const data = await res.json();
        if (data.price && onPriceUpdate) {
          onPriceUpdate(parseFloat(data.price));
        }
      } catch (err) {
        console.error("Error fetching price tick:", err);
      }
    };

    fetchPrice(); // Initial fetch
    const interval = setInterval(fetchPrice, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [coin, onPriceUpdate]);

  return (
    <div style={{ height: '600px', width: '100%' }}>
      <select
        value={coin}
        onChange={(e) => setCoin(e.target.value)}
        style={{ marginBottom: '8px' }}
      >
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
        <option value="SOL">SOL</option>
      </select>

      <MemoTradingViewWidget symbol={SYMBOL_MAP[coin]} />
    </div>
  );
}