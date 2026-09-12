from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime
import random

app = FastAPI(title="Crypto Trading Simulator Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# Models
# -------------------------

class TradeRequest(BaseModel):
    token: str
    side: Literal["BUY", "SELL"]
    quantity: float = Field(..., gt=0, description="Quantity must be greater than 0")


# -------------------------
# State: User & Prices & History
# -------------------------

INITIAL_BALANCE = 10000.0

user = {
    "balance": INITIAL_BALANCE,
    "holdings": {
        "BTC": 0.0,
        "ETH": 0.0,
        "SOL": 0.0
    }
}

prices = {
    "BTC": 105000.0,
    "ETH": 4300.0,
    "SOL": 210.0
}

# In-memory trade history
trades = []


@app.get("/")
def home():
    return {"message": "Crypto Trading Simulator Backend", "status": "online"}


@app.get("/prices")
def get_prices():
    # Subtle random price tick simulation for real-time market feel
    for token in prices:
        # +/- 0.15% random drift
        change_pct = (random.random() - 0.5) * 0.003
        prices[token] = round(prices[token] * (1 + change_pct), 2)
    return prices


@app.get("/portfolio")
def get_portfolio():
    return user


@app.get("/trades")
def get_trades():
    return trades


@app.post("/trade")
def execute_trade(trade_req: TradeRequest):
    token = trade_req.token.upper()
    side = trade_req.side.upper()
    quantity = trade_req.quantity

    if token not in prices:
        return {"error": f"Token '{token}' is not supported. Available tokens: {list(prices.keys())}"}

    current_price = prices[token]
    total_cost = round(quantity * current_price, 2)

    if side == "BUY":
        if user["balance"] < total_cost:
            return {
                "error": f"Insufficient funds. Required: ${total_cost:,.2f}, Available: ${user['balance']:,.2f}"
            }
        user["balance"] = round(user["balance"] - total_cost, 2)
        user["holdings"][token] = round(user["holdings"].get(token, 0.0) + quantity, 6)
    elif side == "SELL":
        current_holding = user["holdings"].get(token, 0.0)
        if current_holding < quantity:
            return {
                "error": f"Insufficient holdings. You hold {current_holding} {token}, attempted to sell {quantity}"
            }
        user["holdings"][token] = round(current_holding - quantity, 6)
        user["balance"] = round(user["balance"] + total_cost, 2)
    else:
        return {"error": f"Invalid trade side: {side}. Must be BUY or SELL"}

    # Record trade
    trade_record = {
        "id": len(trades) + 1,
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "token": token,
        "side": side,
        "quantity": quantity,
        "price": current_price,
        "total": total_cost,
    }
    trades.insert(0, trade_record)

    return {
        "success": True,
        "message": f"Successfully executed {side} {quantity} {token} at ${current_price:,.2f}",
        "portfolio": user,
        "trade": trade_record
    }


@app.post("/reset")
def reset_portfolio():
    user["balance"] = INITIAL_BALANCE
    for t in user["holdings"]:
        user["holdings"][t] = 0.0
    trades.clear()
    return {"message": "Portfolio reset to initial state", "portfolio": user}