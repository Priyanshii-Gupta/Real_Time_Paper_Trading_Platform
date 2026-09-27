"""
Pydantic models for the Paper Trading Platform.
"""

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Display name for the new user")


class TradeRequest(BaseModel):
    user_id: int
    symbol: Literal["BTC", "ETH", "SOL"]
    side: Literal["BUY", "SELL"]
    quantity: str   # kept as string – Decimal conversion happens in route handler
    current_price: str  # kept as string – Decimal conversion happens in route handler

    @field_validator("quantity", "current_price")
    @classmethod
    def must_be_positive_decimal_string(cls, v: str) -> str:
        from decimal import Decimal, InvalidOperation
        try:
            d = Decimal(v)
        except InvalidOperation:
            raise ValueError(f"'{v}' is not a valid decimal number")
        if d <= 0:
            raise ValueError("Value must be greater than zero")
        return v


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class IdentityOut(BaseModel):
    name: str
    user_id: int


class HoldingsOut(BaseModel):
    BTC: str
    ETH: str
    SOL: str


class SymbolStats(BaseModel):
    profitable_trades: int


class StatsOut(BaseModel):
    BTC: SymbolStats
    ETH: SymbolStats
    SOL: SymbolStats
    total_profitable_trades: int


class PortfolioOut(BaseModel):
    usd_balance: str
    holdings: HoldingsOut
    stats: StatsOut


class UserOut(BaseModel):
    identity: IdentityOut
    portfolio: PortfolioOut
    order_history: list


class TradeResponse(BaseModel):
    message: str
    usd_balance: str
    holdings: HoldingsOut
    stats: StatsOut
    order: dict
