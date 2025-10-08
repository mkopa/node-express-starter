-- 002_seed_companies.sql
USE boarding;

INSERT INTO companies (name) VALUES ('ACME Corp'), ('Globex'), ('Initech')
ON DUPLICATE KEY UPDATE name = VALUES(name);
