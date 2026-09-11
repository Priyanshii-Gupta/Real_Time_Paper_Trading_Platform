from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Crypto Trading Simulator Backend"}


@app.get("/prices")
def get_prices():
    return {
        "BTC": 105000,
        "ETH": 4300,
        "SOL": 210
    }