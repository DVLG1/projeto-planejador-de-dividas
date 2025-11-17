-- Reset script apenas para desenvolvimento
-- Usar manualmente quando quiser resetar o banco
-- NÃO usar em produção ou com Flyway normal
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS dividas;
DROP TABLE IF EXISTS planos;
DROP TABLE IF EXISTS credores;
DROP TABLE IF EXISTS usuarios;
