
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Global patch for TradingView widget config to fix color representation error without altering Chart.jsx
(function patchTradingViewEmbed() {
  const sanitize = (str) => {
    if (typeof str === 'string' && (str.includes('rgba(46, 46, 46, 0.2)') || str.includes('gridColor') || str.includes('allow_symbol_change'))) {
      try {
        const config = JSON.parse(str);
        delete config.gridColor;
        delete config.backgroundColor;
        config.theme = 'dark';
        return JSON.stringify(config);
      } catch (e) {
        return str.replace(/rgba\(46,\s*46,\s*46,\s*0\.2\)/g, '#2e2e2e');
      }
    }
    return str;
  };

  ['innerHTML', 'textContent', 'text'].forEach((prop) => {
    const desc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, prop) ||
                 Object.getOwnPropertyDescriptor(Node.prototype, prop) ||
                 Object.getOwnPropertyDescriptor(Element.prototype, prop);
    if (desc && desc.set) {
      Object.defineProperty(HTMLScriptElement.prototype, prop, {
        set(val) {
          return desc.set.call(this, sanitize(val));
        },
        get() {
          return desc.get ? desc.get.call(this) : '';
        },
        configurable: true,
      });
    }
  });
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
