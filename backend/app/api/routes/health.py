from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    # Deliberately does NOT check the database connection. This gets hit by
    # Render's health check and by the frontend's cold-start probe (see
    # frontend/src/hooks/useBackendWakeUp.ts) - if it queried Postgres on
    # every call it would keep a Neon compute endpoint from ever scaling to
    # zero, which defeats the point of being on the free tier.
    return {"status": "ok"}
