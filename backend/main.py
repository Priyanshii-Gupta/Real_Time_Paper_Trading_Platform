from fastapi import FastAPI

app = FastAPI()


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