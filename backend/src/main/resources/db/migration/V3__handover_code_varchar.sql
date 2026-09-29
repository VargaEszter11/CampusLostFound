-- Align handover_code with Hibernate VARCHAR mapping (avoids bpchar vs char validation mismatch).
ALTER TABLE handovers
    ALTER COLUMN handover_code TYPE VARCHAR(6);

ALTER TABLE handovers
    DROP CONSTRAINT IF EXISTS chk_handovers_code;

ALTER TABLE handovers
    ADD CONSTRAINT chk_handovers_code CHECK (handover_code ~ '^[0-9]{6}$');
