from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import api
from auth_utils import hash_password
from database import Base, get_db
from login_rate_limit import LoginFailureLimiter
from models import User
from routers import auth


def test_five_failed_logins_return_429_then_recover_after_window(monkeypatch):
    now = [1000.0]
    monkeypatch.setattr(auth, "login_failures", LoginFailureLimiter(clock=lambda: now[0]))
    client, db, cleanup = _client_with_db()
    try:
        db.add(User(username="alice", email="alice@example.com", hashed_password=hash_password("correctpass")))
        db.commit()

        for _ in range(5):
            response = client.post("/auth/login", json={"email": "alice@example.com", "password": "wrongpass"})
            assert response.status_code == 401

        blocked = client.post("/auth/login", json={"email": "alice@example.com", "password": "correctpass"})
        assert blocked.status_code == 429
        assert int(blocked.headers["retry-after"]) == 300

        now[0] += 301
        assert client.post(
            "/auth/login", json={"email": "alice@example.com", "password": "correctpass"}
        ).status_code == 200
    finally:
        cleanup()
        db.close()


def test_success_clears_failures_and_other_email_is_not_blocked(monkeypatch):
    monkeypatch.setattr(auth, "login_failures", LoginFailureLimiter())
    client, db, cleanup = _client_with_db()
    try:
        db.add(User(username="bob", email="bob@example.com", hashed_password=hash_password("correctpass")))
        db.commit()

        for _ in range(4):
            assert client.post(
                "/auth/login", json={"email": "bob@example.com", "password": "wrongpass"}
            ).status_code == 401

        assert client.post(
            "/auth/login", json={"email": "bob@example.com", "password": "correctpass"}
        ).status_code == 200

        for _ in range(4):
            assert client.post(
                "/auth/login", json={"email": "bob@example.com", "password": "wrongpass"}
            ).status_code == 401

        assert client.post(
            "/auth/login", json={"email": "other@example.com", "password": "wrongpass"}
        ).status_code == 401
    finally:
        cleanup()
        db.close()


def test_limiter_bounds_memory_when_emails_are_rotated():
    limiter = LoginFailureLimiter(max_entries=2)
    limiter.record_failure("first")
    limiter.record_failure("second")
    limiter.record_failure("third")
    assert len(limiter._entries) == 2
    assert "first" not in limiter._entries


def _client_with_db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(bind=engine)
    testing_session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = testing_session()

    def override_get_db():
        yield db

    fastapi_app = api.app.app
    fastapi_app.dependency_overrides[get_db] = override_get_db
    return TestClient(api.app), db, fastapi_app.dependency_overrides.clear
