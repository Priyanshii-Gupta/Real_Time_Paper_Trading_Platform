import React, { useState, useEffect, useRef, memo } from 'react';

// Map dropdown values to TradingView symbols
const SYMBOL_MAP = {
  BTC: 'BINANCE:BTCUSDT',
  ETH: 'BINANCE:ETHUSDT',
  SOL: 'BINANCE:SOLUSDT',
};

function TradingViewWidget({ symbol }) {
  const container = useRef(null);

  useEffect(() => {
    // Clear out the previous widget before mounting a new one
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
    return () => {
      if (container.current) container.current.innerHTML = '';
    };
  }, [symbol]);



  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/symbols/BTCUSD/?exchange=BINANCE"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">Crypto price</span>
        </a>
        <span className="trademark"> by TradingView</span>
      </div>
    </div>
  );
}

const MemoTradingViewWidget = memo(TradingViewWidget);

export default function CryptoChart({ symbol }) {
  return (
    <div style={{ height: '600px', width: '100%' }}>
      <MemoTradingViewWidget symbol={SYMBOL_MAP[symbol]} />
    </div>
  );
}
