import logging
import sys


def configure_logging(environment: str) -> None:
    level = logging.INFO if environment == "production" else logging.DEBUG
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
    )
    # asyncpg is chatty at DEBUG about every query - drop it to WARNING so
    # local dev logs are actually readable.
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
