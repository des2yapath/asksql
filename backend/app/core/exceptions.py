"""
Central place to register exception -> HTTP response mappings.

The point of this module: route handlers raise plain domain exceptions
(SqlValidationError, LlmRequestError, etc.) and never construct
HTTPException themselves for these cases. That keeps app/api/routes/query.py
readable as "the happy path" instead of a wall of try/except, and it means
we control exactly what error detail leaks to the client in one place -
important since some of these exceptions wrap raw database errors that
could otherwise leak schema/internal details in a stack trace.
"""
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, SQLAlchemyError

from app.llm.client import LlmRequestError
from app.llm.nl_to_sql import LlmResponseError
from app.sql_guard.validator import SqlValidationError

logger = logging.getLogger("asksql.exceptions")


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(SqlValidationError)
    async def _sql_validation_error(request: Request, exc: SqlValidationError) -> JSONResponse:
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    @app.exception_handler(LlmResponseError)
    async def _llm_response_error(request: Request, exc: LlmResponseError) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": str(exc)})

    @app.exception_handler(LlmRequestError)
    async def _llm_request_error(request: Request, exc: LlmRequestError) -> JSONResponse:
        return JSONResponse(status_code=504, content={"detail": str(exc)})

    @app.exception_handler(DBAPIError)
    async def _db_timeout_error(request: Request, exc: DBAPIError) -> JSONResponse:
        # DBAPIError covers both driver-level failures and, notably, the
        # statement_timeout cancellation we set per-request in query.py -
        # asyncpg surfaces that as a QueryCanceledError wrapped in this.
        logger.warning("Database error while executing generated query: %s", exc)
        if "canceling statement due to statement timeout" in str(exc.orig):
            return JSONResponse(
                status_code=504,
                content={"detail": "The query took too long to run and was cancelled."},
            )
        # Deliberately generic - exc.orig can contain the actual failing SQL
        # and column names, which we don't want echoed back verbatim.
        return JSONResponse(
            status_code=422,
            content={"detail": "The database rejected the generated query. Try rephrasing the question."},
        )

    @app.exception_handler(SQLAlchemyError)
    async def _sqlalchemy_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("Unexpected SQLAlchemy error")
        return JSONResponse(status_code=500, content={"detail": "Something went wrong reaching the database."})
