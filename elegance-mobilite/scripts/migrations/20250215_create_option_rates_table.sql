CREATE TABLE option_rates (
  id SERIAL PRIMARY KEY,
  option_type VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

INSERT INTO option_rates (option_type, price) VALUES
('childSeat', 15.00),
('pets', 10.00);