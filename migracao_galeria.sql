-- Execute no Supabase SQL Editor

-- Adicionar coluna galeria na tabela partners
ALTER TABLE partners ADD COLUMN IF NOT EXISTS galeria TEXT[] DEFAULT '{}';
