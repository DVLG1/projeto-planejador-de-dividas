-- Schema inicial do Microplan (MySQL)
-- Ajustado para evitar truncamento em valores monetários e suportar cronograma longo

-- Apagar tabelas caso existam (apenas para desenvolvimento; Flyway normalmente roda em DB limpo)
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS dividas;
DROP TABLE IF EXISTS planos;
DROP TABLE IF EXISTS credores;
DROP TABLE IF EXISTS usuarios;

-- Usuários
CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  renda_mensal DECIMAL(19,2) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Credores
CREATE TABLE credores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  contato VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dívidas
CREATE TABLE dividas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  credor_id BIGINT NOT NULL,
  descricao VARCHAR(255) NOT NULL,
  saldo_atual DECIMAL(19,2) NOT NULL,
  taxa_juros_anual DECIMAL(10,4) NULL,
  parcela_minima DECIMAL(19,2) NOT NULL,
  vencimento_mensal INT NULL,
  CONSTRAINT fk_divida_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_divida_credor FOREIGN KEY (credor_id) REFERENCES credores(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Planos de quitação
CREATE TABLE planos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  usuario_id BIGINT NOT NULL,
  estrategia VARCHAR(50) NOT NULL,
  valor_disponivel_mensal DECIMAL(19,2) NOT NULL,
  data_criacao DATETIME NOT NULL,
  duracao_estimada_meses INT NULL,
  total_pago_estimado DECIMAL(19,2) NOT NULL,
  custo_total_juros DECIMAL(19,2) NOT NULL,
  detalhes LONGTEXT NULL,
  CONSTRAINT fk_plano_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Pagamentos (registro de pagamentos efetuados)
CREATE TABLE pagamentos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  divida_id BIGINT NOT NULL,
  data DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  valor DECIMAL(19,2) NOT NULL,
  tipo VARCHAR(20) NULL,
  observacao VARCHAR(500) NULL,
  CONSTRAINT fk_pag_divida FOREIGN KEY (divida_id) REFERENCES dividas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices úteis
CREATE INDEX idx_dividas_usuario ON dividas(usuario_id);
CREATE INDEX idx_dividas_credor ON dividas(credor_id);
CREATE INDEX idx_planos_usuario ON planos(usuario_id);
