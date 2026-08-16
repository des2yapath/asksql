from typing import Any

from pydantic import BaseModel, Field


class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    # Not used for anything yet beyond echoing back - reserved for when we
    # add multi-turn context (see TODO in api/routes/query.py).
    conversation_id: str | None = None


class QueryResultData(BaseModel):
    columns: list[str]
    rows: list[dict[str, Any]]
    row_count: int
    truncated: bool  # true if the row cap kicked in, so the UI can say "showing first 200 of..."


class QueryResponse(BaseModel):
    sql: str | None = None
    explanation: str = ""
    needs_clarification: bool = False
    clarification_question: str | None = None
    result: QueryResultData | None = None
    execution_time_ms: float | None = None
    warning: str | None = None  # e.g. "LIMIT was reduced from 5000 to 200"


class ColumnInfo(BaseModel):
    name: str
    type: str
    nullable: bool
    primary_key: bool


class TableInfo(BaseModel):
    name: str
    columns: list[ColumnInfo]


class SchemaResponse(BaseModel):
    tables: list[TableInfo]
