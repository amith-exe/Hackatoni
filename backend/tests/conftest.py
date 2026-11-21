# backend/tests/conftest.py
import os
os.environ["TESTING"] = "true"
os.environ["MOCK_WEATHER"] = "true"

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.db import db

@pytest.fixture(autouse=True)
def reset_database():
    """Reset the database to default seed state before each test."""
    db.seed_defaults()
    yield

@pytest.fixture
def client():
    return TestClient(app)
