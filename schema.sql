DROP TABLE IF EXISTS shareholders;
CREATE TABLE shareholders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    jurisdiction TEXT NOT NULL,
    percentage REAL NOT NULL
);

-- Insert initial shareholders
INSERT INTO shareholders (name, jurisdiction, percentage) VALUES 
('Royal Oak Capital Ltd', 'Mauritius', 30.0),
('Fml Capitol Ltd', 'Mauritius', 35.0),
('Pacific Maritime Administration Group', 'Mauritius', 35.0);