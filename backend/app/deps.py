import logging
from fastapi import Depends, Header, HTTPException
from supabase import create_client
from .config import settings

log = logging.getLogger("uvicorn.error")
sb = create_client(settings.supabase_url, settings.supabase_service_key)

def current_user(authorization: str = Header(default="")):
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Missing token")
    try:
        user = sb.auth.get_user(token).user
    except Exception as e:
        log.error("get_user failed: %r", e)
        raise HTTPException(401, f"Invalid token: {e}")
    return sb.table("profiles").select("*").eq("id", user.id).single().execute().data

def require_admin(profile=Depends(current_user)):
    if profile["role"] != "admin":
        raise HTTPException(403, "Admin only")
    return profile