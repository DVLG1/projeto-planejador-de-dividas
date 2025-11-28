-- Adiciona usuario_id à tabela pagamentos para vinculação direta ao usuário
-- Melhora consultas, auditoria e integridade lógica

ALTER TABLE pagamentos
ADD COLUMN usuario_id BIGINT NOT NULL;

-- Adiciona foreign key
ALTER TABLE pagamentos
ADD CONSTRAINT fk_pag_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;

-- Cria índice para otimizar consultas por usuário
CREATE INDEX idx_pagamentos_usuario ON pagamentos(usuario_id);
