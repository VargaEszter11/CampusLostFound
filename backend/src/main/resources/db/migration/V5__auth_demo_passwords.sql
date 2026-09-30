-- Demo password for seeded users: demo123
-- BCrypt hash generated with cost 10

UPDATE users
SET password_hash = '$2a$10$VVVf.1vmOMtpzKFnGafyxejxTxW1HFZcnqpprl5fAofsKLaYwhR2K'
WHERE password_hash IS NULL;

ALTER TABLE users
    ALTER COLUMN password_hash SET NOT NULL;
