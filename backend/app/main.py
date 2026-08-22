import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, query, schema
from app.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.db.session import AsyncSessionLocal
from app.db import schema_introspection

settings = get_settings()
configure_logging(settings.environment)
logger = logging.getLogger("asksql.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm the schema cache on boot instead of waiting for the first user
    # question to pay the introspection cost. On Render's free tier this
    # only helps if the instance is already awake though - a cold start from
    # a fully spun-down container still eats the ~1 minute wake-up either
    # way, this just avoids stacking a schema query on top of that for the
    # very first request.
    try:
        async with AsyncSessionLocal() as session:
            await schema_introspection.get_schema(session, force_refresh=True)
        logger.info("Schema cache warmed on startup")
    except Exception:
        # Don't crash the whole app if the DB happens to be unreachable at
        # boot (e.g. Neon compute still spinning up) - the first real
        # request will just pay the introspection cost itself and log again
        # if it's still failing.
        logger.warning("Could not warm schema cache on startup - will retry on first request", exc_info=True)
    yield


app = FastAPI(
    title="AskSQL API",
    description="Turns natural language questions into validated, read-only SQL against Postgres.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(schema.router, prefix="/api", tags=["schema"])
app.include_router(query.router, prefix="/api", tags=["query"])
