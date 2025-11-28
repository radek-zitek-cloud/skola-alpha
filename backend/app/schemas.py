"""Pydantic schemas for API request/response models."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""

    email: EmailStr
    name: Optional[str] = None
    picture: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a user."""

    google_id: str


class UserResponse(UserBase):
    """Schema for user response."""

    id: int
    google_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response."""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token payload data."""

    user_id: Optional[int] = None
    email: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication request."""

    code: str
    redirect_uri: str
    code_verifier: Optional[str] = None


class OAuthConfig(BaseModel):
    """Schema for exposing OAuth configuration details."""

    google_client_id: str


class VocabularyResponse(BaseModel):
    """Schema for vocabulary response."""

    id: int
    czech: str
    english: str
    category: Optional[str] = None
    level: Optional[str] = None

    class Config:
        from_attributes = True


class CategoryLevelPair(BaseModel):
    """Schema for category-level combination."""
    category: str
    level: str

class VocabularyFilters(BaseModel):
    """Schema for available vocabulary filters."""

    categories: list[str]
    levels: list[str]
    combinations: list[CategoryLevelPair]


class WordAttemptCreate(BaseModel):
    """Schema for creating a word attempt."""

    word_id: int
    typo_count: int
