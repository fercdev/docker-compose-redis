CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price INT NOT NULL
);

INSERT INTO products (name, price) VALUES
('PC', 5000),
('Mouse', 120),
('Monitor', 800),
('Teclado', 150),
('Audifonos', 700);