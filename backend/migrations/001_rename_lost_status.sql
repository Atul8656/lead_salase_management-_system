-- Run once on existing Supabase/PostgreSQL DB after deploying code that uses LOST instead of NOT_INTERESTED.
-- If your column stores enum *labels*, adjust the WHERE clause accordingly.

-- Example for text/varchar status storing Python enum values:
UPDATE leads SET status = 'lost' WHERE status IN ('not_interested', 'NOT_INTERESTED');

-- If you use a PostgreSQL ENUM type, you may need instead:
-- ALTER TYPE leadstatus RENAME VALUE 'not_interested' TO 'lost';
-- (exact syntax depends on how the enum was created)
