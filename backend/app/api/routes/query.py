"""
The whole point of the product lives in this one route. Order of operations
matters here and is deliberately linear/readable - resist the urge to make
this "clever":

  1. Get the (cached) schema so the model knows what it's allowed to touch.
  2. Ask the model for SQL.
  3. If it asked for clarification instead, hand that straight back - don't
     run anything.
  4. Run the model's SQL through the guardrail. This can raise
     SqlValidationError, which core/exceptions.py turns into a 422.
  5. Execute inside a read-only, timeout-bounded transaction.

TODO: no multi-turn context yet - `conversation_id` is accepted and echoed
back but each question is answered from scratch. Real follow-ups like "now
filter that to just California" need the previous question + generated SQL
fed back into the prompt. Punted because it meaningfully complicates the
prompt (the model needs to know whether it's refining a previous query or
starting fresh) and this is already a lot of surface area for a first pass.
"""
import datetime
import decimal
import logging
import time
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.config import get_settings
from app.db import schema_introspection
from app.llm.nl_to_sql import generate_sql
from app.models.schemas import QueryRequest, QueryResponse, QueryResultData
from app.sql_guard.validator import validate_and_sanitize

router = APIRouter()
settings = get_settings()
logger = logging.getLogger("asksql.query")


@router.post("/query", response_model=QueryResponse)
async def run_query(payload: QueryRequest, session: AsyncSession = Depends(db_session)) -> QueryResponse:
    schema_cache = await schema_introspection.get_schema(session)

    llm_result = await generate_sql(
        question=payload.question,
        db_schema=settings.db_schema,
        schema_context=schema_cache.prompt_context,
    )

    if llm_result.needs_clarification or not llm_result.sql:
        return QueryResponse(
            needs_clarification=True,
            clarification_question=llm_result.clarification_question,
            explanation=llm_result.explanation,
        )

    allowed_tables = schema_introspection.allowed_table_names()
    safe_sql = validate_and_sanitize(llm_result.sql, allowed_tables, settings.max_result_rows)

    rows, execution_time_ms = await _execute_readonly(session, safe_sql)

    columns = list(rows[0].keys()) if rows else []

    return QueryResponse(
        sql=safe_sql,
        explanation=llm_result.explanation,
        result=QueryResultData(
            columns=columns,
            rows=rows,
            row_count=len(rows),
            # Heuristic, not exact: hitting the row cap could mean there's
            # more data, or it could mean the true result set happened to be
            # exactly this size. Good enough for a "showing first N" hint in
            # the UI without a second COUNT(*) round trip on every query.
            truncated=len(rows) >= settings.max_result_rows,
        ),
        execution_time_ms=round(execution_time_ms, 1),
    )


async def _execute_readonly(session: AsyncSession, safe_sql: str) -> tuple[list[dict], float]:
    # Both of these are transaction-scoped (SET LOCAL / SET TRANSACTION),
    # which matters because the connection may be coming through Neon's
    # PgBouncer pool in transaction mode - a session-scoped SET here would be
    # unreliable since PgBouncer can hand the *next* logical transaction a
    # different physical connection.
    await session.execute(text(f"SET LOCAL statement_timeout = {settings.query_timeout_ms}"))
    await session.execute(text("SET TRANSACTION READ ONLY"))

    start = time.perf_counter()
    result = await session.execute(text(safe_sql))
    rows = [_serialize_row(row) for row in result.mappings().all()]
    execution_time_ms = (time.perf_counter() - start) * 1000

    return rows, execution_time_ms


def _serialize_row(row) -> dict:
    # QueryResultData.rows is typed as list[dict[str, Any]] on purpose,
    # since the column set is dynamic - but "Any" means Pydantic won't
    # coerce Decimal/date/UUID for us on the way out, and json.dumps chokes
    # on all three. Money columns (numeric/decimal in Postgres) are the one
    # that's bitten this in practice, hence the explicit Decimal handling.
    return {key: _serialize_value(value) for key, value in row.items()}


def _serialize_value(value):
    if isinstance(value, decimal.Decimal):
        return float(value)
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (bytes, bytearray)):
        return value.hex()
    return value
