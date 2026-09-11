import { useEffect, useState } from "react";

function App() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetch("http://127.0.0.1:8000/prices")
      .then((response) => response.json())
      .then((data) => {
        setPrices(data);
      });
  }, []);

  return (
    <div>
      <h1>Crypto Trading Simulator</h1>

      <h2>Market Prices</h2>

      <p>BTC: ${prices.BTC}</p>
      <p>ETH: ${prices.ETH}</p>
      <p>SOL: ${prices.SOL}</p>
    </div>
  );
}

export default App;