
from datetime import date, timedelta

from app.auth import get_current_user
from app.main import app
from app.models import Habit, HabitCompletion, User


def test_create_habit(client, db_session):
    """Test creating a new habit."""
    # Create a user
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Create a habit
    habit_data = {"name": "Morning Exercise"}
    response = client.post("/habits", json=habit_data)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Morning Exercise"
    assert data["is_active"] is True
    assert "id" in data

    # Verify habit in DB
    habits = db_session.query(Habit).filter(Habit.user_id == user.id).all()
    assert len(habits) == 1
    assert habits[0].name == "Morning Exercise"


def test_get_habits(client, db_session):
    """Test getting all habits for a user."""
    # Create a user and habits
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    habit1 = Habit(user_id=user.id, name="Morning Exercise", is_active=True)
    habit2 = Habit(user_id=user.id, name="Read for 30 minutes", is_active=True)
    habit3 = Habit(user_id=user.id, name="Old Habit", is_active=False)
    db_session.add_all([habit1, habit2, habit3])
    db_session.commit()

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Get habits
    response = client.get("/habits")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2  # Only active habits
    assert data[0]["name"] in ["Morning Exercise", "Read for 30 minutes"]
    assert data[1]["name"] in ["Morning Exercise", "Read for 30 minutes"]


def test_toggle_habit_completion(client, db_session):
    """Test toggling habit completion for a specific date."""
    # Create a user and habit
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    habit = Habit(user_id=user.id, name="Morning Exercise")
    db_session.add(habit)
    db_session.commit()

    habit_id = habit.id

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Complete the habit for today
    today = date.today()
    toggle_data = {"completion_date": today.isoformat()}
    response = client.post(f"/habits/{habit_id}/toggle", json=toggle_data)
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

    # Verify completion in DB
    completions = db_session.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id
    ).all()
    assert len(completions) == 1
    assert completions[0].completion_date == today

    # Toggle again to uncomplete
    response = client.post(f"/habits/{habit_id}/toggle", json=toggle_data)
    assert response.status_code == 200
    assert response.json()["status"] == "uncompleted"

    # Verify completion removed from DB
    completions = db_session.query(HabitCompletion).filter(
        HabitCompletion.habit_id == habit_id
    ).all()
    assert len(completions) == 0


def test_get_habit_history(client, db_session):
    """Test getting habit completion history."""
    # Create a user and habit
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    habit = Habit(user_id=user.id, name="Morning Exercise")
    db_session.add(habit)
    db_session.commit()

    habit_id = habit.id

    # Create some completions
    today = date.today()
    completion1 = HabitCompletion(habit_id=habit_id, completion_date=today)
    completion2 = HabitCompletion(habit_id=habit_id, completion_date=today - timedelta(days=1))
    completion3 = HabitCompletion(habit_id=habit_id, completion_date=today - timedelta(days=5))
    db_session.add_all([completion1, completion2, completion3])
    db_session.commit()

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Get habit history
    response = client.get(f"/habits/{habit_id}/history")
    assert response.status_code == 200
    data = response.json()
    assert data["habit_id"] == habit_id
    assert data["habit_name"] == "Morning Exercise"
    assert len(data["completions"]) == 3
    assert today.isoformat() in data["completions"]
    assert (today - timedelta(days=1)).isoformat() in data["completions"]
    assert (today - timedelta(days=5)).isoformat() in data["completions"]


def test_get_habit_history_with_days_limit(client, db_session):
    """Test getting habit completion history with a custom days limit."""
    # Create a user and habit
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    habit = Habit(user_id=user.id, name="Morning Exercise")
    db_session.add(habit)
    db_session.commit()

    habit_id = habit.id

    # Create completions for different days
    today = date.today()
    completion1 = HabitCompletion(habit_id=habit_id, completion_date=today)
    completion2 = HabitCompletion(habit_id=habit_id, completion_date=today - timedelta(days=5))
    completion3 = HabitCompletion(habit_id=habit_id, completion_date=today - timedelta(days=10))
    db_session.add_all([completion1, completion2, completion3])
    db_session.commit()

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Get habit history for last 7 days
    response = client.get(f"/habits/{habit_id}/history?days=7")
    assert response.status_code == 200
    data = response.json()
    assert len(data["completions"]) == 2  # Only completions within 7 days


def test_toggle_habit_not_found(client, db_session):
    """Test toggling habit completion for a non-existent habit."""
    # Create a user
    user = User(google_id="test_user", email="test@example.com")
    db_session.add(user)
    db_session.commit()

    # Override auth dependency
    def override_get_current_user():
        return db_session.query(User).filter(User.google_id == "test_user").first()

    app.dependency_overrides[get_current_user] = override_get_current_user

    # Try to toggle a non-existent habit
    today = date.today()
    toggle_data = {"completion_date": today.isoformat()}
    response = client.post("/habits/99999/toggle", json=toggle_data)
    assert response.status_code == 404
    assert "Habit not found" in response.json()["detail"]
