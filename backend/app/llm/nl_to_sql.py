"""Ties prompts.py + client.py together and turns the model's raw JSON text
into a validated Python object. Nothing in this file talks to the database -
that's query.py's job, once it has a candidate SQL string in hand."""
import json
import logging

from pydantic import BaseModel, ValidationError

from app.llm import prompts
from app.llm.client import LlmRequestError, chat_json, strip_markdown_fences

logger = logging.getLogger("asksql.nl_to_sql")


class LlmSqlResult(BaseModel):
    sql: str | None
    explanation: str
    needs_clarification: bool
    clarification_question: str | None = None


class LlmResponseError(Exception):
    """The provider responded, but not with something we can use (malformed
    JSON, or JSON that doesn't match the expected shape). Distinct from
    LlmRequestError, which means the call itself never completed."""


async def generate_sql(question: str, db_schema: str, schema_context: str) -> LlmSqlResult:
    system_prompt = prompts.build_system_prompt(db_schema=db_schema, schema_context=schema_context)

    try:
        raw = await chat_json(system_prompt, question)
    except LlmRequestError:
        raise  # let the route handler turn this into a 502/504 - nothing to add here

    cleaned = strip_markdown_fences(raw)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.warning("Model returned non-JSON output: %r", raw[:500])
        raise LlmResponseError("The model's response couldn't be parsed as JSON.") from exc

    try:
        return LlmSqlResult(**data)
    except ValidationError as exc:
        logger.warning("Model JSON didn't match expected schema: %r", data)
        raise LlmResponseError("The model's response didn't match the expected format.") from exc
