-- Campus Lost & Found initial schema

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    display_name    VARCHAR(255) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE items (
    id              UUID PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    category        VARCHAR(100)
);

CREATE TABLE reports (
    id                  UUID PRIMARY KEY,
    item_id             UUID NOT NULL REFERENCES items (id) ON DELETE RESTRICT,
    reporter_id         UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    type                VARCHAR(10) NOT NULL,
    status              VARCHAR(10) NOT NULL DEFAULT 'OPEN',
    location            VARCHAR(255) NOT NULL,
    occurred_on         DATE NOT NULL,
    reporter_contact    VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reports_type CHECK (type IN ('LOST', 'FOUND')),
    CONSTRAINT chk_reports_status CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT uq_reports_item_id UNIQUE (item_id)
);

CREATE TABLE claims (
    id                  UUID PRIMARY KEY,
    report_id           UUID NOT NULL REFERENCES reports (id) ON DELETE RESTRICT,
    claimant_id         UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    claimant_contact    VARCHAR(255) NOT NULL,
    reason              TEXT,
    status              VARCHAR(10) NOT NULL DEFAULT 'PENDING',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_claims_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE UNIQUE INDEX uq_claims_one_approved_per_report
    ON claims (report_id)
    WHERE status = 'APPROVED';

CREATE TABLE handovers (
    id              UUID PRIMARY KEY,
    claim_id        UUID NOT NULL REFERENCES claims (id) ON DELETE RESTRICT,
    handover_code   VARCHAR(6) NOT NULL,
    confirmed       BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at    TIMESTAMPTZ,
    CONSTRAINT uq_handovers_claim_id UNIQUE (claim_id),
    CONSTRAINT uq_handovers_code UNIQUE (handover_code),
    CONSTRAINT chk_handovers_code CHECK (handover_code ~ '^[0-9]{6}$')
);

CREATE INDEX idx_reports_status ON reports (status);
CREATE INDEX idx_reports_type ON reports (type);
CREATE INDEX idx_claims_report_id ON claims (report_id);
CREATE INDEX idx_claims_claimant_id ON claims (claimant_id);
