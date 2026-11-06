-- Backfill de `localId` para datos VIEJOS que quedaron SIN sede al activar el
-- aislamiento por local (la columna se creó vacía). Se asignan al local MÁS
-- ANTIGUO (menor id) de su empresa = donde se crearon antes de tener varias
-- sedes. Solo toca filas con localId NULL y empresas que ya tienen algún local.
-- Es IDEMPOTENTE (se puede correr varias veces sin efecto adicional) y NO borra
-- nada: solo rellena la sede.

UPDATE "Customer" c
SET "localId" = (
  SELECT l.id FROM "Local" l
  WHERE l."companyId" = c."companyId"
  ORDER BY l.id ASC
  LIMIT 1
)
WHERE c."localId" IS NULL
  AND EXISTS (SELECT 1 FROM "Local" l WHERE l."companyId" = c."companyId");

UPDATE "Asset" a
SET "localId" = (
  SELECT l.id FROM "Local" l
  WHERE l."companyId" = a."companyId"
  ORDER BY l.id ASC
  LIMIT 1
)
WHERE a."localId" IS NULL
  AND EXISTS (SELECT 1 FROM "Local" l WHERE l."companyId" = a."companyId");
