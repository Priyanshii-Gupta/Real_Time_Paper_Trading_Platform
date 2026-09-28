import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries } from 'lightweight-charts';

/**
 * Real-Time Chart Component using lightweight-charts
 * Connects to live price feeds via Binance WebSocket streams:
 * wss://stream.binance.com:9443/ws/<symbol>@kline_1m
 * Uses React useRef and useEffect to mount chart, handle window resizing,
 * and process tick updates via .update(). Ensures proper cleanup using
 * chart.remove() and ws.close() when unmounting.
 */
export default function Chart({ symbol = 'BTC', onPrice }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const wsRef = useRef(null);
  const onPriceRef = useRef(onPrice);

  // Keep callback ref fresh without re-triggering main effect
  useEffect(() => {
    onPriceRef.current = onPrice;
  }, [onPrice]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clean container before creating chart
    container.innerHTML = '';

    // 1. Initialize Lightweight Chart
    const chart = createChart(container, {
      layout: {
        background: { color: '#0f172a' },
        textColor: '#94a3b8',
        fontSize: 12,
        fontFamily: "'Inter', system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth || 600,
      height: 420,
    });

    chartRef.current = chart;

    // 2. Add Candlestick Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    seriesRef.current = candlestickSeries;

    // 3. Handle window resizing
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    const pair = `${symbol.toLowerCase()}usdt`;

    // 4. Fetch initial historical klines from Binance REST API
    const loadHistoricalData = async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}USDT&interval=1m&limit=100`
        );
        if (res.ok) {
          const raw = await res.json();
          const candles = raw.map((d) => ({
            time: Math.floor(d[0] / 1000),
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4]),
          }));
          candlestickSeries.setData(candles);
          if (candles.length > 0 && onPriceRef.current) {
            onPriceRef.current(candles[candles.length - 1].close);
          }
        }
      } catch (err) {
        console.warn('REST fallback error loading klines:', err);
      }
    };

    loadHistoricalData();

    // 5. Connect to live Binance WebSocket stream
    let ws;
    try {
      ws = new WebSocket(`wss://stream.binance.com:9443/ws/${pair}@kline_1m`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg && msg.k) {
            const k = msg.k;
            const candle = {
              time: Math.floor(k.t / 1000),
              open: parseFloat(k.o),
              high: parseFloat(k.h),
              low: parseFloat(k.l),
              close: parseFloat(k.c),
            };
            candlestickSeries.update(candle);
            if (onPriceRef.current) {
              onPriceRef.current(candle.close);
            }
          }
        } catch (e) {
          // ignore parsing error
        }
      };
    } catch (wsErr) {
      console.warn('WebSocket connection error:', wsErr);
    }

    // 6. Polling fallback for live price (updates live price display even if WS is blocked)
    const priceInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`
        );
        if (res.ok) {
          const data = await res.json();
          const p = parseFloat(data.price);
          if (onPriceRef.current) {
            onPriceRef.current(p);
          }
        }
      } catch (e) {}
    }, 3000);

    // Cleanup on unmount or symbol change
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(priceInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '420px',
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#0f172a',
      }}
    />
  );
}
