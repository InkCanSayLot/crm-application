DELETE FROM users WHERE email LIKE '%@emptyoperations.com';

INSERT INTO users (email, name, role) VALUES
('william@emptyad.com', 'William', 'CEO'),
('beck@emptyad.com', 'Beck', 'CGO'),
('roman@emptyad.com', 'Roman', 'CTO');

GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;