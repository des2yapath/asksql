from fastapi.testclient import TestClient

from app.main import app


def test_health_check_does_not_touch_the_database():
    # Uses the `with` form so the lifespan context manager actually runs -
    # this is the thing that would blow up if startup wasn't defensive about
    # the DB being unreachable (see main.py's try/except around the
    # schema-cache warmup).
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
