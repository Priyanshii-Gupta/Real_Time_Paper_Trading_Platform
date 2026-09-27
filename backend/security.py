"""
security.py – Thread-safe JSON persistence layer.

All financial arithmetic uses decimal.Decimal exclusively.
Writes are atomic: data is flushed to a .tmp file then os.replace()d
over the real file to avoid corruption on process crash.
"""

import json
import os
import threading
from decimal import Decimal, ROUND_DOWN
from typing import Any

DATA_FILE = os.path.join(os.path.dirname(__file__), "data.json")
_lock = threading.Lock()

SUPPORTED_SYMBOLS = ["BTC", "ETH", "SOL"]

# Precision constants
USD_PREC   = Decimal("0.01")       # 2 decimal places for dollars
TOKEN_PREC = Decimal("0.00000001") # 8 decimal places for crypto


# ---------------------------------------------------------------------------
# Low-level helpers
# ---------------------------------------------------------------------------

def _load_raw() -> dict:
    """Read data.json without acquiring the lock (caller is responsible)."""
    if not os.path.exists(DATA_FILE):
        return {}
    with open(DATA_FILE, "r", encoding="utf-8") as fh:
        content = fh.read().strip()
    return json.loads(content) if content else {}


def _save_raw(data: dict) -> None:
    """Write to a .tmp file then atomically replace data.json (caller holds lock)."""
    tmp_path = DATA_FILE + ".tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2)
    os.replace(tmp_path, DATA_FILE)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_data() -> dict:
    """Thread-safe read of the whole data store."""
    with _lock:
        return _load_raw()


def save_data(data: dict) -> None:
    """Thread-safe atomic write of the whole data store."""
    with _lock:
        _save_raw(data)


def get_next_user_id(data: dict) -> int:
    """Return the next auto-increment user_id (min 1001)."""
    if not data:
        return 1001
    return max(int(k) for k in data.keys()) + 1


def create_user_entry(name: str, user_id: int) -> dict:
    """Build a fresh user record with default portfolio values."""
    return {
        "identity": {
            "name": name,
            "user_id": user_id,
        },
        "portfolio": {
            "usd_balance": "10000.00",
            "holdings": {sym: "0.00000000" for sym in SUPPORTED_SYMBOLS},
            "stats": {
                **{sym: {"profitable_trades": 0} for sym in SUPPORTED_SYMBOLS},
                "total_profitable_trades": 0,
            },
        },
        "order_history": [],
    }


# ---------------------------------------------------------------------------
# Trade execution – fully inside the lock
# ---------------------------------------------------------------------------

def execute_trade(
    user_id: int,
    symbol: str,
    side: str,
    quantity: Decimal,
    current_price: Decimal,
) -> dict:
    """
    Acquire lock → load → validate → mutate → save → release.

    Returns a dict with keys: usd_balance, holdings, stats, order.
    Raises ValueError with a human-readable message on validation failure.
    """
    with _lock:
        data = _load_raw()
        key = str(user_id)

        if key not in data:
            raise ValueError(f"User {user_id} not found")

        user = data[key]
        portfolio = user["portfolio"]

        usd_balance   = Decimal(portfolio["usd_balance"])
        holdings      = {s: Decimal(portfolio["holdings"][s]) for s in SUPPORTED_SYMBOLS}
        stats         = portfolio["stats"]

        trade_cost = (quantity * current_price).quantize(USD_PREC)

        if side == "BUY":
            if usd_balance < trade_cost:
                raise ValueError(
                    f"Insufficient USD balance. Required: ${trade_cost}, Available: ${usd_balance}"
                )
            usd_balance         -= trade_cost
            holdings[symbol]    += quantity

        else:  # SELL
            if holdings[symbol] < quantity:
                raise ValueError(
                    f"Insufficient {symbol} holdings. Required: {quantity}, Available: {holdings[symbol]}"
                )

            # --- Profitable-trade tracking -----------------------------------
            # Compute average buy price from order_history
            total_bought_qty  = Decimal("0")
            total_spent_usd   = Decimal("0")
            for order in user["order_history"]:
                if order["symbol"] == symbol and order["side"] == "BUY":
                    total_bought_qty += Decimal(order["quantity"])
                    total_spent_usd  += Decimal(order["total_cost"])

            if total_bought_qty > 0:
                avg_buy_price = (total_spent_usd / total_bought_qty).quantize(USD_PREC)
                if current_price > avg_buy_price:
                    stats[symbol]["profitable_trades"] += 1
                    stats["total_profitable_trades"]   += 1

            holdings[symbol] -= quantity
            usd_balance      += (quantity * current_price).quantize(USD_PREC)

        # Round & store
        usd_balance = usd_balance.quantize(USD_PREC)
        portfolio["usd_balance"] = f"{usd_balance:.2f}"
        for s in SUPPORTED_SYMBOLS:
            holdings[s] = holdings[s].quantize(TOKEN_PREC, rounding=ROUND_DOWN)
            portfolio["holdings"][s] = f"{holdings[s]:.8f}"
        portfolio["stats"] = stats

        # Build order record
        order: dict[str, Any] = {
            "symbol":        symbol,
            "side":          side,
            "quantity":      f"{quantity.quantize(TOKEN_PREC, rounding=ROUND_DOWN):.8f}",
            "price":         f"{current_price.quantize(USD_PREC):.2f}",
            "total_cost":    f"{trade_cost:.2f}",
        }
        user["order_history"].append(order)

        _save_raw(data)

        return {
            "usd_balance": portfolio["usd_balance"],
            "holdings":    {s: portfolio["holdings"][s] for s in SUPPORTED_SYMBOLS},
            "stats":       stats,
            "order":       order,
        }
