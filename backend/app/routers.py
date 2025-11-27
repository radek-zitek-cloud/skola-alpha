"""API routers for authentication."""

from datetime import timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    create_access_token,
    get_current_user,
)
from app.database import get_db
from app.models import User
from app.schemas import GoogleAuthRequest, Token, UserResponse

router = APIRouter()


@router.post("/auth/google", response_model=Token, tags=["auth"])
async def google_auth(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth2.

    Exchange the authorization code for user information and create/update user in database.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server",
        )

    # Exchange authorization code for access token
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": auth_request.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": auth_request.redirect_uri,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to authenticate with Google",
            )

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # Get user info from Google
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = await client.get(userinfo_url, headers=headers)

        if userinfo_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to get user information from Google",
            )

        user_info = userinfo_response.json()

    # Create or update user in database
    google_id = user_info.get("id")
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")

    user = db.query(User).filter(User.google_id == google_id).first()

    if user:
        # Update existing user
        user.email = email
        user.name = name
        user.picture = picture
    else:
        # Create new user
        user = User(google_id=google_id, email=email, name=name, picture=picture)
        db.add(user)

    db.commit()
    db.refresh(user)

    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=access_token_expires,
    )

    return {"access_token": jwt_token, "token_type": "bearer"}


@router.get("/auth/me", response_model=UserResponse, tags=["auth"])
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user


@router.post("/auth/logout", tags=["auth"])
def logout():
    """
    Logout endpoint.

    Since we're using JWT tokens, logout is handled client-side by removing the token.
    This endpoint exists for consistency and can be extended with token blacklisting if needed.
    """
    return {"message": "Successfully logged out"}
