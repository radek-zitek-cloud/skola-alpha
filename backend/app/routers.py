"""API routers for authentication."""

import logging
import random
from datetime import timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func

from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    create_access_token,
    get_current_user,
)
from app.database import get_db
from app.models import MathAttempt, User, Vocabulary, WordAttempt
from app.schemas import (
    GoogleAuthRequest,
    MathAttemptCreate,
    MathStatistics,
    OAuthConfig,
    OperationStatistic,
    Token,
    UserResponse,
    VocabularyFilters,
    VocabularyResponse,
    VocabularyStatistics,
    WordAttemptCreate,
    WordStatistic,
)

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

        if auth_request.code_verifier:
            token_data["code_verifier"] = auth_request.code_verifier

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


@router.get("/auth/config", response_model=OAuthConfig, tags=["auth"])
def auth_config():
    """Expose OAuth configuration needed by the frontend."""
    if not GOOGLE_CLIENT_ID:
        logger.error("Google Client ID is not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth is not configured on the server",
        )

    return {"google_client_id": GOOGLE_CLIENT_ID}


@router.get("/vocabulary/filters", response_model=VocabularyFilters, tags=["vocabulary"])
def get_vocabulary_filters(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get available categories and levels for filtering."""
    categories = [
        r[0]
        for r in db.query(Vocabulary.category)
        .distinct()
        .filter(Vocabulary.category.isnot(None))
        .all()
    ]
    levels = [
        r[0]
        for r in db.query(Vocabulary.level)
        .distinct()
        .filter(Vocabulary.level.isnot(None))
        .all()
    ]
    
    # Get all valid combinations
    combinations = [
        {"category": r[0], "level": r[1]}
        for r in db.query(Vocabulary.category, Vocabulary.level)
        .distinct()
        .filter(Vocabulary.category.isnot(None))
        .filter(Vocabulary.level.isnot(None))
        .all()
    ]
    
    return {
        "categories": sorted(categories), 
        "levels": sorted(levels),
        "combinations": combinations
    }


@router.get("/vocabulary/statistics", response_model=VocabularyStatistics, tags=["vocabulary"])
def get_vocabulary_statistics(
    categories: list[str] = Query(None),
    levels: list[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get statistics for the selected vocabulary filters.
    """
    # Base query for vocabulary items matching filters
    vocab_query = db.query(Vocabulary)
    if categories:
        vocab_query = vocab_query.filter(Vocabulary.category.in_(categories))
    if levels:
        vocab_query = vocab_query.filter(Vocabulary.level.in_(levels))
    
    total_words = vocab_query.count()
    
    # Query for attempts on these words
    attempts_query = (
        db.query(
            Vocabulary.id,
            Vocabulary.czech,
            Vocabulary.english,
            func.count(WordAttempt.id).label("attempts"),
            func.sum(WordAttempt.typo_count).label("typos")
        )
        .join(WordAttempt, Vocabulary.id == WordAttempt.word_id)
        .filter(WordAttempt.user_id == current_user.id)
    )
    
    if categories:
        attempts_query = attempts_query.filter(Vocabulary.category.in_(categories))
    if levels:
        attempts_query = attempts_query.filter(Vocabulary.level.in_(levels))
        
    attempts_query = attempts_query.group_by(Vocabulary.id)
    
    results = attempts_query.all()
    
    total_attempts = sum(r.attempts for r in results)
    total_typos = sum((r.typos or 0) for r in results)
    words_learned = len(results)
    
    # Top typo words
    # Sort by typos descending, then attempts descending
    sorted_results = sorted(results, key=lambda x: (x.typos or 0, x.attempts), reverse=True)
    top_typo_words = [
        WordStatistic(
            czech=r.czech,
            english=r.english,
            typos=r.typos or 0,
            attempts=r.attempts
        )
        for r in sorted_results[:10]
        if (r.typos or 0) > 0
    ]
    
    # Top ratio words
    # Sort by ratio (typos/attempts) descending
    sorted_by_ratio = sorted(
        results, 
        key=lambda x: ((x.typos or 0) / x.attempts if x.attempts > 0 else 0), 
        reverse=True
    )
    top_ratio_words = [
        WordStatistic(
            czech=r.czech,
            english=r.english,
            typos=r.typos or 0,
            attempts=r.attempts
        )
        for r in sorted_by_ratio[:10]
        if (r.typos or 0) > 0
    ]
    
    return VocabularyStatistics(
        total_attempts=total_attempts,
        total_typos=total_typos,
        words_learned=words_learned,
        total_words=total_words,
        top_typo_words=top_typo_words,
        top_ratio_words=top_ratio_words
    )


@router.get("/vocabulary/random", response_model=VocabularyResponse, tags=["vocabulary"])
def get_random_word(
    categories: list[str] = Query(None),
    levels: list[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a random vocabulary word pair, prioritized by user's typo history.
    Words with more typos in the past have a higher chance of being selected.
    """
    # Query all words with their total typo count and attempt count for the current user
    query = (
        db.query(
            Vocabulary,
            func.coalesce(func.sum(WordAttempt.typo_count), 0).label("total_typos"),
            func.count(WordAttempt.id).label("attempt_count"),
        )
        .outerjoin(
            WordAttempt,
            (Vocabulary.id == WordAttempt.word_id)
            & (WordAttempt.user_id == current_user.id),
        )
    )

    if categories:
        query = query.filter(Vocabulary.category.in_(categories))
    if levels:
        query = query.filter(Vocabulary.level.in_(levels))

    results = query.group_by(Vocabulary.id).all()

    if not results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No vocabulary words found matching criteria",
        )

    words = []
    weights = []

    for word, total_typos, attempt_count in results:
        words.append(word)

        if attempt_count == 0:
            # High priority for unseen words
            weights.append(1000)
        else:
            # Base weight is 1. Add total_typos to increase probability for difficult words.
            weights.append(1 + total_typos)

    # Select one word based on weights
    selected_word = random.choices(words, weights=weights, k=1)[0]

    return selected_word


@router.post("/vocabulary/attempt", status_code=status.HTTP_201_CREATED, tags=["vocabulary"])
def record_attempt(
    attempt: WordAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a user's attempt at a word."""
    # Verify word exists
    word = db.query(Vocabulary).filter(Vocabulary.id == attempt.word_id).first()
    if not word:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Word not found",
        )

    db_attempt = WordAttempt(
        user_id=current_user.id,
        word_id=attempt.word_id,
        typo_count=attempt.typo_count,
    )
    db.add(db_attempt)
    db.commit()
    return {"status": "success"}


@router.post("/math/attempt", status_code=status.HTTP_201_CREATED, tags=["math"])
async def record_math_attempt(
    attempt: MathAttemptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a math attempt."""
    db_attempt = MathAttempt(
        user_id=current_user.id,
        operation=attempt.operation,
        operand1=attempt.operand1,
        operand2=attempt.operand2,
        result=attempt.result,
        remainder=attempt.remainder,
        max_number=attempt.max_number,
        false_attempts=attempt.false_attempts,
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return {"status": "success"}


@router.get("/math/statistics", response_model=MathStatistics, tags=["math"])
async def get_math_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get math statistics for the current user."""
    attempts = db.query(MathAttempt).filter(MathAttempt.user_id == current_user.id).all()

    total_attempts = len(attempts)
    operations_stats = {}

    for attempt in attempts:
        op = attempt.operation
        if op not in operations_stats:
            operations_stats[op] = {"attempts": 0, "false_attempts": 0}

        operations_stats[op]["attempts"] += 1
        operations_stats[op]["false_attempts"] += attempt.false_attempts

    return {
        "total_attempts": total_attempts,
        "operations": operations_stats,
    }
