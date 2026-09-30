-- Allow Google-only accounts (no password) and store Google subject id

ALTER TABLE users
    ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
    ADD COLUMN google_sub VARCHAR(255);

CREATE UNIQUE INDEX uq_users_google_sub ON users (google_sub)
    WHERE google_sub IS NOT NULL;
