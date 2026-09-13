"""Shared route dependencies.

TODO: this is where a real rate limiter belongs before this ever takes
public traffic - right now a single user could fire questions in a tight
loop and each one costs an LLM call plus a DB round trip. slowapi (Redis or
in-memory backed) is the natural fit; punted on it for now because the free
Render instance is single-process anyway and adding Redis is another free
tier to provision and another thing that can fall over during a demo.

TODO: no auth at all yet. Fine for a portfolio project pointed at a seeded
demo database with a read-only role, NOT fine the moment this connects to
anything with real user data - add an API key or JWT check here first.
"""
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal


async def db_session() -> AsyncIterator[AsyncSession]:
    async with AsyncSessionLocal() as session:
        yield session
