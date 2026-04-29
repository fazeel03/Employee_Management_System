import logging
import os

import jwt
from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

logger = logging.getLogger(__name__)

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is required but not set in environment variables")


def require_tenant_context(authorization: str = Header(default=None)) -> int:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            audience="employee-management-users",
            issuer="employee-management-system",
        )
    except jwt.PyJWTError as exc:
        logger.exception("JWT decode failed")
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc

    tenant_id = payload.get("tenantId") or payload.get("tenant_id")
    if not tenant_id:
        raise HTTPException(status_code=401, detail="Invalid authentication token")

    try:
        return int(tenant_id)
    except ValueError as exc:
        logger.exception("Tenant id in token is not an integer")
        raise HTTPException(status_code=401, detail="Invalid authentication token") from exc
