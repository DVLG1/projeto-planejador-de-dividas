-- Cria tabelas de mock Serasa/Bacen e popula com pessoas e dívidas exemplo

CREATE TABLE serasa_persons (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cpf VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  score INT DEFAULT 500
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE serasa_dividas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  person_id BIGINT NOT NULL,
  credor VARCHAR(255) NOT NULL,
  valor DECIMAL(40,2) NOT NULL,
  vencimento DATE NULL,
  descricao VARCHAR(255) NULL,
  juros DECIMAL(5,2) NULL,
  CONSTRAINT fk_serasa_div_person FOREIGN KEY (person_id) REFERENCES serasa_persons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insere pessoas de exemplo com scores realistas
INSERT INTO serasa_persons (cpf, nome, score) VALUES
('12345678900','Alice Silva', 450),
('98765432100','Bruno Pereira', 820),
('11122233344','Carolina Souza', 310);

-- Inserir 2-5 dívidas por pessoa
INSERT INTO serasa_dividas (person_id, credor, valor, vencimento, descricao, juros) VALUES
-- Alice (3 dívidas) - valores ajustados para montantes mais plausíveis
((SELECT id FROM serasa_persons WHERE cpf='12345678900'), 'Nubank', 1250.00, '2025-10-10', 'Cartão de Crédito', 120.00),
((SELECT id FROM serasa_persons WHERE cpf='12345678900'), 'Bradesco', 15300.00, '2025-12-05', 'Empréstimo Pessoal', 35.00),
((SELECT id FROM serasa_persons WHERE cpf='12345678900'), 'Santander', 45050.00, '2025-11-20', 'Financiamento', 8.50),

-- Bruno (2 dívidas) - valores ajustados
((SELECT id FROM serasa_persons WHERE cpf='98765432100'), 'Banco do Brasil', 250000.00, '2025-09-15', 'Financiamento Imobiliário', 9.00),
((SELECT id FROM serasa_persons WHERE cpf='98765432100'), 'C6 Bank', 6000.00, '2025-12-01', 'Cartão de Crédito', 120.00),

-- Carolina (4 dívidas) - valores ajustados
((SELECT id FROM serasa_persons WHERE cpf='11122233344'), 'Nubank', 9000.00, '2025-08-30', 'Empréstimo Pessoal', 35.00),
((SELECT id FROM serasa_persons WHERE cpf='11122233344'), 'C6 Bank', 3000.00, '2025-10-05', 'Cartão de Crédito', 120.00),
((SELECT id FROM serasa_persons WHERE cpf='11122233344'), 'Bradesco', 4500.00, '2025-11-11', 'Cheque Especial', 240.00),
((SELECT id FROM serasa_persons WHERE cpf='11122233344'), 'Banco do Brasil', 1200.00, '2025-12-20', 'Microcrédito', 30.00);
