-- Adiciona coluna cpf à tabela usuarios
ALTER TABLE usuarios
  ADD COLUMN cpf VARCHAR(20) NULL;

-- Cria índice único para cpf (ignora NULLs em MySQL padrão)
CREATE UNIQUE INDEX idx_usuarios_cpf_unique ON usuarios(cpf);
