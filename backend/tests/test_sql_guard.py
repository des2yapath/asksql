"""
These tests matter more than almost anything else in the repo - this is the
one piece of code standing between "user asked a question" and "arbitrary
SQL ran against the database". If you're adding a new guardrail check, add
the corresponding test here in the same commit.
"""
import pytest

from app.sql_guard.validator import SqlValidationError, validate_and_sanitize

ALLOWED_TABLES = {"customers", "orders", "order_items", "products"}


def test_allows_plain_select():
    sql = "SELECT name FROM customers"
    result = validate_and_sanitize(sql, ALLOWED_TABLES, max_rows=200)
    assert "LIMIT 200" in result


def test_injects_limit_when_missing():
    sql = "SELECT id, name FROM customers ORDER BY name"
    result = validate_and_sanitize(sql, ALLOWED_TABLES, max_rows=50)
    assert result.rstrip().endswith("LIMIT 50")


def test_clamps_limit_when_too_high():
    sql = "SELECT id FROM orders LIMIT 100000"
    result = validate_and_sanitize(sql, ALLOWED_TABLES, max_rows=200)
    assert "LIMIT 200" in result
    assert "100000" not in result


def test_leaves_limit_alone_when_within_bounds():
    sql = "SELECT id FROM orders LIMIT 10"
    result = validate_and_sanitize(sql, ALLOWED_TABLES, max_rows=200)
    assert "LIMIT 10" in result


def test_rejects_insert():
    with pytest.raises(SqlValidationError):
        validate_and_sanitize("INSERT INTO customers (name) VALUES ('x')", ALLOWED_TABLES, 200)


def test_rejects_drop():
    with pytest.raises(SqlValidationError):
        validate_and_sanitize("DROP TABLE customers", ALLOWED_TABLES, 200)


def test_rejects_stacked_queries():
    # This is the classic injection pattern - a syntactically valid SELECT
    # followed by something destructive in the same string.
    with pytest.raises(SqlValidationError, match="multiple statements"):
        validate_and_sanitize("SELECT id FROM orders; DROP TABLE orders;", ALLOWED_TABLES, 200)


def test_rejects_table_outside_allowlist():
    with pytest.raises(SqlValidationError, match="pg_shadow"):
        validate_and_sanitize("SELECT * FROM pg_shadow", ALLOWED_TABLES, 200)


def test_rejects_information_schema_probing():
    with pytest.raises(SqlValidationError, match="system catalogs"):
        validate_and_sanitize(
            "SELECT table_name FROM information_schema.tables", ALLOWED_TABLES, 200
        )


def test_rejects_forbidden_function():
    with pytest.raises(SqlValidationError, match="pg_sleep"):
        validate_and_sanitize("SELECT pg_sleep(10)", ALLOWED_TABLES, 200)


def test_rejects_empty_query():
    with pytest.raises(SqlValidationError):
        validate_and_sanitize("", ALLOWED_TABLES, 200)


def test_allows_joins_across_allowed_tables():
    sql = """
        SELECT c.name, SUM(o.total_cents) AS total
        FROM customers c
        JOIN orders o ON o.customer_id = c.id
        GROUP BY c.name
        ORDER BY total DESC
        LIMIT 5
    """
    result = validate_and_sanitize(sql, ALLOWED_TABLES, max_rows=200)
    assert "customers" in result and "orders" in result
