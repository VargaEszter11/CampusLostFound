-- Run once as a Postgres superuser after installing PostgreSQL locally, e.g.:
--   psql -U postgres -f backend/create-db.sql
-- If the role or database already exists, skip the matching statement.

CREATE ROLE campus LOGIN PASSWORD 'campus';
CREATE DATABASE campus_lost_found OWNER campus;
