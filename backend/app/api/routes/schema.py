from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import db_session
from app.db import schema_introspection
from app.models.schemas import ColumnInfo, SchemaResponse, TableInfo

router = APIRouter()


@router.get("/schema", response_model=SchemaResponse)
async def get_schema(session: AsyncSession = Depends(db_session)) -> SchemaResponse:
    cache = await schema_introspection.get_schema(session)
    tables = [
        TableInfo(
            name=table_name,
            columns=[ColumnInfo(**col) for col in columns],
        )
        for table_name, columns in cache.tables.items()
    ]
    return SchemaResponse(tables=tables)
