from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .deps import current_user
from .routers import products, orders, payments

app = FastAPI(title="Easy EYE API")
app.add_middleware(CORSMiddleware, allow_origins=[settings.frontend_url],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(payments.router, prefix="/payments", tags=["payments (mock gateway)"])

@app.get("/me")
def me(profile=Depends(current_user)):
    return profile

@app.get("/health")
def health():
    return {"ok": True}
