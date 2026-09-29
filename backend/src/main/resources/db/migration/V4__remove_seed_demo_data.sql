-- Remove former V2 demo reports/items (and any dependent claims/handovers).
-- Users from V2 are kept for mock login.

DELETE FROM handovers
WHERE claim_id IN (
    SELECT id FROM claims
    WHERE report_id IN (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'
    )
);

DELETE FROM claims
WHERE report_id IN (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'
);

DELETE FROM reports
WHERE id IN (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4'
);

DELETE FROM items
WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'
);
