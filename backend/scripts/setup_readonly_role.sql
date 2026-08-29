-- Run this once, connected as the admin/owner role Neon gives you by
-- default (or your existing superuser), BEFORE pointing the backend's
-- DATABASE_URL at this database. The backend should never authenticate
-- with the owner role - if the SQL guardrail in app/sql_guard/validator.py
-- ever has a bug, this role is the actual backstop that keeps a bad query
-- from writing or dropping anything.
--
-- Swap 'change-me' for a real generated password and 'asksql' for your
-- actual database name before running.

CREATE ROLE app_readonly WITH LOGIN PASSWORD 'change-me';

GRANT CONNECT ON DATABASE asksql TO app_readonly;
GRANT USAGE ON SCHEMA public TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_readonly;

-- Without this, the grant above only covers tables that exist *right now*.
-- The next migration that adds a table silently leaves it unreadable (best
-- case) or - if someone "fixes" that by re-running a broad GRANT by hand -
-- an easy place to accidentally grant more than SELECT. Do it right once.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO app_readonly;

-- Belt and suspenders: explicitly deny writes even though a fresh role
-- shouldn't have them. Cheap insurance against a future GRANT mistake.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM app_readonly;

-- Sanity check after running this - connect as app_readonly and confirm:
--   INSERT INTO customers (name) VALUES ('test');  -- should fail
--   SELECT * FROM customers LIMIT 1;                -- should work
--
-- (This exact sequence was verified against a real local Postgres instance
-- while building this project - INSERT correctly returns
-- "permission denied for table customers".)
