from decimal import Decimal
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import sb, current_user, require_admin

router = APIRouter()

class Address(BaseModel):
    full_name: str
    line1: str
    line2: str = ""
    city: str
    postal_code: str
    country: str

class StatusIn(BaseModel):
    order_status: Literal["processing", "shipped", "delivered", "cancelled"]

@router.post("/checkout")
def checkout(address: Address, profile=Depends(current_user)):
    """Creates a pending order from the user's DB cart. Payment happens separately
    via /payments/{order_id}/pay. Prices come from the database, never the client."""
    cart = (sb.table("cart_items").select("quantity, products(*)")
            .eq("user_id", profile["id"]).execute().data)
    if not cart:
        raise HTTPException(400, "Cart is empty")
    total = Decimal("0")
    for row in cart:
        p = row["products"]
        if p["stock_quantity"] < row["quantity"]:
            raise HTTPException(409, f"Not enough stock for {p['name']}")
        total += Decimal(str(p["price"])) * row["quantity"]
    # remove this user's abandoned checkouts (order_items are deleted by cascade)
    sb.table("orders").delete().eq("user_id", profile["id"]).eq("payment_status", "pending").execute()
    order = sb.table("orders").insert({
        "user_id": profile["id"], "total_amount": float(total),
        "shipping_address": address.model_dump(),
    }).execute().data[0]
    sb.table("order_items").insert([{
        "order_id": order["id"], "product_id": r["products"]["id"],
        "quantity": r["quantity"], "price_at_purchase": r["products"]["price"],
    } for r in cart]).execute()
    return {"order_id": order["id"], "total": float(total)}

@router.get("/mine")
def my_orders(profile=Depends(current_user)):
    return (sb.table("orders").select("*, order_items(*, products(name))")
            .eq("user_id", profile["id"]).order("created_at", desc=True).execute().data)

@router.get("", dependencies=[Depends(require_admin)])
def all_orders():
    return (sb.table("orders").select("*, profiles(email, full_name), order_items(*, products(name))")
        .neq("payment_status", "pending").order("created_at", desc=True).execute().data)

@router.patch("/{order_id}/status", dependencies=[Depends(require_admin)])
def set_status(order_id: str, body: StatusIn):
    return sb.table("orders").update(body.model_dump()).eq("id", order_id).execute().data[0]
