from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from ..deps import sb, require_admin

router = APIRouter()

class ProductIn(BaseModel):
    name: str
    description: str = ""
    price: Decimal = Field(ge=0)
    stock_quantity: int = Field(ge=0)
    frame_shape: Optional[str] = None
    material: Optional[str] = None
    color: Optional[str] = None
    frame_details: dict = {}
    image_urls: list[str] = []

def _dump(p: ProductIn):
    d = p.model_dump()
    d["price"] = float(d["price"])
    return d

@router.get("")
def list_products(shape: str | None = None, material: str | None = None,
                  color: str | None = None, q: str | None = None):
    query = sb.table("products").select("*")
    if shape: query = query.eq("frame_shape", shape)
    if material: query = query.eq("material", material)
    if color: query = query.eq("color", color)
    if q: query = query.ilike("name", f"%{q}%")
    return query.execute().data

@router.get("/{product_id}")
def get_product(product_id: str):
    res = sb.table("products").select("*").eq("id", product_id).execute().data
    if not res: raise HTTPException(404, "Not found")
    return res[0]

@router.post("", dependencies=[Depends(require_admin)])
def create_product(body: ProductIn):
    return sb.table("products").insert(_dump(body)).execute().data[0]

@router.put("/{product_id}", dependencies=[Depends(require_admin)])
def update_product(product_id: str, body: ProductIn):
    return sb.table("products").update(_dump(body)).eq("id", product_id).execute().data[0]

@router.delete("/{product_id}", dependencies=[Depends(require_admin)])
def delete_product(product_id: str):
    sb.table("products").delete().eq("id", product_id).execute()
    return {"deleted": product_id}
