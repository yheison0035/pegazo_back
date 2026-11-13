-- Nuevo tipo de negocio "Distribuidora" (mayorista genérico: masa/alimentos y
-- cualquier distribuidor). Agrega el valor al enum BusinessType.
-- Idempotente: ADD VALUE IF NOT EXISTS (se puede correr varias veces).
ALTER TYPE "BusinessType" ADD VALUE IF NOT EXISTS 'DISTRIBUIDORA';
