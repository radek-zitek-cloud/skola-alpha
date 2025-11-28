"""Authentication utilities and JWT handling."""

import logging
import os
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import TokenData

logger = logging.getLogger(__name__)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# Security scheme
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if "sub" in to_encode and to_encode["sub"] is not None:
        to_encode["sub"] = str(to_encode["sub"])
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """Verify JWT token and return token data."""
    logger.debug(f"Verifying token: {token[:20] if token else 'None'}...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(f"Token payload: {payload}")
        user_id = payload.get("sub")
        email: str = payload.get("email")
        logger.debug(f"Extracted user_id: {user_id}, email: {email}")
        if user_id is None:
            logger.error("user_id is None in token payload")
            raise credentials_exception
        try:
            user_id_int = int(user_id)
        except (TypeError, ValueError):
            logger.error("user_id in token payload is not an integer")
            raise credentials_exception

        token_data = TokenData(user_id=user_id_int, email=email)
        return token_data
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token."""
    logger.debug("=== get_current_user called ===")
    logger.debug(f"Credentials: {credentials}")
    token = credentials.credentials
    logger.debug(f"Extracted token: {token[:20] if token else 'None'}...")
    token_data = verify_token(token)
    logger.debug(f"Token verified, looking up user_id: {token_data.user_id}")
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        logger.error(f"User not found for user_id: {token_data.user_id}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    logger.debug(f"User found: {user.id}, {user.email}")
    return user
