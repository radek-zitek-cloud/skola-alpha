
from app.models import User, Vocabulary, WordAttempt
from app.auth import get_current_user
from app.main import app

def test_vocabulary_flow(client, db_session):
    # Create a user and a word
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    
    word1 = Vocabulary(czech="pes", english="dog", category="animals", level="simple")
    word2 = Vocabulary(czech="kocka", english="cat", category="animals", level="simple")
    db_session.add(word1)
    db_session.add(word2)
    db_session.commit()
    
    user_id = user.id
    word1_id = word1.id

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # 1. Get random word
    response = client.get("/vocabulary/random")
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "czech" in data
    assert "english" in data

    # 2. Record attempt
    attempt_data = {
        "word_id": word1_id,
        "typo_count": 5
    }
    response = client.post("/vocabulary/attempt", json=attempt_data)
    assert response.status_code == 201

    # 3. Verify attempt in DB
    attempts = db_session.query(WordAttempt).filter(WordAttempt.user_id == user_id).all()
    assert len(attempts) == 1
    assert attempts[0].typo_count == 5
    assert attempts[0].word_id == word1_id

    # 4. Get random word again
    response = client.get("/vocabulary/random")
    assert response.status_code == 200
