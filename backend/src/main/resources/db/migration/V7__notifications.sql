-- In-app notifications for claims and handovers

CREATE TABLE notifications (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type            VARCHAR(40) NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    report_id       UUID,
    claim_id        UUID,
    handover_id     UUID,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notifications_type CHECK (
        type IN ('CLAIM_CREATED', 'CLAIM_APPROVED', 'CLAIM_REJECTED', 'HANDOVER_CONFIRMED')
    )
);

CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id) WHERE read_at IS NULL;
