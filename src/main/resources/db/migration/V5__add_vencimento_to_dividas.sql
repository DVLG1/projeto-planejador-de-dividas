-- Adiciona coluna vencimento (DATE) na tabela dividas para armazenar a data completa do vencimento

ALTER TABLE dividas ADD COLUMN vencimento DATE NULL;
