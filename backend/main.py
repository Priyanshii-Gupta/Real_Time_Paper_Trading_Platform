"""
main.py – FastAPI entry point for the Real-Time Paper Trading Platform.
"""

from decimal import Decimal, InvalidOperation

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from models import UserCreate, TradeRequest, UserOut, TradeResponse
from security import (
    load_data,
    save_data,
    get_next_user_id,
    create_user_entry,
    register_user,
    execute_trade,
)

app = FastAPI(title="Paper Trading Platform API", version="1.0.0")

# ---------------------------------------------------------------------------
# CORS – allow React dev servers on :3000, :5173, and :5174
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# User endpoints
# ---------------------------------------------------------------------------

@app.get("/api/user/{user_id}", response_model=UserOut, tags=["users"])
def get_user(user_id: int):
    """Return a user profile by ID, or 404 if not found."""
    data = load_data()
    key  = str(user_id)
    if key not in data:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return data[key]


@app.post("/api/user/create", response_model=UserOut, status_code=201, tags=["users"])
def create_user(body: UserCreate):
    """Auto-generate a user_id ≥ 1001, create the user, persist, and return the profile."""
    return register_user(name=body.name.strip())

@app.post("/api/trade", response_model=TradeResponse, tags=["trading"])
def trade(body: TradeRequest):
    """Execute a BUY or SELL order and return the updated account state."""
    try:
        qty   = Decimal(body.quantity)
        price = Decimal(body.current_price)
    except InvalidOperation as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        result = execute_trade(
            user_id=body.user_id,
            symbol=body.symbol,
            side=body.side,
            quantity=qty,
            current_price=price,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return TradeResponse(
        message=f"{body.side} order executed successfully",
        usd_balance=result["usd_balance"],
        holdings=result["holdings"],
        stats=result["stats"],
        order=result["order"],
    )


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/api/health", tags=["system"])
def health():
    return {"status": "ok"}
    