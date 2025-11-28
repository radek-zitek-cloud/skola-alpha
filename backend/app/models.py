"""Database models."""

from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.database import Base


class User(Base):
    """User model for storing OAuth authenticated users."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Vocabulary(Base):
    """Vocabulary model for storing word pairs."""

    __tablename__ = "vocabulary"

    id = Column(Integer, primary_key=True, index=True)
    czech = Column(String, nullable=False)
    english = Column(String, nullable=False)
    category = Column(String, nullable=True)
