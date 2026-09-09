"""
Async engine + session factory.

A couple of things here are not obvious unless you've been bitten by them:

1. We connect through Neon's pooled endpoint (PgBouncer, transaction mode).
   asyncpg uses the extended query protocol by default, which means it
   prepares statements server-side and caches them by name. PgBouncer in
   transaction pooling mode hands out a *different* physical connection per
   transaction, so a prepared statement from transaction A may not exist on
   the connection transaction B lands on -> random
   "prepared statement does not exist" errors under load. Setting
   statement_cache_size=0 disables asyncpg's client-side cache and forces it
   to use unnamed statements, which is the documented workaround.

2. SQLAlchemy's own connection pool (QueuePool) sits *on top of* PgBouncer's
   pool. On a free-tier deployment with a single backend instance this is
   fine with a small pool; if this ever runs as multiple replicas, remember
   PgBouncer has its own max client connections too - size accordingly.

TODO: this whole module assumes a single Postgres instance. If we ever need
read replicas for heavier analytical queries, split this into a write engine
and a read engine and route SELECTs to the replica.
"""
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings

settings = get_settings()

# asyncpg needs "postgresql+asyncpg://", Neon/most providers hand you a plain
# "postgresql://" connection string - normalize it here so people can paste
# the connection string straight from the Neon dashboard into .env.
_raw_url = settings.database_url
if _raw_url.startswith("postgresql://"):
    _raw_url = _raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif _raw_url.startswith("postgres://"):
    _raw_url = _raw_url.replace("postgres://", "postgresql+asyncpg://", 1)

engine: AsyncEngine = create_async_engine(
    _raw_url,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_pool_max_overflow,
    pool_pre_ping=True,  # cheap SELECT 1 before handing out a connection - saves you
                         # from "server closed the connection unexpectedly" after Neon
                         # scales its compute to zero on the free tier and wakes back up.
    pool_recycle=300,
    connect_args={
        "statement_cache_size": 0,  # see module docstring, point (1)
        "server_settings": {
            # Belt-and-suspenders timeout in case a request path forgets to
            # set one explicitly (see query.py, which sets it per-request too
            # so a single slow query can't be tuned by lowering this globally
            # and starving schema introspection).
            "statement_timeout": str(settings.query_timeout_ms),
        },
    },
)

AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False, class_=AsyncSession)


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    """Use as `async with get_session() as session:` for one-off scripts.

    Route handlers should prefer the `db_session` FastAPI dependency in
    app/api/deps.py instead, so lifecycle is tied to the request.
    """
    async with AsyncSessionLocal() as session:
        yield session
