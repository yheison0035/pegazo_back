-- SEED DE PRUEBA (NO oficial). Sirve para validar el filtrado del calendario.
-- Reemplaza estas fechas y la UVT por las OFICIALES desde Plataforma → Calendario
-- tributario. Los títulos dicen "EJEMPLO" a propósito.

-- UVT de ejemplo (verificar valor oficial del año).
INSERT INTO "TaxParameter" ("key","year","value","createdAt","updatedAt")
VALUES ('UVT', 2026, 49799, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key","year") DO UPDATE SET "value" = EXCLUDED."value";

-- Fechas de ejemplo 2026. Empresa de prueba: NIT termina en 6, régimen ORDINARIO.
INSERT INTO "TaxDeadline"
  ("year","obligation","title","period","dueDate","nitDigits","regime","notes","active","createdAt","updatedAt")
VALUES
  (2026,'RENTA','EJEMPLO · Declaración de renta','Anual 2025','2026-12-10','6',NULL,'Dato de prueba, reemplazar',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  (2026,'IVA','EJEMPLO · Declaración de IVA','Bimestre 5','2026-09-16',NULL,NULL,'Dato de prueba, reemplazar',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  (2026,'RETEFUENTE','EJEMPLO · Retención en la fuente','Agosto','2026-09-08','6',NULL,'Dato de prueba, reemplazar',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  (2026,'ICA','EJEMPLO · ICA (no aplica a NIT 6)','Bimestre 5','2026-10-15','1',NULL,'Dato de prueba, reemplazar',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
  (2026,'RENTA','EJEMPLO · Renta Simple (no aplica a Ordinario)','Anual','2026-11-15',NULL,'SIMPLE','Dato de prueba, reemplazar',true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
