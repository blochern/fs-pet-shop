DROP TABLE IF EXISTS pets;

CREATE TABLE pets(
    id SERIAL PRIMARY KEY,
    name TEXT,
    age INT,
    kind TEXT
);