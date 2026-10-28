"""MOCK PAYMENT GATEWAY — simulates a provider like Stripe/Razorpay for a course project.
No real money moves and card details are validated, never stored or logged.
Only the payment *decision* is simulated; the order/stock logic is real (fulfill_order)."""
import re
import time
import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from ..deps import sb, current_user

router = APIRouter()

TEST_CARDS = {
    "4242424242424242": ("approved", None),
    "4000000000000002": ("declined", "Your card was declined."),
    "4000000000009995": ("declined", "Your card has insufficient funds."),
}

class PaymentIn(BaseModel):
    card_number: str
    expiry: str   # MM/YY
    cvc: str
    name: str

def _expired(expiry: str) -> bool:
    m = re.fullmatch(r"(\d{2})/(\d{2})", expiry.strip())
    if not m:
        return True
    month, year = int(m.group(1)), 2000 + int(m.group(2))
    today = date.today()
    return not (1 <= month <= 12) or (year, month) < (today.year, today.month)

@router.post("/{order_id}/pay")
def pay(order_id: str, body: PaymentIn, profile=Depends(current_user)):
    rows = sb.table("orders").select("*").eq("id", order_id).eq("user_id", profile["id"]).execute().data
    if not rows:
        raise HTTPException(404, "Order not found")
    if rows[0]["payment_status"] == "paid":
        raise HTTPException(409, "Order is already paid")

    card = re.sub(r"\s|-", "", body.card_number)
    if not re.fullmatch(r"\d{3,4}", body.cvc.strip()):
        raise HTTPException(422, "Invalid CVC")
    if _expired(body.expiry):
        raise HTTPException(402, "Your card has expired or the date is invalid.")
    if card not in TEST_CARDS:
        raise HTTPException(402, "Unknown card. Use a test card shown on the payment screen.")

    time.sleep(1)  # feel like a real gateway round-trip
    outcome, message = TEST_CARDS[card]
    if outcome == "declined":
        raise HTTPException(402, message)

    try:
        sb.rpc("fulfill_order", {"p_order_id": order_id,
                                 "p_payment_intent": f"mock_{uuid.uuid4().hex[:16]}"}).execute()
    except Exception as e:
        if "insufficient stock" in str(e):
            raise HTTPException(409, "A frame in your order just sold out. Please review your cart.")
        raise
    return {"status": "paid", "order_id": order_id}
