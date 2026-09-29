-- Demo users for mock login (names match frontend MOCK_USERS)

INSERT INTO users (id, display_name, email, password_hash, created_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Anna Kiss',   'anna.kiss@example.com',   NULL, NOW() - INTERVAL '10 days'),
    ('22222222-2222-2222-2222-222222222222', 'Bence Tóth',  'bence.toth@example.com',  NULL, NOW() - INTERVAL '10 days'),
    ('33333333-3333-3333-3333-333333333333', 'Csenge Nagy', 'csenge.nagy@example.com', NULL, NOW() - INTERVAL '10 days');
