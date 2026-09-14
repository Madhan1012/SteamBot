from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title = "SteamBot API",
    decription = "NL to SQL engine from Steam games",
    version = "0.1.0"  
)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(api_router, prefix = "/api")

@app.get("/")
def read_root():

    return {"status": "ok", "message": "API running"}