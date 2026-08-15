"""
Pulls the live table/column layout out of information_schema and turns it
into two things:

  - a compact DDL-ish string we feed the LLM as context (short enough to not
    blow the prompt budget on a wide schema)
  - a structured dict the frontend uses to render the schema browser sidebar

Cached in-process with a TTL because hitting information_schema on every
single chat message is wasteful - the schema basically never changes at
request time.

TODO: this cache is a plain module-level dict, which is fine for a single
Render instance but won't be coherent across replicas. If this ever needs to
run with >1 backend instance, move it to Redis (or just accept a short TTL
per-instance, which is honestly good enough for a schema that rarely
changes).
"""
import time
from dataclasses import dataclass, field

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings

settings = get_settings()

_COLUMNS_QUERY = text(
    """
    SELECT
        c.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        (
            SELECT true
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'PRIMARY KEY'
                AND tc.table_schema = c.table_schema
                AND tc.table_name = c.table_name
                AND kcu.column_name = c.column_name
        ) AS is_primary_key
    FROM information_schema.columns c
    WHERE c.table_schema = :schema_name
    ORDER BY c.table_name, c.ordinal_position
    """
)

_FOREIGN_KEYS_QUERY = text(
    """
    SELECT
        tc.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = :schema_name
    """
)


@dataclass
class SchemaCache:
    tables: dict[str, list[dict]] = field(default_factory=dict)
    foreign_keys: list[dict] = field(default_factory=list)
    prompt_context: str = ""
    fetched_at: float = 0.0

    def is_stale(self) -> bool:
        return (time.monotonic() - self.fetched_at) > settings.schema_cache_ttl_seconds


_cache = SchemaCache()


async def get_schema(session: AsyncSession, force_refresh: bool = False) -> SchemaCache:
    if force_refresh or _cache.is_stale() or not _cache.tables:
        await _refresh_schema(session)
    return _cache


async def _refresh_schema(session: AsyncSession) -> None:
    columns_result = await session.execute(_COLUMNS_QUERY, {"schema_name": settings.db_schema})
    fk_result = await session.execute(_FOREIGN_KEYS_QUERY, {"schema_name": settings.db_schema})

    tables: dict[str, list[dict]] = {}
    for row in columns_result.mappings():
        tables.setdefault(row["table_name"], []).append(
            {
                "name": row["column_name"],
                "type": row["data_type"],
                "nullable": row["is_nullable"] == "YES",
                "primary_key": bool(row["is_primary_key"]),
            }
        )

    foreign_keys = [dict(row) for row in fk_result.mappings()]

    _cache.tables = tables
    _cache.foreign_keys = foreign_keys
    _cache.prompt_context = _build_prompt_context(tables, foreign_keys)
    _cache.fetched_at = time.monotonic()


def _build_prompt_context(tables: dict[str, list[dict]], foreign_keys: list[dict]) -> str:
    """Compact, DDL-flavored text - not real CREATE TABLE syntax, just dense
    enough for the model to reason about column names/types without us
    spending a fortune on prompt tokens for a wide schema."""
    lines: list[str] = []
    for table_name, columns in tables.items():
        col_descriptions = []
        for col in columns:
            marker = " PK" if col["primary_key"] else ""
            col_descriptions.append(f"{col['name']} {col['type']}{marker}")
        lines.append(f"TABLE {table_name} ({', '.join(col_descriptions)})")

    if foreign_keys:
        lines.append("")
        lines.append("FOREIGN KEYS:")
        for fk in foreign_keys:
            lines.append(f"  {fk['from_table']}.{fk['from_column']} -> {fk['to_table']}.{fk['to_column']}")

    return "\n".join(lines)


def allowed_table_names() -> set[str]:
    return set(_cache.tables.keys())
