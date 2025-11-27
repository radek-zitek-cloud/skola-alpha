"""API routers for authentication."""

import logging
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

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/auth/google", response_model=Token, tags=["auth"])
async def google_auth(auth_request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth2.

    Exchange the authorization code for user information and create/update user in database.
    """
    try:
        logger.debug("=== Starting Google Auth ===")
        logger.debug(f"GOOGLE_CLIENT_ID: {GOOGLE_CLIENT_ID[:20] if GOOGLE_CLIENT_ID else 'None'}...")
        logger.debug(f"GOOGLE_CLIENT_SECRET: {GOOGLE_CLIENT_SECRET[:20] if GOOGLE_CLIENT_SECRET else 'None'}...")
        logger.debug(f"Received auth request with code: {auth_request.code[:20]}...")
        logger.debug(f"Redirect URI: {auth_request.redirect_uri}")

        if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
            logger.error("Google OAuth credentials not configured")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Google OAuth is not configured on the server",
            )

        logger.debug(f"Google Client ID: {GOOGLE_CLIENT_ID[:20] if GOOGLE_CLIENT_ID else 'None'}...")

        # Exchange authorization code for access token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "code": auth_request.code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": auth_request.redirect_uri,
            "grant_type": "authorization_code",
        }

        logger.debug(f"Exchanging code for token at {token_url}")
        async with httpx.AsyncClient() as client:
            token_response = await client.post(token_url, data=token_data)

            logger.debug(f"Token response status: {token_response.status_code}")
            logger.debug(f"Token response body: {token_response.text}")

            if token_response.status_code != 200:
                logger.error(f"Failed to get token from Google: {token_response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to authenticate with Google",
                )

            tokens = token_response.json()
            access_token = tokens.get("access_token")
            logger.debug(f"Got access token: {access_token[:20] if access_token else 'None'}...")

            # Get user info from Google
            userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
            headers = {"Authorization": f"Bearer {access_token}"}
            logger.debug(f"Fetching user info from {userinfo_url}")
            userinfo_response = await client.get(userinfo_url, headers=headers)

            logger.debug(f"User info response status: {userinfo_response.status_code}")
            logger.debug(f"User info response body: {userinfo_response.text}")

            if userinfo_response.status_code != 200:
                logger.error(f"Failed to get user info from Google: {userinfo_response.text}")
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

        logger.debug(f"User info - Google ID: {google_id}, Email: {email}, Name: {name}")

        user = db.query(User).filter(User.google_id == google_id).first()

        if user:
            logger.debug(f"Updating existing user {user.id}")
            # Update existing user
            user.email = email
            user.name = name
            user.picture = picture
        else:
            logger.debug("Creating new user")
            # Create new user
            user = User(google_id=google_id, email=email, name=name, picture=picture)
            db.add(user)

        db.commit()
        db.refresh(user)
        logger.debug(f"User saved with ID: {user.id}")

        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": user.id, "email": user.email},
            expires_delta=access_token_expires,
        )

        logger.debug("JWT token created successfully")
        logger.debug("=== Google Auth Complete ===")
        return {"access_token": jwt_token, "token_type": "bearer"}

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.exception(f"Unexpected error during Google auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )


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
